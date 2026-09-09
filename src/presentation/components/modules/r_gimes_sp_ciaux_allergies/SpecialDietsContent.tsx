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
  DataTableFilterSelect,
  DATA_TABLE_CREATE_CLASS,
} from "@/presentation/components/shared/DataTable";

import { Checkbox } from "@/presentation/components/shared/Checkbox";
import { StatusBadge } from "@/presentation/components/shared/StatusBadge";
import {
  tableRowClass,
  useClientDataTable,
} from "@/presentation/components/shared/data-table-utils";
import {
  deleteCanteenSpecialDiet,
  listCanteenSpecialDiets,
} from "@/infrastructure/api/resources/canteen";
import { useAuth, getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import { can } from "@/shared/lib/permissions";
import { studentFullName } from "@/shared/types/student.types";
import {
  CANTEEN_DIET_TYPE_LABELS,
  type CanteenSpecialDiet,
} from "@/shared/types/canteen.types";
import { useConfirm } from "@/presentation/components/providers/ConfirmDialogProvider";

export function SpecialDietsContent() {
  const confirmDialog = useConfirm();
  const { user } = useAuth();
  const [rows, setRows] = useState<CanteenSpecialDiet[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dietType, setDietType] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);

  const canView = can(user, "canteen.view");
  const canCreate = can(user, "canteen.create");
  const canUpdate = can(user, "canteen.update");
  const canDelete = can(user, "canteen.delete");

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      setRows(await listCanteenSpecialDiets());
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
    return rows.filter((r) => {
      if (dietType && r.diet_type !== dietType) return false;
      if (activeOnly && !r.is_active) return false;
      return true;
    });
  }, [rows, dietType, activeOnly]);

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
  } = useClientDataTable(filtered, [dietType, activeOnly]);

  async function handleDelete(row: CanteenSpecialDiet) {
    if (!canDelete) return;
    const name = row.student ? studentFullName(row.student) : `#${row.student_id}`;
    if (!await confirmDialog(`Supprimer le régime de ${name} ?`)) return;
    setBusy(true);
    try {
      await deleteCanteenSpecialDiet(row.id);
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
    <div
      className="flex flex-col w-full gap-lg pb-xl max-w-7xl mx-auto"
      data-testid="special-diets-panel"
    >
{error && (
        <div className="rounded-lg bg-error-container text-on-error-container px-md py-sm" role="alert">
          {error}
        </div>
      )}

      <DataTableShell testId="special-diets-table">
        <DataTableToolbar>
          <DataTableFilterSelect
            ariaLabel="Type de régime"
            onChange={setDietType}
            options={Object.entries(CANTEEN_DIET_TYPE_LABELS).map(([k, v]) => ({
              value: k,
              label: v,
            }))}
            placeholder="Tous les types"
            value={dietType}
          />
          <label className="flex items-center gap-sm font-body-sm h-10">
            <Checkbox checked={activeOnly} onChange={setActiveOnly} />
            Actifs seulement
          </label>
          <div className="flex flex-wrap items-center justify-end gap-sm w-full sm:w-auto sm:ml-auto">
            <DataTableRefreshButton loading={loading} onRefresh={() => void reload()} />
            {canCreate && (
              <CrudCreateLink
                className={DATA_TABLE_CREATE_CLASS}
                label="NOUVEAU RÉGIME"
                resource="special-diets"
              />
            )}
          </div>
        </DataTableToolbar>

        <div className="overflow-x-auto">
          {loading ? (
            <ContentSkeleton testId="special-diets-loading" variant="table" />
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
                  <th className="py-md px-md">Type</th>
                  <th className="py-md px-md">Allergènes / restrictions</th>
                  <th className="py-md px-md">Statut</th>
                  <th className="py-md px-md text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td className="py-xl px-lg text-on-surface-variant" colSpan={6}>
                      Aucun régime.
                    </td>
                  </tr>
                ) : (
                  pageRows.map((row, index) => {
                    const label = row.student
                      ? studentFullName(row.student)
                      : `#${row.student_id}`;
                    return (
                      <tr className={tableRowClass(index)} key={row.id}>
                        <DataTableSelectCell
                          checked={selectedIds.has(row.id)}
                          label={label}
                          onChange={() => toggleOne(row.id)}
                        />
                        <td className="py-md px-lg font-semibold text-sm">{label}</td>
                        <td className="py-md px-md font-body-sm">
                          {CANTEEN_DIET_TYPE_LABELS[row.diet_type] ?? row.diet_type}
                        </td>
                        <td className="py-md px-md font-body-sm">{row.allergens}</td>
                        <td className="py-md px-md">
                          <StatusBadge
                            label={row.is_active ? "Actif" : "Inactif"}
                            tone={row.is_active ? "success" : "neutral"}
                          />
                        </td>
                        <td className="py-md px-md text-right">
                          <DataTableActionsMenu
                            ariaLabel={`Actions pour ${label}`}
                            items={crudRowActions({
                              edit: { resource: "special-diets", recordId: row.id },
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
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {!loading && filtered.length > 0 && (
          <DataTablePagination
            canNextPage={canNextPage}
            canPreviousPage={canPreviousPage}
            entityLabel="régimes"
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
