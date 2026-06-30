"use client";

import styles from "./Modal.module.css";

export function Modal({
  onClose,
  maxWidth = 440,
  zIndex = 200,
  children,
}: {
  onClose: () => void;
  maxWidth?: number;
  zIndex?: number;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.overlay} style={{ zIndex }} onClick={onClose}>
      <div className={styles.card} style={{ maxWidth }} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className={styles.header}>
      <div className={styles.title}>{title}</div>
      {subtitle ? <div className={styles.subtitle}>{subtitle}</div> : null}
    </div>
  );
}

export function ModalBody({ children }: { children: React.ReactNode }) {
  return <div className={styles.body}>{children}</div>;
}
