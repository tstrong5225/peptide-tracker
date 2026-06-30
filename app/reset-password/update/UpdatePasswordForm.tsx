"use client";

import { useActionState } from "react";
import formStyles from "@/components/ui/Form.module.css";
import { updatePassword, type UpdatePasswordState } from "./actions";

export function UpdatePasswordForm() {
  const [state, formAction, isPending] = useActionState<UpdatePasswordState, FormData>(
    updatePassword,
    {},
  );

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {state.error ? <div className={formStyles.error}>{state.error}</div> : null}
      <div className={formStyles.field}>
        <label className={formStyles.label} htmlFor="password">
          New Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={formStyles.input}
        />
      </div>
      <div className={formStyles.field}>
        <label className={formStyles.label} htmlFor="confirm">
          Confirm Password
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={formStyles.input}
        />
      </div>
      <button type="submit" disabled={isPending} className={formStyles.buttonPrimary}>
        {isPending ? "Saving…" : "Set New Password"}
      </button>
    </form>
  );
}
