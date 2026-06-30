import Image from "next/image";
import { ThemeToggle } from "@/components/ThemeToggle";
import styles from "./AuthShell.module.css";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brandRow}>
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
        </div>
        <ThemeToggle />
      </header>
      <main className={styles.main}>
        <div className={styles.card}>
          <div>
            <div className={styles.title}>{title}</div>
            {subtitle ? <div className={styles.subtitle}>{subtitle}</div> : null}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
