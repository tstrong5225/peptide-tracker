"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/actions";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BottomNav } from "@/components/BottomNav";
import styles from "./AppHeader.module.css";

const NAV = [
  { href: "/", label: "Vials" },
  { href: "/protocols", label: "Protocols" },
  { href: "/insights", label: "Insights" },
  { href: "/export", label: "Export" },
];

export function AppHeader({
  email,
  isAdmin,
  context,
}: {
  email: string;
  isAdmin: boolean;
  context?: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <>
      <header className={styles.header}>
        <div className={styles.bar}>
          <Link href="/" className={styles.brandLink}>
            <div className={styles.logoBox}>
              <Image
                src="/cinder-labs-logo.png"
                alt="Cinder Labs"
                height={30}
                width={88}
                style={{ height: 30, width: "auto", display: "block" }}
                priority
              />
            </div>
            <div className={styles.divider} />
            <div className={styles.brand}>
              <div className={styles.brandTitle}>Peptide Tracker</div>
              <div className={styles.brandSubtitle}>Vial Dosage Manager</div>
            </div>
          </Link>
          <nav className={styles.nav}>
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navLink} ${pathname === item.href ? styles.navLinkActive : ""}`}
              >
                {item.label}
              </Link>
            ))}
            {isAdmin ? (
              <Link
                href="/admin/invites"
                className={`${styles.navLink} ${pathname === "/admin/invites" ? styles.navLinkActive : ""}`}
              >
                Invites
              </Link>
            ) : null}
          </nav>
          <div className={styles.context}>{context}</div>
          <div className={styles.right}>
            <ThemeToggle variant="header" />
            <span className={styles.email}>{email}</span>
            {/* Desktop: sign out button */}
            <form action={signOut} className={styles.signOutForm}>
              <button type="submit" className={styles.signOut}>
                Sign Out
              </button>
            </form>
            {/* Mobile: profile icon link (replaces sign-out) */}
            <Link href="/profile" className={styles.profileIcon} title="Profile & Settings">
              <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" fill="none" />
                <path d="M4 19c0-3.866 3.134-7 7-7h2c3.866 0 7 3.134 7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
              </svg>
            </Link>
          </div>
        </div>
      </header>
      <BottomNav />
    </>
  );
}
