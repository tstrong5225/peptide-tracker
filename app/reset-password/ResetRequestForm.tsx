"use client";

import { useActionState } from "react";
import Link from "next/link";
import formStyles from "@/components/ui/Form.module.css";
import { requestPasswordReset, type ResetRequestState } from "./actions";

export function ResetRequestForm() {
  const [state, formAction, isPending] = useActionState<ResetRequestState, FormData>(
    requestPasswordReset,
    {},
  );

  if (state.success) {
    return (
      <div className={formStyles.success}>
        If that email has an account, a reset link is on its way. Check your inbox.
      </div>
    );
  }

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {state.error ? <div className={formStyles.error}>{state.error}</div> : null}
      <div className={formStyles.field}>
        <label className={formStyles.label} htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={formStyles.input}
        />
      </div>
      <button type="submit" disabled={isPending} className={formStyles.buttonPrimary}>
        {isPending ? "Sending…" : "Send Reset Link"}
      </button>
      <div className={formStyles.linkRow}>
        <Link href="/login">Back to sign in</Link>
      </div>
    </form>
  );
}
