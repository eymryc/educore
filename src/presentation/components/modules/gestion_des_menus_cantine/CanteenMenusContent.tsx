"use client";

import { useEffect, useMemo, useState } from "react";
import { CrudCreateLink } from "@/presentation/components/forms/CrudLinks";
import {
  crudRowActions,
  DataTableActionsMenu,
} from "@/presentation/components/shared/DataTableActionsMenu";
import { DataTableRefreshButton } from "@/presentation/components/shared/DataTableControls";
import { ContentSkeleton } from "@/presentation/components/shared/DataTableSkeleton";
import { StatusBadge } from "@/presentation/components/shared/StatusBadge";
import {
  deleteCanteenMenu,
  listCanteenMenus,
} from "@/infrastructure/api/resources/canteen";
import { useAuth, getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import { can } from "@/shared/lib/permissions";
import { formatMoneyFcfa } from "@/shared/types/finance.types";
import {
  CANTEEN_DAYS_ORDER,
  CANTEEN_DAY_LABELS,
  type CanteenDayOfWeek,
  type CanteenMenu,
} from "@/shared/types/canteen.types";
import { useConfirm } from "@/presentation/components/providers/ConfirmDialogProvider";
import {
  DataTableShell,
  DataTableToolbar,
  DATA_TABLE_CREATE_CLASS,
  DataTableFilterSelect,
} from "@/presentation/components/shared/DataTable";


const DAY_ACCENT: Record<CanteenDayOfWeek, string> = {
  lundi: "bg-tertiary-fixed text-on-tertiary-fixed",
  mardi: "bg-secondary-fixed text-on-secondary-fixed",
  mercredi: "bg-primary-fixed text-on-primary-fixed",
  jeudi: "bg-tertiary-fixed-dim/40 text-on-tertiary-fixed",
  vendredi: "bg-secondary-fixed-dim/50 text-on-secondary-fixed",
};

function MealLine({
  icon,
  label,
  value,
  emphasize = false,
}: {
  icon: string;
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div
      className={`flex gap-sm items-start ${
        emphasize
          ? "bg-primary text-on-primary -mx-md px-md py-sm"
          : ""
      }`}
    >
      <span
        aria-hidden
        className={`material-symbols-outlined text-[18px] mt-0.5 shrink-0 ${
          emphasize ? "text-on-primary/80" : "text-on-surface-variant"
        }`}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div
          className={`font-label-caps text-[10px] tracking-wide ${
            emphasize ? "text-on-primary/70" : "text-on-surface-variant"
          }`}
        >
          {label}
        </div>
        <div
          className={`font-body-sm leading-snug ${
            emphasize ? "font-bold text-[15px]" : "font-medium text-on-surface"
          }`}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

export function CanteenMenusContent() {
  const confirmDialog = useConfirm();
  const { user } = useAuth();
  const [menus, setMenus] = useState<CanteenMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dayFilter, setDayFilter] = useState("");

  const canView = can(user, "canteen.view");
  const canCreate = can(user, "canteen.create");
  const canUpdate = can(user, "canteen.update");
  const canDelete = can(user, "canteen.delete");

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      setMenus(await listCanteenMenus());
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (canView) void reload();
    else setLoading(false);
  }, [canView]);

  const filtered = useMemo(() => {
    if (!dayFilter) return menus;
    return menus.filter((m) => m.day_of_week === dayFilter);
  }, [menus, dayFilter]);

  const visibleDays = useMemo(
    () =>
      dayFilter
        ? CANTEEN_DAYS_ORDER.filter((d) => d === dayFilter)
        : CANTEEN_DAYS_ORDER,
    [dayFilter]
  );

  const byDay = useMemo(() => {
    const map = {} as Record<CanteenDayOfWeek, CanteenMenu[]>;
    for (const d of CANTEEN_DAYS_ORDER) map[d] = [];
    for (const m of filtered) {
      if (map[m.day_of_week]) map[m.day_of_week].push(m);
    }
    return map;
  }, [filtered]);

  async function handleDelete(row: CanteenMenu) {
    if (!canDelete) return;
    if (
      !(await confirmDialog(
        `Supprimer le menu du ${CANTEEN_DAY_LABELS[row.day_of_week]} ?`,
        { destructive: true }
      ))
    )
      return;
    setBusy(true);
    try {
      await deleteCanteenMenu(row.id);
      setMenus((prev) => prev.filter((m) => m.id !== row.id));
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (!canView) {
    return (
      <p className="p-xl font-body-md text-on-surface-variant">
        Accès réservé — vous n&apos;avez pas la permission nécessaire pour consulter cette page.
      </p>
    );
  }

  return (
    <div
      className="flex flex-col w-full gap-lg pb-xl max-w-7xl mx-auto"
      data-testid="canteen-menus-panel"
    >
      {error && (
        <div
          className="rounded-lg bg-error-container text-on-error-container px-md py-sm"
          role="alert"
        >
          {error}
        </div>
      )}

      <DataTableShell className="!mt-0">
        <DataTableToolbar>
          <div className="inline-flex items-center gap-sm min-w-0">
            <span
              aria-hidden
              className="material-symbols-outlined text-primary text-[22px]"
            >
              restaurant_menu
            </span>
            <div>
              <div className="font-title-sm text-on-surface leading-tight">
                Semaine type
              </div>
              <div className="text-[12px] text-on-surface-variant">
                {menus.length} menu{menus.length === 1 ? "" : "s"} enregistré
                {menus.length === 1 ? "" : "s"}
              </div>
            </div>
          </div>
          <DataTableFilterSelect
            ariaLabel="Filtrer par jour"
            className="sm:min-w-[160px]"
            onChange={setDayFilter}
            options={CANTEEN_DAYS_ORDER.map((d) => ({ value: d, label: CANTEEN_DAY_LABELS[d] }))}
            placeholder="Tous les jours"
            value={dayFilter}
          />
          <div className="flex flex-wrap items-center justify-end gap-sm w-full sm:w-auto sm:ml-auto">
            <DataTableRefreshButton loading={loading} onRefresh={() => void reload()} />
            {canCreate && (
              <CrudCreateLink
                className={DATA_TABLE_CREATE_CLASS}
                label="Ajouter un menu"
                resource="canteen-menus"
              />
            )}
          </div>
        </DataTableToolbar>

        <div className="p-md bg-surface-container-low/40">
          {loading ? (
            <ContentSkeleton testId="canteen-menus-loading" variant="cards" />
          ) : (
            <div
              className={`grid grid-cols-1 gap-md ${
                visibleDays.length === 1
                  ? "md:grid-cols-1 max-w-md mx-auto"
                  : "sm:grid-cols-2 lg:grid-cols-5"
              }`}
              data-testid="canteen-menus-grid"
            >
              {visibleDays.map((day) => {
                const dayMenus = byDay[day];
                return (
                  <section
                    key={day}
                    className="flex flex-col bg-surface-container-lowest border border-outline-variant/30 shadow-sm overflow-hidden min-h-[280px]"
                  >
                    <header
                      className={`px-md py-sm flex items-center justify-between gap-sm border-b border-outline-variant/20 ${DAY_ACCENT[day]}`}
                    >
                      <h2 className="font-title-sm text-[14px] tracking-wide">
                        {CANTEEN_DAY_LABELS[day]}
                      </h2>
                      <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 text-[11px] font-semibold tabular-nums bg-on-surface/10">
                        {dayMenus.length}
                      </span>
                    </header>

                    <div className="flex-1 p-sm space-y-sm">
                      {dayMenus.length === 0 ? (
                        <div className="h-full min-h-[160px] flex flex-col items-center justify-center gap-sm border border-dashed border-outline-variant/50 bg-surface-container-low/50 px-md py-xl text-center">
                          <span
                            aria-hidden
                            className="material-symbols-outlined text-on-surface-variant/50 text-[28px]"
                          >
                            no_meals
                          </span>
                          <p className="font-body-sm text-on-surface-variant">
                            Aucun menu
                          </p>
                          {canCreate && (
                            <CrudCreateLink
                              className="inline-flex items-center gap-xs text-[12px] font-label-caps text-primary hover:underline"
                              icon="add"
                              label="Ajouter"
                              resource="canteen-menus"
                            />
                          )}
                        </div>
                      ) : (
                        dayMenus.map((row) => (
                          <article
                            key={row.id}
                            className={`relative flex flex-col border border-outline-variant/25 bg-surface overflow-hidden ${
                              row.is_active ? "shadow-sm" : "opacity-70"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-sm px-md pt-sm pb-xs">
                              {row.is_active ? (
                                <StatusBadge label="Actif" tone="success" withDot />
                              ) : (
                                <StatusBadge label="Inactif" tone="neutral" withDot />
                              )}
                              {(canUpdate || canDelete) && (
                                <DataTableActionsMenu
                                  ariaLabel={`Actions pour ${CANTEEN_DAY_LABELS[row.day_of_week]}`}
                                  items={crudRowActions({
                                    edit: {
                                      resource: "canteen-menus",
                                      recordId: row.id,
                                    },
                                    delete: {
                                      onClick: () => void handleDelete(row),
                                      disabled: busy,
                                    },
                                    canUpdate,
                                    canDelete,
                                  })}
                                />
                              )}
                            </div>

                            <div className="px-md pb-sm flex flex-col gap-sm">
                              <MealLine
                                icon="soup_kitchen"
                                label="Entrée"
                                value={row.starter}
                              />
                              <MealLine
                                emphasize
                                icon="dinner_dining"
                                label="Plat"
                                value={row.main_course}
                              />
                              {row.dessert ? (
                                <MealLine
                                  icon="icecream"
                                  label="Dessert"
                                  value={row.dessert}
                                />
                              ) : null}
                            </div>

                            <footer className="mt-auto px-md py-sm flex items-center justify-between gap-sm border-t border-outline-variant/20 bg-surface-container-high/60">
                              <span className="inline-flex items-center gap-xs text-[12px] text-on-surface-variant">
                                <span
                                  aria-hidden
                                  className="material-symbols-outlined text-[16px]"
                                >
                                  payments
                                </span>
                                Prix
                              </span>
                              <span className="font-mono-data text-[14px] font-semibold text-on-surface tabular-nums">
                                {formatMoneyFcfa(row.price)}
                              </span>
                            </footer>
                          </article>
                        ))
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </DataTableShell>
    </div>
  );
}
