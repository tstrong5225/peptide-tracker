"use client";

import { useActionState } from "react";
import Link from "next/link";
import formStyles from "@/components/ui/Form.module.css";
import { signIn, type SignInState } from "./actions";

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [state, formAction, isPending] = useActionState<SignInState, FormData>(
    signIn,
    null,
  );

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <input type="hidden" name="redirectTo" value={redirectTo} />
      {state?.error ? <div className={formStyles.error}>{state.error}</div> : null}
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
      <div className={formStyles.field}>
        <label className={formStyles.label} htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={formStyles.input}
        />
      </div>
      <button type="submit" disabled={isPending} className={formStyles.buttonPrimary}>
        {isPending ? "Signing in…" : "Sign In"}
      </button>
      <div className={formStyles.linkRow}>
        <Link href="/reset-password">Forgot your password?</Link>
      </div>
    </form>
  );
}
