import styles from "./ComingSoon.module.css";

export function ComingSoon({ title, body }: { title: string; body: string }) {
  return (
    <main className={styles.main}>
      <div className={styles.card}>
        <div className={styles.title}>{title}</div>
        <div className={styles.body}>{body}</div>
      </div>
    </main>
  );
}
