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
import {
  DataTableShell,
  DataTableToolbar,
  DataTableSearch,
  DataTableFilterSelect,
  DATA_TABLE_CREATE_CLASS,
} from "@/presentation/components/shared/DataTable";
import { StatusBadge } from "@/presentation/components/shared/StatusBadge";
import {
  tableRowClass,
  useClientDataTable,
} from "@/presentation/components/shared/data-table-utils";
import {
  deleteTransportVehicle,
  listTransportVehicles,
} from "@/infrastructure/api/resources/transport";
import { useAuth, getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import { can } from "@/shared/lib/permissions";
import {
  TRANSPORT_VEHICLE_STATUS_LABELS,
  type TransportVehicle,
  type TransportVehicleStatus,
} from "@/shared/types/transport.types";
import { useConfirm } from "@/presentation/components/providers/ConfirmDialogProvider";

function tone(
  status: TransportVehicleStatus
): "success" | "warning" | "neutral" {
  if (status === "ACTIVE") return "success";
  if (status === "MAINTENANCE") return "warning";
  return "neutral";
}

export function FleetManagementContent() {
  const confirmDialog = useConfirm();
  const { user } = useAuth();
  const [rows, setRows] = useState<TransportVehicle[]>([]);
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
      setRows(await listTransportVehicles());
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
      return (
        r.plate_number.toLowerCase().includes(q) ||
        r.label.toLowerCase().includes(q)
      );
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

  async function handleDelete(row: TransportVehicle) {
    if (!canDelete) return;
    if (!await confirmDialog(`Supprimer le véhicule ${row.plate_number} ?`)) return;
    setBusy(true);
    try {
      await deleteTransportVehicle(row.id);
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
        Accès réservé — vous n&apos;avez pas la permission nécessaire pour consulter cette page.
      </p>
    );
  }

  return (
    <div className="flex flex-col w-full gap-lg pb-xl max-w-7xl mx-auto" data-testid="fleet-panel">
{error && (
        <div className="rounded-lg bg-error-container text-on-error-container px-md py-sm" role="alert">
          {error}
        </div>
      )}

      <DataTableShell testId="fleet-table">
        <DataTableToolbar>
          <DataTableSearch
            ariaLabel={"Rechercher"}
            onChange={setSearch}
            placeholder={"Immatriculation, libellé…"}
            value={search}
          />
          <DataTableFilterSelect
            ariaLabel="Statut"
            onChange={setStatus}
            options={Object.entries(TRANSPORT_VEHICLE_STATUS_LABELS).map(([k, v]) => ({
              value: k,
              label: v,
            }))}
            placeholder="Tous les statuts"
            value={status}
          />
          <div className="flex flex-wrap items-center justify-end gap-sm w-full sm:w-auto sm:ml-auto">
            <DataTableRefreshButton loading={loading} onRefresh={() => void reload()} />
            {canCreate && (
              <CrudCreateLink
                className={DATA_TABLE_CREATE_CLASS}
                label="AJOUTER UN VÉHICULE"
                resource="fleet"
              />
            )}
          </div>
        </DataTableToolbar>

        <div className="overflow-x-auto">
          {loading ? (
            <ContentSkeleton testId="fleet-loading" variant="table" />
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low/80 sticky top-0 z-10">
                <tr className="ui-table-head-row">
                  <DataTableSelectHeader
                    checked={allPageSelected}
                    indeterminate={somePageSelected && !allPageSelected}
                    onChange={toggleAllPage}
                  />
                  <th className="py-md px-lg">Immatriculation</th>
                  <th className="py-md px-md">Libellé</th>
                  <th className="py-md px-md">Capacité</th>
                  <th className="py-md px-md">Statut</th>
                  <th className="py-md px-md text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td className="py-xl px-lg text-on-surface-variant" colSpan={6}>
                      Aucun véhicule.
                    </td>
                  </tr>
                ) : (
                  pageRows.map((row, index) => (
                    <tr className={tableRowClass(index)} key={row.id}>
                      <DataTableSelectCell
                        checked={selectedIds.has(row.id)}
                        label={row.plate_number}
                        onChange={() => toggleOne(row.id)}
                      />
                      <td className="py-md px-lg font-mono-data text-sm">{row.plate_number}</td>
                      <td className="py-md px-md font-semibold text-sm">{row.label}</td>
                      <td className="py-md px-md font-body-sm">{row.capacity ?? "—"}</td>
                      <td className="py-md px-md">
                        <StatusBadge
                          label={TRANSPORT_VEHICLE_STATUS_LABELS[row.status]}
                          tone={tone(row.status)}
                        />
                      </td>
                      <td className="py-md px-md">
                        <DataTableActionsMenu
                          ariaLabel={`Actions pour ${row.plate_number}`}
                          items={crudRowActions({
                            edit: { resource: "fleet", recordId: row.id },
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
            entityLabel="véhicules"
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
      </DataTableShell>
    </div>
  );
}
