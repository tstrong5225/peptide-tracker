"use client";

import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0))).buffer as ArrayBuffer;
}

type Status = "unsupported" | "loading" | "denied" | "subscribed" | "unsubscribed";

export function NotificationToggle() {
  const [status, setStatus] = useState<Status>("loading");
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setStatus(sub ? "subscribed" : "unsubscribed");
    }).catch(() => setStatus("unsubscribed"));
  }, []);

  async function enable() {
    setWorking(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setStatus("denied"); return; }

      const reg = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) { setWorking(false); return; }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const json = sub.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
        }),
      });
      setStatus("subscribed");
    } catch {
      setStatus("unsubscribed");
    } finally {
      setWorking(false);
    }
  }

  async function disable() {
    setWorking(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setStatus("unsubscribed");
    } catch {
      // ignore
    } finally {
      setWorking(false);
    }
  }

  if (status === "unsupported" || status === "loading") return null;

  const isOn = status === "subscribed";

  return (
    <button
      type="button"
      onClick={isOn ? disable : enable}
      disabled={working || status === "denied"}
      title={
        status === "denied"
          ? "Notifications blocked — enable in browser settings"
          : isOn
          ? "Notifications on — click to turn off"
          : "Turn on push notifications for reminders"
      }
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        background: isOn ? "var(--pt-accent-soft-bg)" : "var(--pt-surface-soft)",
        border: `1.5px solid ${isOn ? "var(--pt-accent)" : "var(--pt-border-soft)"}`,
        borderRadius: 10,
        padding: "7px 13px",
        fontSize: 12,
        fontWeight: 700,
        color: isOn ? "var(--pt-accent-deep)" : "var(--pt-muted)",
        cursor: status === "denied" ? "not-allowed" : "pointer",
        opacity: working ? 0.6 : 1,
        flexShrink: 0,
      }}
    >
      {/* Bell icon — filled when on, outline when off */}
      <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
        {isOn ? (
          <>
            <path
              d="M10 2a6 6 0 0 0-6 6v3l-1.5 2.5h15L16 11V8a6 6 0 0 0-6-6z"
              fill="var(--pt-accent)"
            />
            <path d="M8 15.5a2 2 0 0 0 4 0" stroke="var(--pt-accent)" strokeWidth="1.5" fill="none" />
          </>
        ) : (
          <>
            <path
              d="M10 2a6 6 0 0 0-6 6v3l-1.5 2.5h15L16 11V8a6 6 0 0 0-6-6z"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
            />
            <path d="M8 15.5a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </>
        )}
      </svg>
      {status === "denied" ? "Blocked" : isOn ? "Notifications on" : "Enable notifications"}
    </button>
  );
}
