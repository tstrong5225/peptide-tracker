import Link from "next/link";
import { signOut } from "@/app/actions";
import styles from "./AppHeader.module.css";

export function AppHeader({
  email,
  isAdmin,
}: {
  email: string;
  isAdmin: boolean;
}) {
  return (
    <header className={styles.header}>
      <div className={styles.bar}>
        <div className={styles.brand}>
          <div className={styles.brandTitle}>Peptide Tracker</div>
          <div className={styles.brandSubtitle}>Vial Dosage Manager</div>
        </div>
        <nav className={styles.nav}>
          <Link href="/" className={styles.navLink}>
            Vials
          </Link>
          {isAdmin ? (
            <Link href="/admin/invites" className={styles.navLink}>
              Invites
            </Link>
          ) : null}
        </nav>
        <div className={styles.right}>
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
