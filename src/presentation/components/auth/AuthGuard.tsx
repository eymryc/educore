"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/infrastructure/auth/AuthProvider";
import {
  homePathForUser,
  isAdminUser,
  isParentUser,
  isStudentUser,
} from "@/shared/lib/permissions";
import {
  ContentSkeleton,
  FormSkeleton,
} from "@/presentation/components/shared/DataTableSkeleton";

type GuardArea = "admin" | "portal" | "auth";

interface AuthGuardProps {
  area: GuardArea;
  children: React.ReactNode;
}

function AuthLoadingFallback({ area }: { area: GuardArea }) {
  if (area === "auth") {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-lg">
        <FormSkeleton fields={3} label="Chargement…" testId="auth-loading" />
      </div>
    );
  }

  if (area === "portal") {
    return (
      <div className="flex flex-col w-full gap-lg pb-xl max-w-5xl mx-auto px-md">
        <ContentSkeleton label="Chargement…" testId="auth-loading" variant="dashboard" />
      </div>
    );
  }

  return (
    <ContentSkeleton
      label="Chargement de la session…"
      testId="auth-loading"
      variant="page-table"
    />
  );
}

export function AuthGuard({ area, children }: AuthGuardProps) {
  const { user, status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "loading") return;

    if (area === "auth") {
      if (status === "authenticated" && user) {
        router.replace(homePathForUser(user));
      }
      return;
    }

    if (status !== "authenticated" || !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (area === "admin" && !isAdminUser(user)) {
      router.replace(homePathForUser(user));
      return;
    }

    if (area === "portal") {
      if (isAdminUser(user)) return;
      if (pathname.startsWith("/portal/student") && isParentUser(user)) {
        router.replace("/portal/parent");
        return;
      }
      if (pathname.startsWith("/portal/parent") && isStudentUser(user)) {
        router.replace("/portal/student");
      }
    }
  }, [area, status, user, router, pathname]);

  if (status === "loading") {
    return <AuthLoadingFallback area={area} />;
  }

  if (area === "auth") {
    if (status === "authenticated") return null;
    return <>{children}</>;
  }

  if (status !== "authenticated" || !user) return null;
  if (area === "admin" && !isAdminUser(user)) return null;

  return <>{children}</>;
}
