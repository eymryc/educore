import { ForgotPasswordContent } from "@/presentation/components/auth/ForgotPasswordContent";
import { AuthGuard } from "@/presentation/components/auth/AuthGuard";

export default function ForgotPasswordPage() {
  return (
    <AuthGuard area="auth">
      <ForgotPasswordContent />
    </AuthGuard>
  );
}
