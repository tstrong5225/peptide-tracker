import { AuthShell } from "@/components/auth/AuthShell";
import { UpdatePasswordForm } from "./UpdatePasswordForm";

export default function UpdatePasswordPage() {
  return (
    <AuthShell title="Set New Password" subtitle="Choose a new password for your account.">
      <UpdatePasswordForm />
    </AuthShell>
  );
}
