"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/actions";
import { ThemeToggle } from "@/components/ThemeToggle";
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
    <header className={styles.header}>
      <div className={styles.bar}>
        <div className={styles.brand}>
          <div className={styles.brandTitle}>Peptide Tracker</div>
          <div className={styles.brandSubtitle}>Vial Dosage Manager</div>
        </div>
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
        {context}
        <div className={styles.right}>
          <ThemeToggle />
          <span className={styles.email}>{email}</span>
          <form action={signOut}>
            <button type="submit" className={styles.signOut}>
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
