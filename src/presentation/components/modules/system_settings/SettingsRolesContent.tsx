"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Checkbox } from "@/presentation/components/shared/Checkbox";
import { ContentTabs } from "@/presentation/components/shared/ContentTabs";
import { PanelSkeleton } from "@/presentation/components/shared/DataTableSkeleton";
import {
  listPermissions,
  listRoles,
  updateRolePermissions,
} from "@/infrastructure/api/resources/identity";
import { useAuth, getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import { can, hasRole, roleLabel } from "@/shared/lib/permissions";
import {
  actionLabel,
  CRUD_ACTIONS,
  domainLabel,
  groupPermissionsByCategory,
  ROLE_GROUPS,
  type AccessRole,
  type PermissionCatalogItem,
  type PermissionDomainGroup,
} from "@/shared/types/identity.types";

type ModuleFilter = "all" | "granted" | "empty";
type SaveState = "idle" | "saving" | "saved" | "error";

const ROLE_ICONS: Record<string, string> = {
  SUPER_ADMIN: "shield_person",
  ADMIN: "admin_panel_settings",
  DIRECTOR: "school",
  CENSEUR: "assured_workload",
  SECRETARY: "badge",
  ACCOUNTANT: "account_balance",
  INTENDANT: "inventory_2",
  HR_MANAGER: "groups",
  TEACHER: "menu_book",
  HEAD_TEACHER: "co_present",
  SUPERVISOR: "visibility",
  LIBRARIAN: "local_library",
  NURSE: "health_and_safety",
  STUDENT: "person",
  PARENT: "family_restroom",
};

const DOMAIN_ICONS: Record<string, string> = {
  students: "school",
  guardians: "family_restroom",
  grades: "grade",
  attendance: "event_available",
  payments: "payments",
  reports: "bar_chart",
  teachers: "co_present",
  classes: "groups",
  subjects: "menu_book",
  finance: "account_balance",
  discipline: "gavel",
  assignments: "assignment",
  library: "local_library",
  transport: "directions_bus",
  canteen: "restaurant",
  inventory: "inventory_2",
  hr: "badge",
  communication: "campaign",
  documents: "folder",
  settings: "settings",
};

function isLockedRole(name: string, actorIsSuperAdmin: boolean): boolean {
  if (name === "SUPER_ADMIN") return true;
  if (name === "ADMIN" && !actorIsSuperAdmin) return true;
  return false;
}

function groupRoles(roles: AccessRole[]): { id: string; label: string; roles: AccessRole[] }[] {
  const byName = new Map(roles.map((role) => [role.name, role]));
  const used = new Set<string>();
  const groups = ROLE_GROUPS.map((group) => ({
    id: group.id,
    label: group.label,
    roles: group.roles
      .map((name) => byName.get(name))
      .filter((role): role is AccessRole => Boolean(role)),
  })).filter((group) => {
    group.roles.forEach((role) => used.add(role.name));
    return group.roles.length > 0;
  });
  const rest = roles.filter((role) => !used.has(role.name));
  if (rest.length > 0) groups.push({ id: "other", label: "Autres", roles: rest });
  return groups;
}

export function SettingsRolesContent() {
  const { user } = useAuth();
  const canView = can(user, "settings.view");
  const canUpdate = can(user, "settings.update");
  const actorIsSuperAdmin = hasRole(user, "SUPER_ADMIN");

  const [roles, setRoles] = useState<AccessRole[]>([]);
  const [catalog, setCatalog] = useState<PermissionCatalogItem[]>([]);
  const [selectedName, setSelectedName] = useState<string>("TEACHER");
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState<ModuleFilter>("all");

  const reload = useCallback(async () => {
    if (!canView) {
      setLoading(false);
      setError("Accès réservé — vous n'avez pas la permission de consulter les rôles.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [nextRoles, nextCatalog] = await Promise.all([listRoles(), listPermissions()]);
      setRoles(nextRoles);
      setCatalog(nextCatalog);
      setSelectedName((current) =>
        nextRoles.some((r) => r.name === current) ? current : (nextRoles[0]?.name ?? "")
      );
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [canView]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (saveState !== "saved") return;
    const timer = window.setTimeout(() => setSaveState("idle"), 1800);
    return () => window.clearTimeout(timer);
  }, [saveState]);

  const selected = roles.find((r) => r.name === selectedName) ?? null;
  const locked = selected ? isLockedRole(selected.name, actorIsSuperAdmin) : true;
  const selectedSet = useMemo(() => new Set(selected?.permissions ?? []), [selected]);
  const catalogTotal = catalog.length;
  const roleGroups = useMemo(() => groupRoles(roles), [roles]);
  const categories = useMemo(() => groupPermissionsByCategory(catalog), [catalog]);

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    return categories
      .map((category) => ({
        ...category,
        domains: category.domains.filter((group) => {
          const granted = group.items.filter((item) => selectedSet.has(item.name)).length;
          if (moduleFilter === "granted" && granted === 0) return false;
          if (moduleFilter === "empty" && granted > 0) return false;
          if (!q) return true;
          const extra = group.items.map((item) => actionLabel(item.action)).join(" ");
          return (
            domainLabel(group.domain).toLowerCase().includes(q) ||
            group.domain.toLowerCase().includes(q) ||
            extra.toLowerCase().includes(q)
          );
        }),
      }))
      .filter((category) => category.domains.length > 0);
  }, [categories, search, moduleFilter, selectedSet]);

  const grantedCount = selected?.permissions.length ?? 0;
  const grantedModules = catalog.length
    ? new Set(
        catalog.filter((item) => selectedSet.has(item.name)).map((item) => item.domain)
      ).size
    : 0;
  const moduleTotal = categories.reduce((sum, category) => sum + category.domains.length, 0);

  const filterCounts = useMemo(() => {
    let granted = 0;
    let empty = 0;
    for (const category of categories) {
      for (const group of category.domains) {
        if (group.items.some((item) => selectedSet.has(item.name))) granted += 1;
        else empty += 1;
      }
    }
    return { all: moduleTotal, granted, empty };
  }, [categories, selectedSet, moduleTotal]);

  async function applyPermissions(next: string[]) {
    if (!selected || locked || !canUpdate) return;
    const roleId = selected.id;
    const previous = selected.permissions;
    setRoles((prev) => prev.map((role) => (role.id === roleId ? { ...role, permissions: next } : role)));
    setSaveState("saving");
    setError(null);
    try {
      const updated = await updateRolePermissions(roleId, next);
      setRoles((prev) => prev.map((role) => (role.id === updated.id ? updated : role)));
      setSaveState("saved");
    } catch (err) {
      setRoles((prev) =>
        prev.map((role) => (role.id === roleId ? { ...role, permissions: previous } : role))
      );
      setSaveState("error");
      setError(getAuthErrorMessage(err));
    }
  }

  function togglePermission(name: string, enabled: boolean) {
    if (!selected) return;
    const next = enabled
      ? Array.from(new Set([...selected.permissions, name]))
      : selected.permissions.filter((permission) => permission !== name);
    void applyPermissions(next);
  }

  function toggleDomain(group: PermissionDomainGroup, enableAll: boolean) {
    if (!selected) return;
    const names = group.items.map((item) => item.name);
    const without = selected.permissions.filter((permission) => !names.includes(permission));
    void applyPermissions(enableAll ? [...without, ...names] : without);
  }

  if (!canView && error) {
    return (
      <div
        className="bg-error-container text-on-error-container px-md py-sm rounded-xl font-body-sm"
        data-testid="roles-forbidden"
        role="alert"
      >
        {error}
      </div>
    );
  }

  if (loading) {
    return <PanelSkeleton label="Chargement des rôles…" lines={8} testId="roles-loading" />;
  }

  return (
    <div
      className="flex flex-col lg:flex-row min-w-0 rounded-xl border border-outline-variant/30 bg-white overflow-hidden shadow-[0_2px_4px_rgb(15_23_42/0.06),0_8px_24px_rgb(15_23_42/0.1)] lg:max-h-[calc(100vh-8.5rem)]"
      data-testid="roles-panel"
    >
      <aside className="lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-outline-variant/20 bg-[#f7f9fb] flex flex-col min-h-0">
        <div className="px-md py-md border-b border-outline-variant/15">
          <p className="ui-stat-label">Rôles</p>
          <p className="text-[12px] text-on-surface-variant mt-xs">
            {roles.length} profils · {catalogTotal} droits
          </p>
        </div>
        <nav aria-label="Rôles" className="flex lg:flex-col gap-md overflow-x-auto lg:overflow-y-auto p-sm lg:p-md">
          {roleGroups.map((group) => (
            <div className="shrink-0 lg:shrink min-w-[13rem] lg:min-w-0" key={group.id}>
              <p className="ui-stat-label px-sm mb-xs">{group.label}</p>
              <ul className="flex lg:flex-col gap-xs">
                {group.roles.map((role) => {
                  const active = role.name === selectedName;
                  const ratio = catalogTotal > 0 ? Math.min(100, (role.permissions.length / catalogTotal) * 100) : 0;
                  return (
                    <li key={role.id}>
                      <button
                        aria-current={active ? "page" : undefined}
                        className={`w-full flex items-center gap-sm text-left rounded-xl px-sm py-sm transition-colors ${
                          active
                            ? "bg-primary-container text-on-primary-container shadow-sm"
                            : "text-on-surface hover:bg-white"
                        }`}
                        onClick={() => {
                          setSelectedName(role.name);
                          setSaveState("idle");
                          setError(null);
                        }}
                        type="button"
                      >
                        <span
                          className={`w-8 h-8 rounded-lg inline-flex items-center justify-center shrink-0 ${
                            active ? "bg-white/50" : "bg-white text-on-surface-variant"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {ROLE_ICONS[role.name] ?? "person"}
                          </span>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] font-medium truncate">{roleLabel(role.name)}</span>
                          <span className="mt-1 flex items-center gap-sm">
                            <span
                              className={`h-1 flex-1 rounded-full overflow-hidden ${
                                active ? "bg-on-primary-container/20" : "bg-outline-variant/40"
                              }`}
                            >
                              <span
                                className={`block h-full rounded-full ${active ? "bg-on-primary-container" : "bg-primary"}`}
                                style={{ width: `${ratio}%` }}
                              />
                            </span>
                            <span className="text-[10px] tabular-nums opacity-80">
                              {role.permissions.length}/{catalogTotal || "—"}
                            </span>
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <section className="flex-1 min-w-0 flex flex-col bg-white">
        <div className="px-md sm:px-lg py-md border-b border-outline-variant/15 shrink-0">
          <div className="flex items-start justify-between gap-md flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-sm flex-wrap">
                <h2 className="font-title-sm text-[18px] text-on-surface">
                  {selected ? roleLabel(selected.name) : "Rôle"}
                </h2>
                {locked && (
                  <span className="inline-flex items-center gap-xs h-6 px-sm rounded-full bg-surface-container-high text-[11px] font-label-caps text-on-surface-variant">
                    <span className="material-symbols-outlined text-[14px]">lock</span>
                    Protégé
                  </span>
                )}
              </div>
              <p className="font-body-sm text-[13px] text-on-surface-variant mt-xs">
                {locked
                  ? "Ce rôle système conserve l'ensemble de ses droits."
                  : `${grantedCount} droit${grantedCount > 1 ? "s" : ""} · ${grantedModules}/${moduleTotal} modules`}
              </p>
            </div>
            <SaveStatus state={saveState} />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-sm mt-md">
            <div className="ui-search-field w-full sm:flex-1 min-w-0 h-9 py-0 bg-surface-container-low border border-outline-variant/20">
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">search</span>
              <input
                aria-label="Rechercher un module"
                className="ui-search-input ml-sm h-full"
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un module…"
                type="search"
                value={search}
              />
            </div>
            <ContentTabs
              items={[
                { id: "all", label: "Tous", count: filterCounts.all },
                { id: "granted", label: "Accordés", count: filterCounts.granted },
                { id: "empty", label: "Vides", count: filterCounts.empty },
              ]}
              onChange={setModuleFilter}
              testId="roles-module-filter"
              value={moduleFilter}
              variant="segmented"
            />
          </div>
        </div>

        {error && (
          <div
            className="flex items-start gap-sm bg-error-container text-on-error-container px-md py-sm font-body-sm"
            role="alert"
          >
            <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
            <span>{error}</span>
          </div>
        )}

        <div className="flex-1 overflow-auto min-h-[280px]">
          {filteredCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-lg py-2xl text-center">
              <span className="material-symbols-outlined text-[32px] text-on-surface-variant/50 mb-sm">
                filter_alt_off
              </span>
              <p className="font-body-sm text-on-surface">Aucun module ne correspond.</p>
              <button
                className="text-[13px] text-primary mt-sm hover:underline"
                onClick={() => {
                  setSearch("");
                  setModuleFilter("all");
                }}
                type="button"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[640px]" data-testid="roles-matrix">
              <thead className="bg-[#f7f9fb] sticky top-0 z-10">
                <tr>
                  <th className="px-md sm:px-lg py-sm ui-stat-label">Module</th>
                  {CRUD_ACTIONS.map((action) => (
                    <th className="px-xs py-sm ui-stat-label text-center w-20" key={action}>
                      {actionLabel(action)}
                    </th>
                  ))}
                  <th className="px-md py-sm ui-stat-label">Autres</th>
                  <th className="px-md py-sm w-12" />
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((category) => (
                  <CategoryRows
                    canUpdate={canUpdate}
                    categoryLabel={category.label}
                    groups={category.domains}
                    key={category.id}
                    locked={locked}
                    onToggleDomain={toggleDomain}
                    onTogglePermission={togglePermission}
                    selectedSet={selectedSet}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}

function SaveStatus({ state }: { state: SaveState }) {
  if (state === "idle") return null;
  const map = {
    saving: { icon: "sync", label: "Enregistrement…", className: "text-on-surface-variant" },
    saved: { icon: "check_circle", label: "Enregistré", className: "text-[#1D7A46]" },
    error: { icon: "error", label: "Échec de l'enregistrement", className: "text-error" },
  } as const;
  const current = map[state];
  return (
    <span className={`inline-flex items-center gap-xs text-[12px] font-medium ${current.className}`}>
      <span
        className={`material-symbols-outlined text-[16px] ${state === "saving" ? "animate-spin" : ""}`}
      >
        {current.icon}
      </span>
      {current.label}
    </span>
  );
}

function CategoryRows({
  categoryLabel,
  groups,
  selectedSet,
  locked,
  canUpdate,
  onTogglePermission,
  onToggleDomain,
}: {
  categoryLabel: string;
  groups: PermissionDomainGroup[];
  selectedSet: Set<string>;
  locked: boolean;
  canUpdate: boolean;
  onTogglePermission: (name: string, enabled: boolean) => void;
  onToggleDomain: (group: PermissionDomainGroup, enableAll: boolean) => void;
}) {
  return (
    <>
      <tr className="bg-surface-container-low/80">
        <td className="px-md sm:px-lg py-xs ui-stat-label" colSpan={7}>
          {categoryLabel}
        </td>
      </tr>
      {groups.map((group) => {
        const granted = group.items.filter((item) => selectedSet.has(item.name)).length;
        const allOn = granted === group.items.length && group.items.length > 0;
        const someOn = granted > 0 && !allOn;
        const crud = CRUD_ACTIONS.map(
          (action) => group.items.find((item) => item.action === action) ?? null
        );
        const extras = group.items.filter(
          (item) => !(CRUD_ACTIONS as readonly string[]).includes(item.action)
        );
        const disabled = locked || !canUpdate;

        return (
          <tr
            className={`border-t border-outline-variant/10 ${
              allOn ? "bg-[#E0F2E9]/40" : someOn ? "bg-primary/[0.03]" : "hover:bg-surface-container-low/50"
            }`}
            key={group.domain}
          >
            <td className="px-md sm:px-lg py-[10px]">
              <div className="flex items-center gap-sm min-w-0">
                <span className="w-8 h-8 rounded-lg bg-surface-container-high text-on-surface-variant inline-flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">
                    {DOMAIN_ICONS[group.domain] ?? "tune"}
                  </span>
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-on-surface">{domainLabel(group.domain)}</p>
                  <p className="text-[11px] text-on-surface-variant tabular-nums">
                    {granted}/{group.items.length}
                  </p>
                </div>
              </div>
            </td>
            {crud.map((item, index) => (
              <td className="px-xs py-[10px] text-center" key={`${group.domain}-crud-${index}`}>
                {item ? (
                  <span className="inline-flex justify-center">
                    <Checkbox
                      ariaLabel={`${domainLabel(group.domain)} — ${actionLabel(item.action)}`}
                      checked={selectedSet.has(item.name)}
                      disabled={disabled}
                      onChange={(checked) => onTogglePermission(item.name, checked)}
                    />
                  </span>
                ) : (
                  <span className="text-on-surface-variant/30">—</span>
                )}
              </td>
            ))}
            <td className="px-md py-[10px]">
              {extras.length === 0 ? (
                <span className="text-[12px] text-on-surface-variant/50">—</span>
              ) : (
                <ul className="flex flex-wrap gap-sm">
                  {extras.map((item) => (
                    <li className="inline-flex items-center gap-xs" key={item.name}>
                      <Checkbox
                        ariaLabel={`${domainLabel(group.domain)} — ${actionLabel(item.action)}`}
                        checked={selectedSet.has(item.name)}
                        disabled={disabled}
                        onChange={(checked) => onTogglePermission(item.name, checked)}
                      />
                      <span className="text-[12px] text-on-surface">{actionLabel(item.action)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </td>
            <td className="px-md py-[10px] text-right">
              {canUpdate && !locked && (
                <button
                  aria-label={
                    allOn
                      ? `Tout retirer — ${domainLabel(group.domain)}`
                      : `Tout accorder — ${domainLabel(group.domain)}`
                  }
                  className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-primary disabled:opacity-40"
                  onClick={() => onToggleDomain(group, !allOn)}
                  title={allOn ? "Tout retirer" : "Tout accorder"}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {allOn ? "deselect" : "done_all"}
                  </span>
                </button>
              )}
            </td>
          </tr>
        );
      })}
    </>
  );
}
