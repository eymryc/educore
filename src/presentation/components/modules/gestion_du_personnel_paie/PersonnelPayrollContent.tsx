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
  deleteStaffPayroll,
  listStaffPayrolls,
  processStaffPayroll,
} from "@/infrastructure/api/resources/hr";
import { useAuth, getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import { can } from "@/shared/lib/permissions";
import { formatMoneyFcfa } from "@/shared/types/finance.types";
import {
  STAFF_PAYROLL_STATUS_LABELS,
  staffMemberName,
  type StaffPayroll,
  type StaffPayrollStatus,
} from "@/shared/types/hr.types";
import { useConfirm } from "@/presentation/components/providers/ConfirmDialogProvider";

function tone(status: StaffPayrollStatus): "neutral" | "warning" | "success" | "info" {
  if (status === "draft") return "warning";
  if (status === "processed") return "info";
  return "success";
}

export function PersonnelPayrollContent() {
  const confirmDialog = useConfirm();
  const { user } = useAuth();
  const [rows, setRows] = useState<StaffPayroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const canView = can(user, "hr.view");
  const canCreate = can(user, "hr.create");
  const canUpdate = can(user, "hr.update");
  const canDelete = can(user, "hr.delete");

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      setRows(await listStaffPayrolls());
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
      const name = staffMemberName(r.staff_member).toLowerCase();
      return name.includes(q) || String(r.period_year).includes(q);
    });
  }, [rows, search, status]);

  const draftCount = useMemo(
    () => rows.filter((r) => r.status === "draft").length,
    [rows]
  );

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

  async function handleProcess(row: StaffPayroll) {
    if (!canUpdate || row.status !== "draft") return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await processStaffPayroll(row.id);
      setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setNotice(
        `Fiche ${staffMemberName(updated.staff_member)} traitée (${STAFF_PAYROLL_STATUS_LABELS[updated.status]}).`
      );
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(row: StaffPayroll) {
    if (!canDelete) return;
    if (!await confirmDialog("Supprimer cette fiche de paie ?")) return;
    setBusy(true);
    try {
      await deleteStaffPayroll(row.id);
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (!canView) {
    return (
      <p className="p-xl font-body-md text-on-surface-variant">Accès réservé (`hr.view`).</p>
    );
  }

  return (
    <div className="flex flex-col w-full gap-lg pb-xl max-w-7xl mx-auto" data-testid="payroll-panel">
<div className="bg-surface-container-high rounded-xl p-lg">
        <span className="font-label-caps text-on-surface-variant">Brouillons à traiter</span>
</div>

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

      <div className="ui-table-shell" data-testid="payroll-table">
        <div className="px-lg pt-lg pb-md flex flex-wrap items-center gap-sm border-b border-outline-variant/15">
          <div className="ui-search-field flex-1 min-w-[200px] h-10 py-0">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
              search
            </span>
            <input
              aria-label="Rechercher"
              className="ui-search-input ml-sm h-full"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Employé, année…"
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
            {Object.entries(STAFF_PAYROLL_STATUS_LABELS).map(([k, v]) => (
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
                label="NOUVELLE FICHE"
                resource="payroll"
              />
            )}
          </div>
        </div>

        <div className="overflow-x-auto min-h-[320px]">
          {loading ? (
            <ContentSkeleton testId="payroll-loading" variant="table" />
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
                  <th className="py-sm px-md text-right">Net</th>
                  <th className="py-sm px-md">Statut</th>
                  <th className="py-sm px-md text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-body-sm">
                {filtered.length === 0 ? (
                  <tr>
                    <td className="py-xl px-lg text-on-surface-variant" colSpan={6}>
                      Aucune fiche.
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
                      <td className="py-sm px-md">
                        {row.period_month}/{row.period_year}
                      </td>
                      <td className="py-sm px-md text-right font-mono-data">
                        {formatMoneyFcfa(row.net_salary)}
                      </td>
                      <td className="py-sm px-md">
                        <StatusBadge
                          label={STAFF_PAYROLL_STATUS_LABELS[row.status]}
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
                                    label: "Traiter",
                                    icon: "payments",
                                    onClick: () => void handleProcess(row),
                                    disabled: busy,
                                  },
                                ]
                              : []),
                            ...crudRowActions({
                              edit:
                                canUpdate && row.status === "draft"
                                  ? { resource: "payroll", recordId: row.id }
                                  : undefined,
                              delete: {
                                onClick: () => void handleDelete(row),
                                disabled: busy,
                              },
                              canUpdate: canUpdate && row.status === "draft",
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
            entityLabel="fiches de paie"
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
            testId="payroll-pagination"
            to={to}
            total={filtered.length}
          />
        )}
      </div>
    </div>
  );
}
