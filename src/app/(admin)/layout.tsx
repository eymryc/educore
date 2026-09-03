"use client";

import { AuthGuard } from "@/presentation/components/auth/AuthGuard";
import { AdminLayoutShell } from "@/presentation/components/layout/AdminLayoutShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminLayoutShell>
      <AuthGuard area="admin">{children}</AuthGuard>
    </AdminLayoutShell>
  );
}
