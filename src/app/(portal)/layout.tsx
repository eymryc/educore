"use client";

import { usePathname } from "next/navigation";
import { AuthGuard } from "@/presentation/components/auth/AuthGuard";
import { PortalLayoutShell } from "@/presentation/components/layout/PortalLayoutShell";
import { useAuth } from "@/infrastructure/auth/AuthProvider";
import { isParentUser } from "@/shared/lib/permissions";

const PAGE_TITLES: Record<string, string> = {
  "/portal/student": "Tableau de bord",
  "/portal/parent": "Tableau de bord",
  "/portal/schedule": "Emploi du temps",
  "/portal/assignments": "Devoirs",
  "/portal/grades": "Notes",
  "/portal/fees": "Frais et paiements",
  "/portal/notifications": "Notifications",
  "/portal/profile": "Mon profil",
};

function PortalLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const title = PAGE_TITLES[pathname] ?? "EduCore";
  const variant = isParentUser(user) ? "parent" : "student";

  return (
    <PortalLayoutShell title={title} variant={variant}>
      {children}
    </PortalLayoutShell>
  );
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalLayoutInner>
      <AuthGuard area="portal">{children}</AuthGuard>
    </PortalLayoutInner>
  );
}
