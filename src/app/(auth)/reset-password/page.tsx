import { ResetPasswordContent } from "@/presentation/components/auth/ResetPasswordContent";
import { AuthGuard } from "@/presentation/components/auth/AuthGuard";

export default function ResetPasswordPage() {
  return (
    <AuthGuard area="auth">
      <ResetPasswordContent />
    </AuthGuard>
  );
}
