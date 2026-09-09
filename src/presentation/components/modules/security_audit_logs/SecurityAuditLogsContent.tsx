"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DataTableRefreshButton,
  DataTableSelectCell,
  DataTableSelectHeader,
} from "@/presentation/components/shared/DataTableControls";
import { ContentSkeleton, PanelSkeleton } from "@/presentation/components/shared/DataTableSkeleton";
import { DataTablePagination } from "@/presentation/components/shared/DataTablePagination";
import {
  DataTableShell,
  DataTableToolbar,
  DataTableClearFilters,
  DataTableEmpty,
  DataTableFilterSelect,
  DataTableFilterDate,
  DATA_TABLE_TH_CLASS,
  DATA_TABLE_TD_CLASS,
} from "@/presentation/components/shared/DataTable";
import { StatusBadge, type StatusTone } from "@/presentation/components/shared/StatusBadge";
import {
  DEFAULT_TABLE_PAGE_SIZE,
  tableRowClass,
} from "@/presentation/components/shared/data-table-utils";
import { getAuditLog, listAuditLogs } from "@/infrastructure/api/resources/audit";
import { useAuth, getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import { can, ROLE_LABELS } from "@/shared/lib/permissions";
import {
  auditActorLabel,
  emptyPaginationMeta,
  formatAuditTimestamp,
  prettyJson,
  type AuditLog,
} from "@/shared/types/audit.types";
import type { PaginationMeta } from "@/shared/types/api.types";

const FILTER_INPUT =
  "ui-input h-9 py-0 min-w-[10rem] w-[11.5rem] shrink-0 bg-white border border-outline-variant/25";

function formatActorRoles(log: AuditLog): string {
  const roles = log.user?.roles;
  if (!roles?.length) return "Rôle non renseigné";
  return roles.map((role) => ROLE_LABELS[role] ?? role).join(" · ");
}

const DETAIL_SHELL =
  "ui-table-shell mt-0 flex flex-col min-h-[280px] min-w-0 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)]";

function actionTone(action: string): StatusTone {
  const key = action.toLowerCase();
  if (key.includes("delete") || key.includes("destroy") || key.includes("revoke")) return "error";
  if (key.includes("create") || key.includes("store") || key.includes("publish")) return "success";
  if (key.includes("update") || key.includes("patch") || key.includes("edit")) return "warning";
  if (key.includes("login") || key.includes("logout") || key.includes("view") || key.includes("read")) {
    return "info";
  }
  return "neutral";
}

function actorInitials(label: string): string {
  return (
    label
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

function JsonBlock({ title, value }: { title: string; value: unknown }) {
  const text = prettyJson(value);
  const empty = text === "—";
  return (
    <div>
      <h3 className="ui-stat-label mb-xs">{title}</h3>
      <pre
        className={`p-md text-[12px] leading-relaxed overflow-x-auto whitespace-pre-wrap border border-outline-variant/20 ${
          empty ? "bg-surface-container-low/50 text-on-surface-variant" : "bg-[#f7f9fb] text-on-surface font-mono-data"
        }`}
      >
        {text}
      </pre>
    </div>
  );
}

export function SecurityAuditLogsContent() {
  const { user } = useAuth();
  const canView = can(user, "settings.view");

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(emptyPaginationMeta());
  const [selected, setSelected] = useState<AuditLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [action, setAction] = useState("");
  const [resource, setResource] = useState("");
  const [userId, setUserId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_TABLE_PAGE_SIZE);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const hasFilters = Boolean(action || resource || userId || dateFrom || dateTo);

  const userOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const log of logs) {
      if (log.user_id == null) continue;
      const name = auditActorLabel(log);
      map.set(String(log.user_id), `${name} · ${formatActorRoles(log)}`);
    }
    if (userId && !map.has(userId)) {
      map.set(userId, `Utilisateur n° ${userId}`);
    }
    return Array.from(map, ([value, label]) => ({ value, label }));
  }, [logs, userId]);

  const reload = useCallback(async () => {
    if (!canView) {
      setLoading(false);
      setError("Accès réservé — vous n'avez pas la permission nécessaire pour consulter cette page.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await listAuditLogs({
        ...(action ? { action } : {}),
        ...(resource ? { resource } : {}),
        ...(userId ? { user_id: userId } : {}),
        ...(dateFrom ? { date_from: dateFrom } : {}),
        ...(dateTo ? { date_to: dateTo } : {}),
        page,
        per_page: perPage,
      });
      setLogs(result.data);
      setMeta(result.meta);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [canView, action, resource, userId, dateFrom, dateTo, page, perPage]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [action, resource, userId, dateFrom, dateTo, page, perPage]);

  const allPageSelected =
    logs.length > 0 && logs.every((log) => selectedIds.has(log.id));
  const somePageSelected = logs.some((log) => selectedIds.has(log.id));

  function toggleAllPage() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        logs.forEach((log) => next.delete(log.id));
      } else {
        logs.forEach((log) => next.add(log.id));
      }
      return next;
    });
  }

  function toggleOne(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const from = useMemo(() => {
    if (meta.total === 0) return 0;
    return (meta.current_page - 1) * meta.per_page + 1;
  }, [meta]);

  const to = useMemo(
    () => Math.min(meta.current_page * meta.per_page, meta.total),
    [meta]
  );

  async function openDetail(log: AuditLog) {
    setSelected(log);
    setDetailLoading(true);
    setError(null);
    try {
      const detail = await getAuditLog(log.id);
      setSelected(detail);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setDetailLoading(false);
    }
  }

  function resetFilters() {
    setAction("");
    setResource("");
    setUserId("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

  if (!canView && error) {
    return (
      <div className="flex flex-col w-full gap-md min-w-0">
        <div
          className="bg-error-container text-on-error-container px-md py-sm"
          data-testid="audit-forbidden"
          role="alert"
        >
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full gap-md min-w-0">
      {error && !loading && (
        <div
          className="flex items-start gap-sm bg-error-container text-on-error-container px-md py-sm font-body-sm"
          data-testid="audit-error"
          role="alert"
        >
          <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
          <span>{error}</span>
        </div>
      )}
      {loading && <ContentSkeleton testId="audit-loading" variant="table" />}

      {!loading && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-md items-start min-w-0">
          <DataTableShell className="xl:col-span-7 min-w-0 mt-0" testId="audit-table">
            <DataTableToolbar className="flex-nowrap" testId="audit-filters">
              <label className="flex flex-col gap-xs font-body-sm shrink-0">
                <span className="ui-stat-label">Type d&apos;action</span>
                <input
                  aria-label="Filtrer par action"
                  className={FILTER_INPUT}
                  onChange={(e) => {
                    setAction(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Ex. login, update"
                  value={action}
                />
              </label>
              <label className="flex flex-col gap-xs font-body-sm shrink-0">
                <span className="ui-stat-label">Module concerné</span>
                <input
                  aria-label="Filtrer par ressource"
                  className={FILTER_INPUT}
                  onChange={(e) => {
                    setResource(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Ex. users, invoices"
                  value={resource}
                />
              </label>
              <label className="flex flex-col gap-xs font-body-sm shrink-0">
                <span className="ui-stat-label">Personne</span>
                <DataTableFilterSelect
                  ariaLabel="Filtrer par utilisateur"
                  className="w-[16rem] min-w-[16rem]"
                  onChange={(v) => {
                    setUserId(v);
                    setPage(1);
                  }}
                  options={userOptions}
                  placeholder="Toutes les personnes"
                  value={userId}
                />
              </label>
              <label className="flex flex-col gap-xs font-body-sm shrink-0 min-w-[10rem] w-[11.5rem]">
                <span className="ui-stat-label">Depuis le</span>
                <DataTableFilterDate
                  ariaLabel="Date de début"
                  onChange={(v) => {
                    setDateFrom(v);
                    setPage(1);
                  }}
                  value={dateFrom}
                />
              </label>
              <label className="flex flex-col gap-xs font-body-sm shrink-0 min-w-[10rem] w-[11.5rem]">
                <span className="ui-stat-label">Jusqu&apos;au</span>
                <DataTableFilterDate
                  ariaLabel="Date de fin"
                  onChange={(v) => {
                    setDateTo(v);
                    setPage(1);
                  }}
                  value={dateTo}
                />
              </label>
              <div className="ml-auto shrink-0 flex items-center gap-sm">
                {hasFilters && <DataTableClearFilters onClick={resetFilters} />}
                <DataTableRefreshButton loading={loading} onRefresh={() => void reload()} />
              </div>
            </DataTableToolbar>

            {logs.length === 0 ? (
              <DataTableEmpty
                description={
                  hasFilters
                    ? "Aucun résultat pour ces filtres. Essayez une autre action, ressource ou période."
                    : "Aucune activité n'a encore été enregistrée."
                }
                icon="policy"
                title="Aucune entrée"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-surface-container-low/80 sticky top-0 z-10">
                    <tr className="ui-table-head-row">
                      <DataTableSelectHeader
                        checked={allPageSelected}
                        indeterminate={somePageSelected && !allPageSelected}
                        onChange={toggleAllPage}
                      />
                      <th className={DATA_TABLE_TH_CLASS}>Horodatage</th>
                      <th className={DATA_TABLE_TH_CLASS}>Utilisateur</th>
                      <th className={DATA_TABLE_TH_CLASS}>Action</th>
                      <th className={DATA_TABLE_TH_CLASS}>Ressource</th>
                      <th className={`${DATA_TABLE_TH_CLASS} text-right`}>IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, index) => {
                      const actor = auditActorLabel(log);
                      const isOpen = selected?.id === log.id;
                      const resourceLabel =
                        typeof log.resource === "string" ? log.resource : "—";
                      return (
                        <tr
                          className={`${tableRowClass(index, isOpen)} cursor-pointer`}
                          key={log.id}
                          onClick={() => void openDetail(log)}
                        >
                          <DataTableSelectCell
                            checked={selectedIds.has(log.id)}
                            label={`${log.action} ${typeof log.resource === "string" ? log.resource : ""}`}
                            onChange={() => toggleOne(log.id)}
                          />
                          <td className={`${DATA_TABLE_TD_CLASS} font-mono-data text-[12px] whitespace-nowrap text-on-surface-variant`}>
                            {formatAuditTimestamp(log.created_at)}
                          </td>
                          <td className={DATA_TABLE_TD_CLASS}>
                            <div className="flex items-center gap-sm min-w-0">
                              <span className="w-8 h-8 shrink-0 bg-primary-container text-on-primary-container inline-flex items-center justify-center text-[11px] font-semibold">
                                {actorInitials(actor)}
                              </span>
                              <div className="min-w-0">
                                <div className="font-semibold text-[13px] truncate">{actor}</div>
                                <div className="text-[11px] text-on-surface-variant truncate">
                                  {formatActorRoles(log)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className={DATA_TABLE_TD_CLASS}>
                            <StatusBadge label={log.action} tone={actionTone(log.action)} />
                          </td>
                          <td className={`${DATA_TABLE_TD_CLASS} font-body-sm`}>
                            <span className="text-on-surface">{resourceLabel}</span>
                            {log.resource_id != null && (
                              <span className="text-on-surface-variant"> #{log.resource_id}</span>
                            )}
                          </td>
                          <td className={`${DATA_TABLE_TD_CLASS} text-right font-mono-data text-[12px] text-on-surface-variant`}>
                            {log.ip_address ?? "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {meta.total > 0 && (
              <DataTablePagination
                canNextPage={meta.current_page < meta.last_page}
                canPreviousPage={meta.current_page > 1}
                entityLabel="entrées"
                from={from}
                onFirstPage={() => setPage(1)}
                onLastPage={() => setPage(meta.last_page)}
                onNextPage={() => setPage((p) => p + 1)}
                onPageChange={(index) => setPage(index + 1)}
                onPageSizeChange={(size) => {
                  setPerPage(size);
                  setPage(1);
                }}
                onPreviousPage={() => setPage((p) => Math.max(1, p - 1))}
                pageCount={meta.last_page}
                pageIndex={meta.current_page - 1}
                pageSize={perPage}
                testId="audit-pagination"
                to={to}
                total={meta.total}
              />
            )}
          </DataTableShell>

          <div className={`${DETAIL_SHELL} xl:col-span-5`} data-testid="audit-detail">
            {!selected ? (
              <div className="m-auto flex flex-col items-center text-center px-lg py-xl">
                <span className="w-12 h-12 bg-surface-container-low inline-flex items-center justify-center mb-sm text-on-surface-variant/55">
                  <span className="material-symbols-outlined text-[24px]">manage_search</span>
                </span>
                <p className="font-title-sm text-[15px] text-on-surface">Détail de l&apos;entrée</p>
                <p className="font-body-sm text-on-surface-variant mt-xs max-w-[16rem]">
                  Sélectionnez une entrée pour voir le détail.
                </p>
              </div>
            ) : detailLoading ? (
              <div className="p-lg">
                <PanelSkeleton label="Chargement du détail…" />
              </div>
            ) : (
              <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
                <div className="flex items-start gap-sm px-md py-md border-b border-outline-variant/15 bg-[#f7f9fb]">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-sm flex-wrap">
                      <StatusBadge label={selected.action} tone={actionTone(selected.action)} />
                      {typeof selected.resource === "string" && (
                        <span className="text-[13px] text-on-surface-variant">{selected.resource}</span>
                      )}
                    </div>
                    <p className="text-[12px] text-on-surface-variant mt-xs">
                      {formatAuditTimestamp(selected.created_at)} · {auditActorLabel(selected)}
                    </p>
                  </div>
                  <button
                    aria-label="Fermer le détail"
                    className="w-8 h-8 shrink-0 inline-flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
                    onClick={() => setSelected(null)}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-md flex flex-col gap-md">
                  <dl className="grid grid-cols-2 gap-sm">
                    <div className="bg-surface-container-low/70 px-md py-sm">
                      <dt className="ui-stat-label">IP</dt>
                      <dd className="font-mono-data text-[13px] mt-xs">{selected.ip_address ?? "—"}</dd>
                    </div>
                    <div className="bg-surface-container-low/70 px-md py-sm">
                      <dt className="ui-stat-label">Identifiant</dt>
                      <dd className="font-mono-data text-[13px] mt-xs">{selected.resource_id ?? "—"}</dd>
                    </div>
                    <div className="col-span-2 bg-surface-container-low/70 px-md py-sm">
                      <dt className="ui-stat-label">Agent</dt>
                      <dd className="font-mono-data text-[11px] break-all mt-xs text-on-surface-variant">
                        {selected.user_agent ?? "—"}
                      </dd>
                    </div>
                  </dl>
                  <JsonBlock title="Anciennes valeurs" value={selected.old_values} />
                  <JsonBlock title="Nouvelles valeurs" value={selected.new_values} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
