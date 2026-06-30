import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const NCBI_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const CACHE_TTL_DAYS = 7;
const MAX_RESULTS = 5;

export type Citation = {
  title: string;
  source: string;
  year: string;
  pmid: string;
  url: string;
};

async function fetchFromPubMed(peptide: string): Promise<Citation[]> {
  const apiKey = process.env.NCBI_API_KEY ? `&api_key=${process.env.NCBI_API_KEY}` : "";
  const term = encodeURIComponent(`${peptide}[Title/Abstract]`);

  const searchRes = await fetch(
    `${NCBI_BASE}/esearch.fcgi?db=pubmed&term=${term}&retmax=${MAX_RESULTS}&retmode=json&sort=relevance${apiKey}`,
    { signal: AbortSignal.timeout(10000) },
  );
  if (!searchRes.ok) throw new Error(`esearch failed: ${searchRes.status}`);

  const searchData = (await searchRes.json()) as { esearchresult: { idlist: string[] } };
  const ids = searchData.esearchresult?.idlist ?? [];
  if (ids.length === 0) return [];

  const summaryRes = await fetch(
    `${NCBI_BASE}/esummary.fcgi?db=pubmed&id=${ids.join(",")}&retmode=json${apiKey}`,
    { signal: AbortSignal.timeout(10000) },
  );
  if (!summaryRes.ok) throw new Error(`esummary failed: ${summaryRes.status}`);

  const summaryData = (await summaryRes.json()) as {
    result: Record<string, { title?: string; fulljournalname?: string; source?: string; pubdate?: string }>;
  };

  return ids
    .map((pmid) => {
      const entry = summaryData.result[pmid];
      if (!entry) return null;
      const year = (entry.pubdate ?? "").slice(0, 4);
      return {
        title: entry.title ?? "",
        source: entry.fulljournalname || entry.source || "",
        year,
        pmid,
        url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
      };
    })
    .filter((c): c is Citation => !!c && !!c.title);
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ peptide: string }> }) {
  const { peptide } = await params;
  if (!peptide) return NextResponse.json({ citations: [] });

  // Require an authenticated session — this is an invite-only app.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const cutoff = new Date(Date.now() - CACHE_TTL_DAYS * 86400000).toISOString();

  // Check the shared cache first.
  const { data: cached } = await admin
    .from("reference_links")
    .select("title, source, year, pmid, url")
    .ilike("peptide", peptide)
    .gte("fetched_at", cutoff)
    .order("fetched_at", { ascending: false })
    .limit(MAX_RESULTS);

  if (cached && cached.length > 0) {
    return NextResponse.json({ citations: cached, cached: true });
  }

  // Cache miss — fetch from PubMed.
  let citations: Citation[] = [];
  try {
    citations = await fetchFromPubMed(peptide);
  } catch (err) {
    console.error("PubMed fetch failed:", err);
    return NextResponse.json({ citations: [], error: "PubMed unavailable" });
  }

  if (citations.length > 0) {
    // Refresh the cache: remove stale entries for this peptide and insert fresh ones.
    await admin.from("reference_links").delete().ilike("peptide", peptide);
    await admin.from("reference_links").insert(
      citations.map((c) => ({
        peptide: peptide.trim(),
        title: c.title,
        source: c.source,
        year: c.year ? parseInt(c.year) : null,
        pmid: c.pmid,
        url: c.url,
      })),
    );
  }

  return NextResponse.json({ citations });
}
