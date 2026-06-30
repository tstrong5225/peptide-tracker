"use client";

import { useActionState, useState } from "react";
import formStyles from "@/components/ui/Form.module.css";
import { createInvite, type CreateInviteState } from "./actions";

export function InviteForm() {
  const [state, formAction, isPending] = useActionState<CreateInviteState, FormData>(
    createInvite,
    {},
  );
  const [copied, setCopied] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <form
        action={formAction}
        style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}
      >
        <div className={formStyles.field} style={{ flex: 1, minWidth: 220 }}>
          <label className={formStyles.label} htmlFor="email">
            Invitee Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className={formStyles.input}
            placeholder="someone@example.com"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className={formStyles.buttonPrimary}
          style={{ flexShrink: 0, padding: "11px 20px" }}
        >
          {isPending ? "Generating…" : "Generate Invite"}
        </button>
      </form>
      {state.error ? <div className={formStyles.error}>{state.error}</div> : null}
      {state.link ? (
        <div className={formStyles.success} style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <code style={{ flex: 1, wordBreak: "break-all", fontSize: 12 }}>{state.link}</code>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(state.link!);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            style={{
              background: "var(--pt-surface)",
              border: "1.5px solid var(--pt-success-border)",
              borderRadius: 9,
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
