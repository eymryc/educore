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
  DATA_TABLE_CREATE_CLASS,
} from "@/presentation/components/shared/DataTable";

import { StatusBadge } from "@/presentation/components/shared/StatusBadge";
import {
  tableRowClass,
  useClientDataTable,
} from "@/presentation/components/shared/data-table-utils";
import {
  deleteTransportDriver,
  listTransportDrivers,
} from "@/infrastructure/api/resources/transport";
import { useAuth, getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import { can } from "@/shared/lib/permissions";
import {
  TRANSPORT_DRIVER_STATUS_LABELS,
  transportDriverName,
  type TransportDriver,
} from "@/shared/types/transport.types";
import { useConfirm } from "@/presentation/components/providers/ConfirmDialogProvider";

export function DriversManagementContent() {
  const confirmDialog = useConfirm();
  const { user } = useAuth();
  const [rows, setRows] = useState<TransportDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const canView = can(user, "transport.view");
  const canCreate = can(user, "transport.create");
  const canUpdate = can(user, "transport.update");
  const canDelete = can(user, "transport.delete");

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      setRows(await listTransportDrivers());
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
    if (!q) return rows;
    return rows.filter((r) =>
      `${r.first_name} ${r.last_name} ${r.phone ?? ""} ${r.license_number ?? ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [rows, search]);

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
  } = useClientDataTable(filtered, [search]);

  async function handleDelete(row: TransportDriver) {
    if (!canDelete) return;
    if (!await confirmDialog(`Supprimer ${transportDriverName(row)} ?`)) return;
    setBusy(true);
    try {
      await deleteTransportDriver(row.id);
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
    <div className="flex flex-col w-full gap-lg pb-xl max-w-7xl mx-auto" data-testid="drivers-panel">
{error && (
        <div className="rounded-lg bg-error-container text-on-error-container px-md py-sm" role="alert">
          {error}
        </div>
      )}

      <DataTableShell testId="drivers-table">
        <DataTableToolbar>
          <DataTableSearch
            ariaLabel={"Rechercher"}
            onChange={setSearch}
            placeholder={"Nom, téléphone, permis…"}
            value={search}
          />
          <div className="flex flex-wrap items-center justify-end gap-sm w-full sm:w-auto sm:ml-auto">
            <DataTableRefreshButton loading={loading} onRefresh={() => void reload()} />
            {canCreate && (
              <CrudCreateLink
                className={DATA_TABLE_CREATE_CLASS}
                label="INSCRIRE UN CHAUFFEUR"
                resource="drivers"
              />
            )}
          </div>
        </DataTableToolbar>

        <div className="overflow-x-auto">
          {loading ? (
            <ContentSkeleton testId="drivers-loading" variant="table" />
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low/80 sticky top-0 z-10">
                <tr className="ui-table-head-row">
                  <DataTableSelectHeader
                    checked={allPageSelected}
                    indeterminate={somePageSelected && !allPageSelected}
                    onChange={toggleAllPage}
                  />
                  <th className="py-md px-lg">Nom</th>
                  <th className="py-md px-md">Contact</th>
                  <th className="py-md px-md">Permis</th>
                  <th className="py-md px-md">Statut</th>
                  <th className="py-md px-md text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td className="py-xl px-lg text-on-surface-variant" colSpan={6}>
                      Aucun chauffeur.
                    </td>
                  </tr>
                ) : (
                  pageRows.map((row, index) => (
                    <tr className={tableRowClass(index)} key={row.id}>
                      <DataTableSelectCell
                        checked={selectedIds.has(row.id)}
                        label={transportDriverName(row)}
                        onChange={() => toggleOne(row.id)}
                      />
                      <td className="py-md px-lg font-semibold text-sm">
                        {transportDriverName(row)}
                      </td>
                      <td className="py-md px-md font-body-sm">
                        {row.phone ?? "—"}
                        {row.email ? ` · ${row.email}` : ""}
                      </td>
                      <td className="py-md px-md font-mono-data text-sm">
                        {row.license_number ?? "—"}
                      </td>
                      <td className="py-md px-md">
                        <StatusBadge
                          label={TRANSPORT_DRIVER_STATUS_LABELS[row.status]}
                          tone={row.status === "ACTIVE" ? "success" : "neutral"}
                        />
                      </td>
                      <td className="py-md px-md text-right">
                        <DataTableActionsMenu
                          ariaLabel={`Actions pour ${transportDriverName(row)}`}
                          items={crudRowActions({
                            edit: { resource: "drivers", recordId: row.id },
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
            entityLabel="chauffeurs"
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
