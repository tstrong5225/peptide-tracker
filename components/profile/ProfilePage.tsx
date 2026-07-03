"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationToggle } from "@/components/protocols/NotificationToggle";
import { signOut, deleteAccount } from "@/app/actions";
import styles from "./ProfilePage.module.css";

function formatJoinDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  } catch {
    return "";
  }
}

export function ProfilePage({
  email,
  isAdmin,
  joinedAt,
}: {
  email: string;
  isAdmin: boolean;
  joinedAt: string;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [testStatus, setTestStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [testError, setTestError] = useState<string | null>(null);

  async function sendTestNotification() {
    setTestStatus("sending");
    setTestError(null);
    try {
      const res = await fetch("/api/push/test", { method: "POST" });
      const json = await res.json() as { sent?: number; error?: string };
      if (!res.ok || json.error) {
        setTestError(json.error ?? "Failed to send.");
        setTestStatus("error");
      } else {
        setTestStatus("ok");
        setTimeout(() => setTestStatus("idle"), 4000);
      }
    } catch {
      setTestError("Network error.");
      setTestStatus("error");
    }
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteAccount();
      if (result?.error) setDeleteError(result.error);
    });
  }

  const initial = email[0]?.toUpperCase() ?? "?";

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <AppHeader email={email} isAdmin={isAdmin} />

      <main className={styles.main}>
        {/* Avatar + email */}
        <div className={styles.profileCard}>
          <div className={styles.avatar}>{initial}</div>
          <div className={styles.emailText}>{email}</div>
          {joinedAt ? (
            <div className={styles.joinedText}>Member since {formatJoinDate(joinedAt)}</div>
          ) : null}
        </div>

        {/* Appearance */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Appearance</div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Theme</span>
            <ThemeToggle />
          </div>
        </div>

        {/* Notifications */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Notifications</div>
          <div className={styles.row} style={{ alignItems: "flex-start", flexDirection: "column", gap: 10 }}>
            <NotificationToggle />
            <div style={{ fontSize: 12, color: "var(--pt-muted-2)", lineHeight: 1.5 }}>
              For notifications when the app is closed, open it from your home screen icon.
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <button
              type="button"
              onClick={sendTestNotification}
              disabled={testStatus === "sending"}
              style={{
                background: testStatus === "ok" ? "var(--pt-success-bg)" : "var(--pt-surface-soft)",
                color: testStatus === "ok" ? "var(--pt-success-fg)" : "var(--pt-muted)",
                border: `1.5px solid ${testStatus === "ok" ? "var(--pt-success-fg)" : "var(--pt-border-soft)"}`,
                borderRadius: 10,
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: 700,
                cursor: testStatus === "sending" ? "not-allowed" : "pointer",
                opacity: testStatus === "sending" ? 0.6 : 1,
              }}
            >
              {testStatus === "sending" ? "Sending…" : testStatus === "ok" ? "Sent! Check your notifications" : "Send test notification"}
            </button>
            {testStatus === "error" && testError ? (
              <div style={{ marginTop: 6, fontSize: 12, color: "var(--pt-danger-icon)" }}>{testError}</div>
            ) : null}
          </div>
        </div>

        {/* Data */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Data</div>
          <Link href="/export" className={styles.linkRow}>
            <span className={styles.rowLabel}>Export Data</span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>

        {/* Admin */}
        {isAdmin ? (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Admin</div>
            <Link href="/admin/invites" className={styles.linkRow}>
              <span className={styles.rowLabel}>Manage Invites</span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        ) : null}

        {/* Account actions */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Account</div>
          <form action={signOut}>
            <button type="submit" className={styles.signOutBtn}>
              Sign Out
            </button>
          </form>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className={styles.deleteBtn}
          >
            Delete Account
          </button>
        </div>
      </main>

      {/* Delete confirmation overlay */}
      {confirmDelete ? (
        <div className={styles.overlay} onClick={() => !isPending && setConfirmDelete(false)}>
          <div className={styles.confirmCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmTitle}>Delete your account?</div>
            <div className={styles.confirmBody}>
              All your data — vials, dose logs, and protocols — will be permanently removed. This cannot be undone.
            </div>
            {deleteError ? (
              <div style={{ fontSize: 13, color: "var(--pt-danger-icon)", marginBottom: 16 }}>{deleteError}</div>
            ) : null}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={isPending}
                className={styles.cancelBtn}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className={styles.confirmDeleteBtn}
                style={{ flex: 2 }}
              >
                {isPending ? "Deleting…" : "Delete Everything"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
