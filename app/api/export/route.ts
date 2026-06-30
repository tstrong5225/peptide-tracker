import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type ExportRow = {
  date: string;
  time: string;
  peptide: string;
  dose_mcg: number;
  units_used: string;
  site: string;
  notes: string;
  vendor: string;
  product_name: string;
  batch_number: string;
  coa_number: string;
};

async function getRows(
  userId: string,
  peptide: string,
  dateFrom: string,
  dateTo: string,
): Promise<ExportRow[]> {
  const admin = createAdminClient();

  let vialsQuery = admin.from("vials").select("id, name, vendor, product_name, batch_number, coa_number").eq("user_id", userId);
  if (peptide !== "all") vialsQuery = vialsQuery.ilike("name", peptide);
  const { data: vials } = await vialsQuery;
  if (!vials || vials.length === 0) return [];

  const vialIds = vials.map((v) => v.id);
  const vialMap = new Map(vials.map((v) => [v.id, v]));

  let dosesQuery = admin.from("dose_logs").select("*").in("vial_id", vialIds).order("logged_at", { ascending: true });
  if (dateFrom) dosesQuery = dosesQuery.gte("logged_at", `${dateFrom}T00:00:00`);
  if (dateTo) dosesQuery = dosesQuery.lte("logged_at", `${dateTo}T23:59:59`);
  const { data: doses } = await dosesQuery;

  return (doses ?? []).map((d) => {
    const vial = vialMap.get(d.vial_id)!;
    const ts = new Date(d.logged_at);
    return {
      date: ts.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      time: ts.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      peptide: vial?.name ?? "",
      dose_mcg: d.mcg_dose,
      units_used: d.units_used != null ? d.units_used.toFixed(1) : "—",
      site: d.site ?? "",
      notes: d.notes ?? "",
      vendor: vial?.vendor ?? "",
      product_name: vial?.product_name ?? "",
      batch_number: vial?.batch_number ?? "",
      coa_number: vial?.coa_number ?? "",
    };
  });
}

function buildCsv(rows: ExportRow[]): string {
  const headers = ["Date", "Time", "Peptide", "Dose (mcg)", "Units Used", "Site", "Notes", "Vendor", "Product", "Batch #", "COA #"];
  const escape = (v: string | number) => {
    const s = String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [r.date, r.time, r.peptide, r.dose_mcg, r.units_used, r.site, r.notes, r.vendor, r.product_name, r.batch_number, r.coa_number]
        .map(escape)
        .join(","),
    ),
  ];
  return lines.join("\r\n");
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const format = searchParams.get("format") ?? "csv";
  const peptide = searchParams.get("peptide") ?? "all";
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? "";

  const rows = await getRows(user.id, peptide, dateFrom, dateTo);

  if (format === "preview") {
    return NextResponse.json({ rows: rows.slice(0, 10), total: rows.length });
  }

  if (format === "csv") {
    const csv = buildCsv(rows);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="peptide-tracker-doses.csv"`,
      },
    });
  }

  if (format === "pdf") {
    const { renderToBuffer } = await import("@react-pdf/renderer");
    const { ExportPdfDoc } = await import("@/components/export/ExportPdfDoc");
    const { createElement } = await import("react");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(createElement(ExportPdfDoc, { rows, peptide, dateFrom, dateTo }) as any);
    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="peptide-tracker-doses.pdf"`,
      },
    });
  }

  return NextResponse.json({ error: "Unknown format" }, { status: 400 });
}
