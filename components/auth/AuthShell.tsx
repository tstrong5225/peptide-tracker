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
        <div className={styles.brand}>
          <div className={styles.brandTitle}>Peptide Tracker</div>
          <div className={styles.brandSubtitle}>Vial Dosage Manager</div>
        </div>
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
