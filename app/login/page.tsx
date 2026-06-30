import { AuthShell } from "@/components/auth/AuthShell";
import formStyles from "@/components/ui/Form.module.css";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; inviteRedeemed?: string; error?: string }>;
}) {
  const { redirectTo, inviteRedeemed, error } = await searchParams;

  return (
    <AuthShell title="Sign In" subtitle="Access your peptide tracking dashboard.">
      {inviteRedeemed ? (
        <div className={formStyles.success}>Account created — sign in below.</div>
      ) : null}
      {error === "link-expired" ? (
        <div className={formStyles.error}>That link expired. Request a new one.</div>
      ) : null}
      <LoginForm redirectTo={redirectTo || "/"} />
    </AuthShell>
  );
}
