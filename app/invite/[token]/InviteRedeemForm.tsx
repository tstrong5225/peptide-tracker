"use client";

import { useActionState } from "react";
import formStyles from "@/components/ui/Form.module.css";
import { redeemInvite, type RedeemInviteState } from "./actions";

export function InviteRedeemForm({ token, email }: { token: string; email: string }) {
  const redeemInviteWithToken = redeemInvite.bind(null, token);
  const [state, formAction, isPending] = useActionState<RedeemInviteState, FormData>(
    redeemInviteWithToken,
    {},
  );

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {state.error ? <div className={formStyles.error}>{state.error}</div> : null}
      <div className={formStyles.field}>
        <label className={formStyles.label}>Email</label>
        <input type="email" value={email} disabled className={formStyles.input} />
      </div>
      <div className={formStyles.field}>
        <label className={formStyles.label} htmlFor="password">
          Choose a Password
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
        {isPending ? "Creating account…" : "Create Account"}
      </button>
    </form>
  );
}
