"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/infrastructure/auth/AuthProvider";
import { ADMIN_NAV_SECTIONS, isAdminNavActive } from "@/shared/config/navigation";

export function AdminSidebar({
  open = false,
  onClose,
  collapsed = false,
  onToggleCollapse,
}: {
  open?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const sync = () => setDesktop(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const compact = collapsed && desktop;

  return (
    <>
      {open && (
        <div
          aria-hidden="true"
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        aria-label="Navigation principale"
        className={`fixed left-0 top-0 h-full max-w-[85vw] bg-primary text-on-primary z-50 flex flex-col overflow-hidden shadow-xl transform transition-[width,transform] duration-200 ease-out lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        } ${compact ? "w-16" : "w-56"}`}
      >
        <div
          className={`h-20 shrink-0 flex items-center bg-surface-container-lowest text-on-surface border-b border-outline-variant/20 ${
            compact ? "px-sm justify-center gap-xs" : "px-lg gap-md"
          }`}
        >
          <div className="w-8 h-8 rounded bg-primary-container flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-on-primary-container text-[20px]">
              school
            </span>
          </div>
          {!compact && (
            <span className="font-headline-md text-title-sm tracking-tight truncate text-on-surface">
              EduCore
            </span>
          )}
          <button
            aria-label="Fermer le menu"
            className="ml-auto p-xs rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface lg:hidden"
            onClick={onClose}
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
          <button
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Développer le menu" : "Réduire le menu"}
            className={`hidden lg:inline-flex items-center justify-center w-8 h-8 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors ${
              collapsed ? "" : "ml-auto"
            }`}
            data-testid="sidebar-collapse-toggle"
            onClick={onToggleCollapse}
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">
              {collapsed ? "keyboard_double_arrow_right" : "keyboard_double_arrow_left"}
            </span>
          </button>
        </div>

        <nav
          className={`flex-1 min-h-0 overflow-y-auto py-md space-y-xs ${
            compact ? "px-xs" : "px-sm"
          }`}
        >
          {ADMIN_NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              {!compact ? (
                <div className="px-md py-xs text-label-caps text-on-primary/40 uppercase">
                  {section.title}
                </div>
              ) : (
                <div className="my-xs mx-auto w-6 border-t border-on-primary/15" aria-hidden />
              )}
              {section.items.map((item) => {
                const active = isAdminNavActive(pathname, item.href);
                return (
                  <Link
                    key={item.id}
                    aria-current={active ? "page" : undefined}
                    aria-label={compact ? item.label : undefined}
                    className={
                      active
                        ? `relative flex items-center py-sm transition-all bg-primary-container text-on-primary-container font-semibold rounded-lg ${
                            compact ? "justify-center px-sm" : "px-md"
                          }`
                        : `flex items-center py-sm rounded-lg text-body-sm text-on-primary/70 hover:bg-primary-container hover:text-on-primary-container transition-all ${
                            compact ? "justify-center px-sm" : "px-md"
                          }`
                    }
                    data-active={active ? "true" : undefined}
                    href={item.href}
                    onClick={onClose}
                    title={compact ? item.label : undefined}
                  >
                    {active && (
                      <span
                        aria-hidden
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-tertiary"
                      />
                    )}
                    <span
                      className={`material-symbols-outlined text-[20px] ${
                        compact ? "" : "mr-sm"
                      }`}
                    >
                      {item.icon}
                    </span>
                    {!compact && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <footer
          className={`shrink-0 bg-surface-container-lowest text-on-surface border-t border-outline-variant/20 ${
            compact ? "px-xs py-sm" : "px-sm py-sm"
          }`}
          data-testid="sidebar-footer"
        >
          {!compact ? (
            <div className="grid grid-cols-2 gap-xs">
              <Link
                className="inline-flex items-center justify-center gap-xs h-9 rounded-lg text-[12px] font-medium text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
                href="/settings"
                onClick={onClose}
              >
                <span className="material-symbols-outlined text-[18px]">settings</span>
                Réglages
              </Link>
              <button
                className="inline-flex items-center justify-center gap-xs h-9 rounded-lg text-[12px] font-medium text-error hover:bg-error-container/40 transition-colors"
                onClick={() => {
                  onClose?.();
                  void logout();
                }}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Quitter
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-xs">
              <Link
                aria-label="Paramètres"
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
                href="/settings"
                onClick={onClose}
                title="Paramètres"
              >
                <span className="material-symbols-outlined text-[18px]">settings</span>
              </Link>
              <button
                aria-label="Se déconnecter"
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-error hover:bg-error-container/40 transition-colors"
                onClick={() => {
                  onClose?.();
                  void logout();
                }}
                title="Se déconnecter"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
              </button>
            </div>
          )}
        </footer>
      </aside>
    </>
  );
}
