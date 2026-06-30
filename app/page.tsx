import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <AppHeader email={user.email || ""} isAdmin={!!profile?.is_admin} />
      <main
        style={{
          flex: 1,
          maxWidth: 1200,
          margin: "0 auto",
          padding: "28px 24px",
          width: "100%",
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: 20,
            boxShadow: "var(--pt-card-shadow)",
            padding: "32px 28px",
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
            You&apos;re signed in.
          </div>
          <p style={{ fontSize: 14, color: "var(--pt-muted)", lineHeight: 1.6 }}>
            The Vials dashboard is built in the next phase. For now this confirms
            auth, session isolation, and routing are working end to end.
          </p>
        </div>
      </main>
    </div>
  );
}
