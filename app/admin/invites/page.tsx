import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { getCurrentUserOrRedirect } from "@/lib/get-current-user";
import { InviteForm } from "./InviteForm";
import styles from "./page.module.css";

export default async function AdminInvitesPage() {
  const { supabase, user, profile } = await getCurrentUserOrRedirect();

  if (!profile?.is_admin) redirect("/");

  const { data: invites } = await supabase
    .from("invites")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <AppHeader email={user.email || ""} isAdmin />
      <main className={styles.main}>
        <div className={styles.heading}>Invites</div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>Generate Invite</div>
          <InviteForm />
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>Sent Invites</div>
          {!invites || invites.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--pt-muted)" }}>No invites yet.</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Sent</th>
                </tr>
              </thead>
              <tbody>
                {invites.map((invite) => (
                  <tr key={invite.token}>
                    <td>{invite.email}</td>
                    <td>
                      <span
                        className={`${styles.badge} ${
                          invite.used_at ? styles.badgeUsed : styles.badgePending
                        }`}
                      >
                        {invite.used_at ? "Redeemed" : "Pending"}
                      </span>
                    </td>
                    <td>{new Date(invite.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
