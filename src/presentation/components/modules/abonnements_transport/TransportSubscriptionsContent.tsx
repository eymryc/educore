"use client";

import { useEffect, useMemo, useState } from "react";
import { CrudCreateLink } from "@/presentation/components/forms/CrudLinks";
import {
  crudRowActions,
  DataTableActionsMenu,
  type DataTableMenuItem,
} from "@/presentation/components/shared/DataTableActionsMenu";
import {
  DataTableRefreshButton,
  DataTableSelectCell,
  DataTableSelectHeader,
} from "@/presentation/components/shared/DataTableControls";
import { ContentSkeleton } from "@/presentation/components/shared/DataTableSkeleton";
import { DataTablePagination } from "@/presentation/components/shared/DataTablePagination";
import { StatusBadge } from "@/presentation/components/shared/StatusBadge";
import {
  tableRowClass,
  useClientDataTable,
} from "@/presentation/components/shared/data-table-utils";
import {
  deleteTransportSubscription,
  listTransportSubscriptions,
} from "@/infrastructure/api/resources/transport";
import { useAuth, getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import { can } from "@/shared/lib/permissions";
import { formatMoneyFcfa } from "@/shared/types/finance.types";
import {
  TRANSPORT_SUBSCRIPTION_STATUS_LABELS,
  transportSubscriptionLabel,
  type TransportSubscription,
  type TransportSubscriptionStatus,
} from "@/shared/types/transport.types";
import { useConfirm } from "@/presentation/components/providers/ConfirmDialogProvider";

function tone(
  status: TransportSubscriptionStatus
): "success" | "warning" | "error" {
  if (status === "ACTIVE") return "success";
  if (status === "SUSPENDED") return "warning";
  return "error";
}

export function TransportSubscriptionsContent() {
  const confirmDialog = useConfirm();
  const { user } = useAuth();
  const [rows, setRows] = useState<TransportSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const canView = can(user, "transport.view");
  const canCreate = can(user, "transport.create");
  const canUpdate = can(user, "transport.update");
  const canDelete = can(user, "transport.delete");

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      setRows(await listTransportSubscriptions());
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
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (status && r.status !== status) return false;
      if (!q) return true;
      const hay = `${transportSubscriptionLabel(r)} ${r.route?.name ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rows, search, status]);

  const {
    pageIndex,
    pageSize,
    pageCount,
    pageRows,
    from,
    to,
    selectedIds,
    allPageSelected,
    somePageSelected,
    setPageIndex,
    setPageSize,
    toggleAllPage,
    toggleOne,
    canPreviousPage,
    canNextPage,
  } = useClientDataTable(filtered, [search, status]);

  async function handleDelete(row: TransportSubscription) {
    if (!canDelete) return;
    if (!await confirmDialog(`Supprimer l'abonnement de ${transportSubscriptionLabel(row)} ?`))
      return;
    setBusy(true);
    try {
      await deleteTransportSubscription(row.id);
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (!canView) {
    return (
      <p className="p-xl font-body-md text-on-surface-variant">
        Accès réservé (`transport.view`).
      </p>
    );
  }

  return (
    <div
      className="flex flex-col w-full gap-lg pb-xl max-w-7xl mx-auto"
      data-testid="subscriptions-panel"
    >
{error && (
        <div className="rounded-lg bg-error-container text-on-error-container px-md py-sm" role="alert">
          {error}
        </div>
      )}

      <div className="ui-table-shell" data-testid="subscriptions-table">
        <div className="px-lg pt-lg pb-md flex flex-wrap items-center gap-sm border-b border-outline-variant/15">
          <div className="ui-search-field flex-1 min-w-[200px] h-10 py-0">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
              search
            </span>
            <input
              aria-label="Rechercher"
              className="ui-search-input ml-sm h-full"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Élève, itinéraire…"
              type="text"
              value={search}
            />
          </div>
          <select
            aria-label="Statut"
            className="ui-input cursor-pointer h-10 py-0"
            onChange={(e) => setStatus(e.target.value)}
            value={status}
          >
            <option value="">Tous les statuts</option>
            {Object.entries(TRANSPORT_SUBSCRIPTION_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <div className="ml-auto shrink-0 flex items-center gap-sm">
            <DataTableRefreshButton loading={loading} onRefresh={() => void reload()} />
            {canCreate && (
              <CrudCreateLink
                className="inline-flex items-center gap-sm h-10 bg-primary hover:bg-primary/90 text-on-primary font-label-caps text-label-caps px-md rounded-lg transition-colors shadow-sm"
                label="NOUVEL ABONNEMENT"
                resource="transport-subscriptions"
              />
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <ContentSkeleton testId="subscriptions-loading" variant="table" />
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low/80 sticky top-0 z-10">
                <tr className="ui-table-head-row">
                  <DataTableSelectHeader
                    checked={allPageSelected}
                    indeterminate={somePageSelected && !allPageSelected}
                    onChange={toggleAllPage}
                  />
                  <th className="py-md px-lg">Élève</th>
                  <th className="py-md px-md">Itinéraire / arrêt</th>
                  <th className="py-md px-md">Période</th>
                  <th className="py-md px-md text-right">Tarif</th>
                  <th className="py-md px-md">Statut</th>
                  <th className="py-md px-md text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td className="py-xl px-lg text-on-surface-variant" colSpan={7}>
                      Aucun abonnement.
                    </td>
                  </tr>
                ) : (
                  pageRows.map((row, index) => (
                    <tr className={tableRowClass(index)} key={row.id}>
                      <DataTableSelectCell
                        checked={selectedIds.has(row.id)}
                        label={transportSubscriptionLabel(row)}
                        onChange={() => toggleOne(row.id)}
                      />
                      <td className="py-md px-lg font-semibold text-sm">
                        {transportSubscriptionLabel(row)}
                      </td>
                      <td className="py-md px-md font-body-sm">
                        {row.route?.name ?? `#${row.transport_route_id}`}
                        {row.stop ? ` · ${row.stop.name}` : ""}
                      </td>
                      <td className="py-md px-md font-body-sm">
                        {row.start_date?.slice(0, 10)}
                        {row.end_date ? ` → ${row.end_date.slice(0, 10)}` : ""}
                      </td>
                      <td className="py-md px-md text-right font-mono-data">
                        {row.monthly_fee != null
                          ? formatMoneyFcfa(row.monthly_fee)
                          : "—"}
                      </td>
                      <td className="py-md px-md">
                        <StatusBadge
                          label={TRANSPORT_SUBSCRIPTION_STATUS_LABELS[row.status]}
                          tone={tone(row.status)}
                        />
                      </td>
                      <td className="py-md px-md">
                        <DataTableActionsMenu
                          ariaLabel={`Actions pour l'abonnement #${row.id}`}
                          items={crudRowActions({
                            edit: { resource: "transport-subscriptions", recordId: row.id },
                            delete: {
                              onClick: () => void handleDelete(row),
                              disabled: busy,
                            },
                            canUpdate,
                            canDelete,
                          })}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {!loading && filtered.length > 0 && (
          <DataTablePagination
            canNextPage={canNextPage}
            canPreviousPage={canPreviousPage}
            entityLabel="abonnements"
            from={from}
            onFirstPage={() => setPageIndex(0)}
            onLastPage={() => setPageIndex(pageCount - 1)}
            onNextPage={() => setPageIndex(pageIndex + 1)}
            onPageChange={setPageIndex}
            onPageSizeChange={setPageSize}
            onPreviousPage={() => setPageIndex(pageIndex - 1)}
            pageCount={pageCount}
            pageIndex={pageIndex}
            pageSize={pageSize}
            to={to}
            total={filtered.length}
          />
        )}
      </div>
    </div>
  );
}
