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
  DEFAULT_TABLE_PAGE_SIZE,
  tableRowClass,
} from "@/presentation/components/shared/data-table-utils";
import { getAuditLog, listAuditLogs } from "@/infrastructure/api/resources/audit";
import { useAuth, getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import { can } from "@/shared/lib/permissions";
import {
  auditActorLabel,
  auditActorRoles,
  emptyPaginationMeta,
  formatAuditTimestamp,
  prettyJson,
  type AuditLog,
} from "@/shared/types/audit.types";
import type { PaginationMeta } from "@/shared/types/api.types";

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

  const reload = useCallback(async () => {
    if (!canView) {
      setLoading(false);
      setError("Accès réservé — permission settings.view requise.");
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
      <div className="flex flex-col w-full gap-lg pb-xl max-w-7xl mx-auto">
        <div
          className="rounded-lg bg-error-container text-on-error-container px-md py-sm"
          data-testid="audit-forbidden"
          role="alert"
        >
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full gap-lg pb-xl max-w-7xl mx-auto">
{error && !loading && (
        <div
          className="rounded-lg bg-error-container text-on-error-container px-md py-sm"
          data-testid="audit-error"
          role="alert"
        >
          {error}
        </div>
      )}
      {loading && <ContentSkeleton testId="audit-loading" variant="table" />}

      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-md">
          <div className="lg:col-span-7 ui-table-shell flex flex-col" data-testid="audit-table">
            <div
              className="px-lg pt-lg pb-md flex flex-wrap items-end gap-sm border-b border-outline-variant/15"
              data-testid="audit-filters"
            >
              <label className="flex flex-col gap-xs font-body-sm">
                Action
                <input
                  aria-label="Filtrer par action"
                  className="ui-input h-10 py-0"
                  onChange={(e) => {
                    setAction(e.target.value);
                    setPage(1);
                  }}
                  placeholder="login, update…"
                  value={action}
                />
              </label>
              <label className="flex flex-col gap-xs font-body-sm">
                Ressource
                <input
                  aria-label="Filtrer par ressource"
                  className="ui-input h-10 py-0"
                  onChange={(e) => {
                    setResource(e.target.value);
                    setPage(1);
                  }}
                  placeholder="users, invoices…"
                  value={resource}
                />
              </label>
              <label className="flex flex-col gap-xs font-body-sm">
                User ID
                <input
                  aria-label="Filtrer par utilisateur"
                  className="ui-input h-10 py-0 w-28"
                  onChange={(e) => {
                    setUserId(e.target.value);
                    setPage(1);
                  }}
                  placeholder="3"
                  value={userId}
                />
              </label>
              <label className="flex flex-col gap-xs font-body-sm">
                Du
                <input
                  aria-label="Date de début"
                  className="ui-input h-10 py-0"
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setPage(1);
                  }}
                  type="date"
                  value={dateFrom}
                />
              </label>
              <label className="flex flex-col gap-xs font-body-sm">
                Au
                <input
                  aria-label="Date de fin"
                  className="ui-input h-10 py-0"
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setPage(1);
                  }}
                  type="date"
                  value={dateTo}
                />
              </label>
              <button
                className="inline-flex items-center h-10 px-md text-[13px] text-on-surface-variant hover:text-primary transition-colors"
                onClick={resetFilters}
                type="button"
              >
                Réinitialiser
              </button>
              <div className="ml-auto shrink-0">
                <DataTableRefreshButton loading={loading} onRefresh={() => void reload()} />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container-low/80 sticky top-0 z-10">
                  <tr className="ui-table-head-row">
                    <DataTableSelectHeader
                      checked={allPageSelected}
                      indeterminate={somePageSelected && !allPageSelected}
                      onChange={toggleAllPage}
                    />
                    <th className="py-md px-lg">Horodatage</th>
                    <th className="py-md px-md">Utilisateur</th>
                    <th className="py-md px-md">Action</th>
                    <th className="py-md px-md">Ressource</th>
                    <th className="py-md px-lg text-right">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td className="py-lg px-lg text-on-surface-variant" colSpan={6}>
                        Aucune entrée.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log, index) => (
                      <tr
                        key={log.id}
                        className={`${tableRowClass(index)} cursor-pointer ${
                          selected?.id === log.id ? "ring-1 ring-inset ring-primary/30" : ""
                        }`}
                        onClick={() => void openDetail(log)}
                      >
                        <DataTableSelectCell
                          checked={selectedIds.has(log.id)}
                          label={`${log.action} ${typeof log.resource === "string" ? log.resource : ""}`}
                          onChange={() => toggleOne(log.id)}
                        />
                        <td className="py-md px-lg font-mono-data text-sm whitespace-nowrap">
                          {formatAuditTimestamp(log.created_at)}
                        </td>
                        <td className="py-md px-md">
                          <div className="font-semibold text-sm">{auditActorLabel(log)}</div>
                          <div className="text-[11px] text-on-surface-variant">
                            {auditActorRoles(log)}
                          </div>
                        </td>
                        <td className="py-md px-md font-mono-data text-sm">{log.action}</td>
                        <td className="py-md px-md font-body-sm">
                          {typeof log.resource === "string" ? log.resource : "—"}
                          {log.resource_id != null ? ` #${log.resource_id}` : ""}
                        </td>
                        <td className="py-md px-lg text-right font-mono-data text-sm">
                          {log.ip_address ?? "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

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
          </div>

          <div className="lg:col-span-5 ui-card p-lg flex flex-col gap-md min-h-[320px]" data-testid="audit-detail">
            {!selected ? (
              <p className="m-auto font-body-md text-on-surface-variant">
                Sélectionnez une entrée pour voir le détail.
              </p>
            ) : detailLoading ? (
              <PanelSkeleton label="Chargement du détail…" />
            ) : (
              <>
                <div>
                  <h2 className="font-headline-md text-headline-md">
                    {selected.action}
                    {typeof selected.resource === "string" ? ` · ${selected.resource}` : ""}
                  </h2>
                  <p className="font-body-sm text-on-surface-variant mt-xs">
                    {formatAuditTimestamp(selected.created_at)} — {auditActorLabel(selected)}
                  </p>
                </div>
                <dl className="grid grid-cols-2 gap-sm font-body-sm">
                  <div>
                    <dt className="text-on-surface-variant">IP</dt>
                    <dd className="font-mono-data">{selected.ip_address ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-on-surface-variant">Resource ID</dt>
                    <dd className="font-mono-data">{selected.resource_id ?? "—"}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-on-surface-variant">User-Agent</dt>
                    <dd className="font-mono-data text-[11px] break-all">
                      {selected.user_agent ?? "—"}
                    </dd>
                  </div>
                </dl>
                <div>
                  <h3 className="font-title-sm mb-xs">Anciennes valeurs</h3>
                  <pre className="bg-surface-container-low p-md rounded-lg text-[11px] overflow-x-auto whitespace-pre-wrap">
                    {prettyJson(selected.old_values)}
                  </pre>
                </div>
                <div>
                  <h3 className="font-title-sm mb-xs">Nouvelles valeurs</h3>
                  <pre className="bg-surface-container-low p-md rounded-lg text-[11px] overflow-x-auto whitespace-pre-wrap">
                    {prettyJson(selected.new_values)}
                  </pre>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
