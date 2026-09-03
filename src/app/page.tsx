"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/infrastructure/auth/AuthProvider";
import { homePathForUser } from "@/shared/lib/permissions";

export default function HomePage() {
  const { status, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (status === "authenticated" && user) {
      router.replace(homePathForUser(user));
      return;
    }
    router.replace("/login");
  }, [status, user, router]);

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <span className="material-symbols-outlined animate-spin text-[32px] text-on-surface-variant">
        progress_activity
      </span>
    </div>
  );
}
