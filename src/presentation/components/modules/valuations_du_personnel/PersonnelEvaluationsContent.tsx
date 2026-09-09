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

import { StatusBadge } from "@/presentation/components/shared/StatusBadge";
import {
  tableRowClass,
  useClientDataTable,
} from "@/presentation/components/shared/data-table-utils";
import {
  deleteStaffEvaluation,
  listStaffEvaluations,
  updateStaffEvaluation,
} from "@/infrastructure/api/resources/hr";
import { useAuth, getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import { can } from "@/shared/lib/permissions";
import {
  STAFF_EVALUATION_STATUS_LABELS,
  staffMemberName,
  type StaffEvaluation,
  type StaffEvaluationStatus,
} from "@/shared/types/hr.types";
import { useConfirm } from "@/presentation/components/providers/ConfirmDialogProvider";

function tone(status: StaffEvaluationStatus): "warning" | "success" {
  return status === "finalized" ? "success" : "warning";
}

export function PersonnelEvaluationsContent() {
  const confirmDialog = useConfirm();
  const { user } = useAuth();
  const [rows, setRows] = useState<StaffEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  const canView = can(user, "hr.view");
  const canCreate = can(user, "hr.create");
  const canUpdate = can(user, "hr.update");
  const canDelete = can(user, "hr.delete");

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      setRows(await listStaffEvaluations());
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
    if (!status) return rows;
    return rows.filter((r) => r.status === status);
  }, [rows, status]);

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
  } = useClientDataTable(filtered, [status]);

  async function handleFinalize(row: StaffEvaluation) {
    if (!canUpdate || row.status === "finalized") return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await updateStaffEvaluation(row.id, { status: "finalized" });
      setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setNotice(`Évaluation de ${staffMemberName(updated.staff_member)} finalisée.`);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(row: StaffEvaluation) {
    if (!canDelete) return;
    if (!await confirmDialog("Supprimer cette évaluation ?")) return;
    setBusy(true);
    try {
      await deleteStaffEvaluation(row.id);
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
      data-testid="evaluations-panel"
    >
{error && (
        <div className="rounded-lg bg-error-container text-on-error-container px-md py-sm" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-lg bg-secondary-container text-on-secondary-container px-md py-sm">
          {notice}
        </div>
      )}

      <DataTableShell testId="evaluations-table">
        <DataTableToolbar>
          <DataTableFilterSelect
            ariaLabel="Filtrer statut"
            onChange={setStatus}
            options={Object.entries(STAFF_EVALUATION_STATUS_LABELS).map(([k, v]) => ({
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
                label="NOUVELLE ÉVALUATION"
                resource="staff-evaluations"
              />
            )}
          </div>
        </DataTableToolbar>

        <div className="overflow-x-auto min-h-[320px]">
          {loading ? (
            <ContentSkeleton testId="evaluations-loading" variant="table" />
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low/80 sticky top-0 z-10">
                <tr className="ui-table-head-row">
                  <DataTableSelectHeader
                    checked={allPageSelected}
                    indeterminate={somePageSelected && !allPageSelected}
                    onChange={toggleAllPage}
                  />
                  <th className="py-sm px-md">Employé</th>
                  <th className="py-sm px-md">Période</th>
                  <th className="py-sm px-md">Date</th>
                  <th className="py-sm px-md text-right">Note</th>
                  <th className="py-sm px-md">Statut</th>
                  <th className="py-sm px-md text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-body-sm">
                {filtered.length === 0 ? (
                  <tr>
                    <td className="py-xl px-lg text-on-surface-variant" colSpan={7}>
                      Aucune évaluation.
                    </td>
                  </tr>
                ) : (
                  pageRows.map((row, index) => (
                    <tr className={tableRowClass(index)} key={row.id}>
                      <DataTableSelectCell
                        checked={selectedIds.has(row.id)}
                        label={staffMemberName(row.staff_member)}
                        onChange={() => toggleOne(row.id)}
                      />
                      <td className="py-sm px-md font-semibold">
                        {staffMemberName(row.staff_member)}
                      </td>
                      <td className="py-sm px-md">{row.period_label}</td>
                      <td className="py-sm px-md">{row.evaluation_date?.slice(0, 10)}</td>
                      <td className="py-sm px-md text-right font-mono-data">
                        {row.overall_score}/20
                      </td>
                      <td className="py-sm px-md">
                        <StatusBadge
                          label={STAFF_EVALUATION_STATUS_LABELS[row.status]}
                          tone={tone(row.status)}
                        />
                      </td>
                      <td className="py-sm px-md text-right">
                        <DataTableActionsMenu
                          ariaLabel={`Actions pour ${staffMemberName(row.staff_member)}`}
                          items={[
                            ...(canUpdate && row.status === "draft"
                              ? [
                                  {
                                    kind: "button" as const,
                                    label: "Finaliser",
                                    icon: "task_alt",
                                    onClick: () => void handleFinalize(row),
                                    disabled: busy,
                                  },
                                ]
                              : []),
                            ...crudRowActions({
                              edit: { resource: "staff-evaluations", recordId: row.id },
                              delete: {
                                onClick: () => void handleDelete(row),
                                disabled: busy,
                              },
                              canUpdate,
                              canDelete,
                            }),
                          ]}
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
            entityLabel="évaluations"
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
            testId="evaluations-pagination"
            to={to}
            total={filtered.length}
          />
        )}
      </DataTableShell>
    </div>
  );
}
