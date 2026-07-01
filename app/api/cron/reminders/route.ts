import { NextResponse } from "next/server";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDoseDay, getProtocolStatus } from "@/lib/protocol-logic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_SUBJECT ?? "admin@example.com"}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "",
  process.env.VAPID_PRIVATE_KEY ?? "",
);

export async function GET(req: Request) {
  // Vercel passes CRON_SECRET in the Authorization header
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = createAdminClient();
  const now = new Date();
  const currentHour = now.getUTCHours();
  const currentMinute = now.getUTCMinutes();

  // Fetch all protocols with a reminder_time set
  const { data: protocols } = await supabase
    .from("protocols")
    .select("*")
    .not("reminder_time", "is", null);

  if (!protocols || protocols.length === 0) return NextResponse.json({ sent: 0 });

  // Filter to those whose reminder falls within this UTC hour
  const due = protocols.filter((p) => {
    if (!p.reminder_time) return false;
    if (getProtocolStatus(p, now) !== "active") return false;

    const [h, m] = (p.reminder_time as string).split(":").map(Number);
    if (Number.isNaN(h)) return false;
    // Match exact hour; only fire once per hour (within first 10 min window)
    if (h !== currentHour || currentMinute > 10) return false;

    // For xony, skip off days
    if (p.pattern === "xony") {
      const start = new Date(`${p.start_date as string}T00:00:00`);
      const todayStart = new Date(now);
      todayStart.setUTCHours(0, 0, 0, 0);
      const dayIndex = Math.round((todayStart.getTime() - start.getTime()) / 86400000);
      return isDoseDay(p, dayIndex);
    }
    return true;
  });

  if (due.length === 0) return NextResponse.json({ sent: 0 });

  // Collect unique user_ids
  const userIds = [...new Set(due.map((p) => p.user_id as string))];

  // Get all push subscriptions for those users
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("*")
    .in("user_id", userIds);

  if (!subs || subs.length === 0) return NextResponse.json({ sent: 0 });

  // Build a map: userId → list of protocol names due
  const userProtocols = new Map<string, string[]>();
  for (const p of due) {
    const uid = p.user_id as string;
    if (!userProtocols.has(uid)) userProtocols.set(uid, []);
    userProtocols.get(uid)!.push(p.peptide as string);
  }

  let sent = 0;
  await Promise.allSettled(
    subs.map(async (sub) => {
      const peptides = userProtocols.get(sub.user_id as string);
      if (!peptides) return;
      const title = "Peptide Tracker";
      const body =
        peptides.length === 1
          ? `Time for your ${peptides[0]} dose`
          : `Time for your doses: ${peptides.join(", ")}`;
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint as string, keys: { p256dh: sub.p256dh as string, auth: sub.auth as string } },
          JSON.stringify({ title, body }),
        );
        sent++;
      } catch (err: unknown) {
        // If subscription expired/invalid, remove it
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 410 || status === 404) {
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    }),
  );

  return NextResponse.json({ sent });
}
