import { LoginPageContent } from "@/presentation/components/auth/LoginPageContent";
import { AuthGuard } from "@/presentation/components/auth/AuthGuard";

export default function LoginPage() {
  return (
    <AuthGuard area="auth">
      <LoginPageContent />
    </AuthGuard>
  );
}
