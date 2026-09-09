"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { activateAcademicYear, listAcademicYears } from "@/infrastructure/api/resources/academic";
import { getUnreadNotificationCount } from "@/infrastructure/api/resources/notifications";
import { useAuth } from "@/infrastructure/auth/AuthProvider";
import { resolveAdminPageChrome } from "@/shared/config/page-chrome";
import { can, primaryRoleLabel } from "@/shared/lib/permissions";
import { Select } from "@/presentation/components/shared/Select";
import type { AcademicYear } from "@/shared/types/academic.types";

export function AdminHeader({
  onMenuClick,
  onToggleSidebar,
  sidebarCollapsed = false,
}: {
  onMenuClick?: () => void;
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
}) {
  const pathname = usePathname();
  const pageChrome = useMemo(() => resolveAdminPageChrome(pathname), [pathname]);
  const { user, logout } = useAuth();
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [yearId, setYearId] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activating, setActivating] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const canActivateYear = can(user, "academic.update") || can(user, "institution.update");
  const selectedYear = years.find((y) => String(y.id) === yearId);
  const isSelectedYearClosed = selectedYear?.status === "closed";

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [yearList, unread] = await Promise.all([
          listAcademicYears(),
          getUnreadNotificationCount().catch(() => ({ count: 0 })),
        ]);
        if (cancelled) return;
        setYears(yearList);
        const active = yearList.find((y) => y.is_active);
        setYearId(String(active?.id ?? yearList[0]?.id ?? ""));
        setUnreadCount(unread.count ?? 0);
      } catch {
        if (!cancelled) {
          setYears([]);
          setUnreadCount(0);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  /**
   * Change réel de l'année scolaire active côté serveur (pas un simple
   * affichage local) — la plupart des écrans se basent sur `is_active` pour
   * choisir quoi afficher par défaut, donc on recharge la page pour que tout
   * reflète immédiatement la nouvelle année active.
   */
  async function handleYearChange(newYearId: string) {
    if (!canActivateYear || newYearId === yearId || activating) return;
    setActivating(true);
    try {
      await activateAcademicYear(newYearId);
      window.location.reload();
    } catch {
      setActivating(false);
    }
  }

  const initials =
    user?.name
      ?.split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "A";

  return (
    <header
      className={`fixed top-0 right-0 z-40 h-20 bg-primary text-on-primary border-b border-on-primary/10 transition-[left] duration-200 ease-out left-0 ${
        sidebarCollapsed ? "lg:left-16" : "lg:left-56"
      }`}
    >
      <div aria-hidden className="absolute inset-x-0 top-0 h-[3px]" />
      <div className="h-full px-sm sm:px-md lg:px-lg flex items-center gap-sm min-w-0">
        <div className="flex items-center gap-xs sm:gap-sm min-w-0 flex-1">
          <button
            aria-label="Ouvrir le menu"
            className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg text-on-primary/80 hover:bg-on-primary/10 hover:text-on-primary transition-colors shrink-0"
            onClick={onMenuClick}
            type="button"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>

          <button
            aria-expanded={!sidebarCollapsed}
            aria-label={sidebarCollapsed ? "Développer le menu" : "Réduire le menu"}
            className="hidden lg:inline-flex items-center justify-center w-10 h-10 rounded-lg text-on-primary/80 hover:bg-on-primary/10 hover:text-on-primary transition-colors shrink-0"
            onClick={onToggleSidebar}
            type="button"
          >
            <span className="material-symbols-outlined">
              {sidebarCollapsed ? "menu_open" : "menu"}
            </span>
          </button>

          <div
            className="flex flex-col justify-center min-w-0"
            data-testid="admin-page-chrome"
          >
            <h1 className="text-[15px] lg:text-[16px] font-semibold leading-tight text-on-primary truncate">
              {pageChrome.title}
            </h1>
            <nav
              aria-label="Fil d'Ariane"
              className="hidden md:flex items-center gap-1 text-[11px] text-on-primary/65 leading-tight mt-0.5 min-w-0"
            >
              {pageChrome.breadcrumbs.map((crumb, index) => {
                const isLast = index === pageChrome.breadcrumbs.length - 1;
                return (
                  <span
                    className="inline-flex items-center gap-1 min-w-0"
                    key={`${crumb.label}-${index}`}
                  >
                    {index > 0 && (
                      <span className="material-symbols-outlined text-[12px] opacity-70 shrink-0">
                        chevron_right
                      </span>
                    )}
                    {crumb.href && !isLast ? (
                      <Link
                        className="truncate hover:text-on-primary transition-colors"
                        href={crumb.href}
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className={`truncate ${isLast ? "text-on-primary/90" : ""}`}>
                        {crumb.label}
                      </span>
                    )}
                  </span>
                );
              })}
            </nav>
          </div>
        </div>

        <Link
          aria-label="Rechercher des élèves"
          className="group inline-flex items-center justify-center md:justify-start gap-sm h-10 w-10 md:w-full md:max-w-md md:flex-1 min-w-0 shrink-0 rounded-xl bg-on-primary/10 text-on-primary/70 hover:bg-on-primary/15 hover:text-on-primary transition-colors md:px-md"
          href="/students"
        >
          <span className="material-symbols-outlined text-[20px] shrink-0">search</span>
          <span className="hidden md:inline text-body-sm truncate">Rechercher des élèves…</span>
          <kbd className="ml-auto hidden lg:inline-flex items-center rounded-md border border-on-primary/20 px-1.5 py-0.5 text-[10px] font-medium text-on-primary/60 group-hover:border-on-primary/40">
            /
          </kbd>
        </Link>

        <div className="flex items-center gap-0.5 sm:gap-sm shrink-0">
          <label className="hidden md:flex items-center gap-xs h-10 rounded-xl border border-on-tertiary-container/30 bg-tertiary-container px-sm hover:border-on-tertiary-container/50 transition-colors">
            <span className="material-symbols-outlined text-[18px] text-on-tertiary-container">
              {activating ? "sync" : isSelectedYearClosed ? "lock" : "calendar_month"}
            </span>
            {canActivateYear ? (
              <Select
                ariaLabel="Année scolaire active"
                className="bg-transparent border-none text-[13px] font-medium text-on-tertiary-container outline-none max-w-[9.5rem] cursor-pointer disabled:opacity-60 disabled:cursor-wait"
                disabled={activating}
                iconClassName="text-on-tertiary-container/70"
                onChange={(v) => void handleYearChange(v)}
                options={years.map((y) => ({
                  value: String(y.id),
                  label: `${y.name}${y.is_active ? " · active" : y.status === "closed" ? " · clôturée" : ""}`,
                }))}
                placeholder={years.length === 0 ? "Aucune année" : undefined}
                testId="admin-header-year"
                value={yearId}
              />
            ) : (
              <span className="text-[13px] font-medium text-on-tertiary-container" data-testid="admin-header-year">
                {selectedYear?.name ?? "—"}
              </span>
            )}
            {isSelectedYearClosed && (
              <span
                className="hidden lg:inline text-[10px] font-semibold uppercase tracking-wide text-on-tertiary-container/70 border-l border-on-tertiary-container/30 pl-xs ml-0.5"
                data-testid="admin-header-year-readonly"
              >
                Lecture seule
              </span>
            )}
          </label>

          <Link
            aria-label="Communication"
            className="hidden sm:inline-flex relative items-center justify-center w-10 h-10 rounded-xl text-on-primary/70 hover:bg-on-primary/10 hover:text-on-primary transition-colors"
            href="/communication"
          >
            <span className="material-symbols-outlined text-[22px]">chat_bubble</span>
          </Link>

          <Link
            aria-label="Notifications"
            className="relative inline-flex items-center justify-center w-10 h-10 rounded-xl text-on-primary/70 hover:bg-on-primary/10 hover:text-on-primary transition-colors"
            data-testid="admin-header-notifications"
            href="/communication"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            {unreadCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute top-2 right-2 w-2 h-2 rounded-full bg-error ring-2 ring-primary"
                data-testid="admin-header-unread-dot"
              />
            )}
          </Link>

          <div className="relative" ref={menuRef}>
            <button
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label="Menu compte"
              className="inline-flex items-center gap-sm h-10 w-10 sm:w-auto justify-center sm:justify-start sm:pl-1 sm:pr-2 rounded-xl hover:bg-on-primary/10 transition-colors"
              onClick={() => setMenuOpen((v) => !v)}
              type="button"
            >
              <span className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-[11px] font-semibold tracking-wide">
                {initials}
              </span>
              <span className="hidden md:flex flex-col items-start leading-tight text-left min-w-0">
                <span className="text-[13px] font-semibold text-on-primary truncate max-w-[8rem]">
                  {user?.name ?? "Utilisateur"}
                </span>
                <span className="text-[11px] text-on-primary/60 truncate max-w-[8rem]">
                  {primaryRoleLabel(user)}
                </span>
              </span>
              <span className="material-symbols-outlined text-[18px] text-on-primary/60 hidden sm:inline">
                expand_more
              </span>
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-full mt-1 z-50 w-56 rounded-xl bg-surface-container-lowest shadow-lg border border-outline-variant/20 py-xs overflow-hidden text-on-surface"
                role="menu"
              >
                <div className="px-md py-sm border-b border-outline-variant/15">
                  <div className="text-[13px] font-semibold text-on-surface truncate">
                    {user?.name}
                  </div>
                  <div className="text-[12px] text-on-surface-variant truncate">
                    {user?.email}
                  </div>
                </div>
                <div className="px-md py-sm border-b border-outline-variant/15 md:hidden">
                  <p className="text-[11px] uppercase tracking-wide text-on-surface-variant mb-xs">
                    Année scolaire
                  </p>
                  {canActivateYear ? (
                    <Select
                      ariaLabel="Année scolaire active"
                      className="w-full bg-surface-container-low border border-outline-variant/25 rounded-lg px-sm py-xs text-[13px]"
                      disabled={activating}
                      onChange={(v) => void handleYearChange(v)}
                      options={years.map((y) => ({
                        value: String(y.id),
                        label: `${y.name}${y.is_active ? " · active" : y.status === "closed" ? " · clôturée" : ""}`,
                      }))}
                      placeholder={years.length === 0 ? "Aucune année" : undefined}
                      value={yearId}
                    />
                  ) : (
                    <p className="text-[13px] text-on-surface">{selectedYear?.name ?? "—"}</p>
                  )}
                </div>
                <Link
                  className="flex sm:hidden items-center gap-sm px-md py-sm text-[13px] text-on-surface hover:bg-surface-container-low transition-colors"
                  href="/communication"
                  onClick={() => setMenuOpen(false)}
                  role="menuitem"
                >
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                    chat_bubble
                  </span>
                  Messages
                </Link>
                <Link
                  className="flex items-center gap-sm px-md py-sm text-[13px] text-on-surface hover:bg-surface-container-low transition-colors"
                  href="/settings"
                  onClick={() => setMenuOpen(false)}
                  role="menuitem"
                >
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                    settings
                  </span>
                  Paramètres
                </Link>
                <button
                  className="w-full flex items-center gap-sm px-md py-sm text-[13px] text-error hover:bg-error-container/40 transition-colors"
                  onClick={() => {
                    setMenuOpen(false);
                    void logout();
                  }}
                  role="menuitem"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  Se déconnecter
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
