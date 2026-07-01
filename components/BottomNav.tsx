"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./BottomNav.module.css";

const TABS = [
  {
    href: "/",
    label: "Vials",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="8" y="1" width="6" height="5" rx="2" fill="currentColor" opacity="0.9" />
        <rect x="5.5" y="5.5" width="11" height="15" rx="3.5" fill="currentColor" opacity="0.2" />
        <rect x="5.5" y="5.5" width="11" height="9" rx="3.5" fill="currentColor" opacity="0.7" />
      </svg>
    ),
  },
  {
    href: "/protocols",
    label: "Protocols",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="3" y="2" width="16" height="18" rx="3" stroke="currentColor" strokeWidth="1.6" fill="none" />
        <line x1="7" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="7" y1="12" x2="15" y2="12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="7" y1="16" x2="11" y2="16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/insights",
    label: "Insights",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="3" y="13" width="4" height="6" rx="1" fill="currentColor" />
        <rect x="9" y="8" width="4" height="11" rx="1" fill="currentColor" opacity="0.7" />
        <rect x="15" y="3" width="4" height="16" rx="1" fill="currentColor" opacity="0.4" />
      </svg>
    ),
  },
  {
    href: "/export",
    label: "Export",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M11 3v10M7 9l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 15v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="Main navigation">
      {TABS.map((tab) => {
        const isActive = tab.href === "/" ? pathname === "/" || pathname.startsWith("/vials") : pathname.startsWith(tab.href);
        return (
          <Link key={tab.href} href={tab.href} className={`${styles.tab} ${isActive ? styles.tabActive : ""}`}>
            {tab.icon}
            {tab.label}
            <span className={styles.dot} />
          </Link>
        );
      })}
    </nav>
  );
}
