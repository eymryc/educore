"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import {
  isPortalNavActive,
  PARENT_PORTAL_NAV_ITEMS,
  PORTAL_NAV_ITEMS,
} from "@/shared/config/navigation";
import { NavigationProgressBar } from "@/presentation/components/layout/NavigationProgressBar";

interface PortalHeaderProps {
  title?: string;
  variant?: "student" | "parent";
}

export function PortalHeader({ title = "Tableau de bord", variant = "student" }: PortalHeaderProps) {
  return (
    <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] pt-safe">
      <div className="h-16 px-md flex items-center justify-between gap-sm">
        <div className="flex items-center gap-sm overflow-hidden">
          <div className="w-10 h-10 flex-shrink-0 bg-primary-container rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-on-tertiary-container">school</span>
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className="font-title-sm text-title-sm truncate">{title}</h1>
            {variant === "parent" && (
              <span className="font-label-caps text-label-caps uppercase text-on-surface-variant truncate">
                Espace parent
              </span>
            )}
          </div>
        </div>
        <Link
          href="/portal/profile"
          className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0"
        >
          <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
        </Link>
      </div>
    </header>
  );
}

interface PortalBottomNavProps {
  variant?: "student" | "parent";
}

export function PortalBottomNav({ variant = "student" }: PortalBottomNavProps) {
  const pathname = usePathname();
  const items = variant === "parent" ? PARENT_PORTAL_NAV_ITEMS : PORTAL_NAV_ITEMS;

  return (
    <nav className="fixed bottom-0 w-full z-50 bg-surface/80 backdrop-blur-xl pb-safe shadow-[0_-1px_8px_rgba(0,0,0,0.04)]">
      <div className="flex justify-between items-center h-16 px-sm">
        {items.map((item) => {
          const active = isPortalNavActive(pathname, item.href, items);
          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={
                active
                  ? "flex flex-col items-center justify-center flex-1 gap-xs transition-colors text-on-tertiary-container"
                  : "flex flex-col items-center justify-center flex-1 gap-xs text-on-surface-variant transition-colors"
              }
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="font-label-caps text-[10px] uppercase">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

interface PortalLayoutShellProps {
  children: React.ReactNode;
  title?: string;
  variant?: "student" | "parent";
}

export function PortalLayoutShell({
  children,
  title,
  variant = "student",
}: PortalLayoutShellProps) {
  return (
    <div className="bg-background font-body-md text-on-background min-h-screen">
      <Suspense fallback={null}>
        <NavigationProgressBar />
      </Suspense>
      <PortalHeader title={title} variant={variant} />
      <main className="relative w-full pt-16 pb-20 bg-background">{children}</main>
      <PortalBottomNav variant={variant} />
    </div>
  );
}
