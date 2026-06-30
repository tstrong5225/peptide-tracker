import { AuthShell } from "@/components/auth/AuthShell";
import { ResetRequestForm } from "./ResetRequestForm";

export default function ResetPasswordPage() {
  return (
    <AuthShell title="Reset Password" subtitle="We'll email you a link to set a new one.">
      <ResetRequestForm />
    </AuthShell>
  );
}
