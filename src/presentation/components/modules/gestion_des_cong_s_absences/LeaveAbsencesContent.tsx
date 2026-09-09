"use client";

import { useEffect, useMemo, useState } from "react";
import { CrudCreateLink } from "@/presentation/components/forms/CrudLinks";
import {
  crudRowActions,
  DataTableActionsMenu,
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

import { ContentTabs } from "@/presentation/components/shared/ContentTabs";
import { StatusBadge } from "@/presentation/components/shared/StatusBadge";
import {
  tableRowClass,
  useClientDataTable,
} from "@/presentation/components/shared/data-table-utils";
import {
  approveStaffLeave,
  deleteStaffAttendance,
  deleteStaffLeave,
  listStaffAttendance,
  listStaffLeaves,
  rejectStaffLeave,
} from "@/infrastructure/api/resources/hr";
import { useAuth, getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import { can } from "@/shared/lib/permissions";
import {
  STAFF_ATTENDANCE_STATUS_LABELS,
  STAFF_LEAVE_STATUS_LABELS,
  STAFF_LEAVE_TYPE_LABELS,
  staffMemberName,
  type StaffAttendance,
  type StaffLeave,
  type StaffLeaveStatus,
} from "@/shared/types/hr.types";
import { useConfirm } from "@/presentation/components/providers/ConfirmDialogProvider";

type Tab = "leaves" | "attendance";

function leaveTone(
  status: StaffLeaveStatus
): "neutral" | "warning" | "success" | "error" {
  if (status === "pending") return "warning";
  if (status === "approved") return "success";
  if (status === "rejected") return "error";
  return "neutral";
}

export function LeaveAbsencesContent() {
  const confirmDialog = useConfirm();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("leaves");
  const [leaves, setLeaves] = useState<StaffLeave[]>([]);
  const [attendance, setAttendance] = useState<StaffAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const canView = can(user, "hr.view");
  const canCreate = can(user, "hr.create");
  const canUpdate = can(user, "hr.update");
  const canDelete = can(user, "hr.delete");

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const [l, a] = await Promise.all([listStaffLeaves(), listStaffAttendance()]);
      setLeaves(l);
      setAttendance(a);
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

  const filteredLeaves = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leaves.filter((l) => {
      if (statusFilter && l.status !== statusFilter) return false;
      if (!q) return true;
      const name = staffMemberName(l.staff_member).toLowerCase();
      const type = (STAFF_LEAVE_TYPE_LABELS[l.leave_type] ?? l.leave_type).toLowerCase();
      return name.includes(q) || type.includes(q);
    });
  }, [leaves, search, statusFilter]);

  const filteredAttendance = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return attendance;
    return attendance.filter((a) => {
      const name = staffMemberName(a.staff_member).toLowerCase();
      const status = (
        STAFF_ATTENDANCE_STATUS_LABELS[a.status] ?? a.status
      ).toLowerCase();
      const notes = (a.notes ?? "").toLowerCase();
      return name.includes(q) || status.includes(q) || notes.includes(q);
    });
  }, [attendance, search]);

  const leavesTable = useClientDataTable(filteredLeaves, [search, statusFilter, tab]);
  const attendanceTable = useClientDataTable(filteredAttendance, [search, tab]);

  async function handleApprove(row: StaffLeave) {
    if (!canUpdate || row.status !== "pending") return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await approveStaffLeave(row.id);
      setLeaves((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      setNotice(`Congé de ${staffMemberName(updated.staff_member)} approuvé.`);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleReject(row: StaffLeave) {
    if (!canUpdate || row.status !== "pending") return;
    if (
      !(await confirmDialog(`Rejeter le congé de ${staffMemberName(row.staff_member)} ?`))
    )
      return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await rejectStaffLeave(row.id);
      setLeaves((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      setNotice(`Congé de ${staffMemberName(updated.staff_member)} rejeté.`);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteLeave(row: StaffLeave) {
    if (!canDelete) return;
    if (
      !(await confirmDialog("Supprimer cette demande de congé ?", { destructive: true }))
    )
      return;
    setBusy(true);
    try {
      await deleteStaffLeave(row.id);
      setLeaves((prev) => prev.filter((l) => l.id !== row.id));
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteAttendance(row: StaffAttendance) {
    if (!canDelete) return;
    if (
      !(await confirmDialog("Supprimer cet enregistrement de présence ?", {
        destructive: true,
      }))
    )
      return;
    setBusy(true);
    try {
      await deleteStaffAttendance(row.id);
      setAttendance((prev) => prev.filter((a) => a.id !== row.id));
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

  const searchPlaceholder =
    tab === "leaves" ? "Employé, type…" : "Employé, statut, notes…";
  const searchLabel =
    tab === "leaves" ? "Rechercher congés" : "Rechercher présences";
  const createLabel = tab === "leaves" ? "Nouveau congé" : "Nouvelle présence";
  const createResource = tab === "leaves" ? "leave" : "staff-attendance";

  return (
    <div className="flex flex-col w-full gap-lg pb-xl max-w-7xl mx-auto" data-testid="leave-panel">
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

      <DataTableShell>
        <ContentTabs
          items={[
            { id: "leaves", label: "Congés", count: leaves.length },
            { id: "attendance", label: "Présences", count: attendance.length },
          ]}
          onChange={(id) => {
            setTab(id);
            setSearch("");
            setStatusFilter("");
          }}
          testId="leave-tabs"
          value={tab}
        />

        <DataTableToolbar>
          <DataTableSearch
            ariaLabel={searchLabel}
            onChange={setSearch}
            placeholder={searchPlaceholder}
            value={search}
          />
          {tab === "leaves" && (
            <DataTableFilterSelect
              ariaLabel="Filtrer statut congé"
              onChange={setStatusFilter}
              options={Object.entries(STAFF_LEAVE_STATUS_LABELS).map(([k, v]) => ({
                value: k,
                label: v,
              }))}
              placeholder="Tous les statuts"
              value={statusFilter}
            />
          )}
          <div className="flex flex-wrap items-center justify-end gap-sm w-full sm:w-auto sm:ml-auto">
            <DataTableRefreshButton loading={loading} onRefresh={() => void reload()} />
            {canCreate && (
              <CrudCreateLink
                className={DATA_TABLE_CREATE_CLASS}
                label={createLabel}
                resource={createResource}
              />
            )}
          </div>
        </DataTableToolbar>

        {tab === "leaves" && (
          <>
            <div className="overflow-x-auto min-h-[320px]" data-testid="leaves-table">
              {loading ? (
                <ContentSkeleton testId="leave-loading" variant="table" />
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-surface-container-low/80 sticky top-0 z-10">
                    <tr className="ui-table-head-row">
                      <DataTableSelectHeader
                        checked={leavesTable.allPageSelected}
                        indeterminate={
                          leavesTable.somePageSelected && !leavesTable.allPageSelected
                        }
                        onChange={leavesTable.toggleAllPage}
                      />
                      <th className="py-sm px-md">Employé</th>
                      <th className="py-sm px-md">Type</th>
                      <th className="py-sm px-md">Dates</th>
                      <th className="py-sm px-md">Statut</th>
                      <th className="py-sm px-md text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="font-body-sm text-body-sm">
                    {filteredLeaves.length === 0 ? (
                      <tr>
                        <td className="py-xl px-lg text-on-surface-variant" colSpan={6}>
                          Aucun congé.
                        </td>
                      </tr>
                    ) : (
                      leavesTable.pageRows.map((row, index) => (
                        <tr className={tableRowClass(index)} key={row.id}>
                          <DataTableSelectCell
                            checked={leavesTable.selectedIds.has(row.id)}
                            label={staffMemberName(row.staff_member)}
                            onChange={() => leavesTable.toggleOne(row.id)}
                          />
                          <td className="py-sm px-md font-semibold">
                            {staffMemberName(row.staff_member)}
                          </td>
                          <td className="py-sm px-md">
                            {STAFF_LEAVE_TYPE_LABELS[row.leave_type] ?? row.leave_type}
                          </td>
                          <td className="py-sm px-md">
                            {row.start_date?.slice(0, 10)} → {row.end_date?.slice(0, 10)}
                            {row.duration_days != null ? ` (${row.duration_days} j)` : ""}
                          </td>
                          <td className="py-sm px-md">
                            <StatusBadge
                              label={STAFF_LEAVE_STATUS_LABELS[row.status]}
                              tone={leaveTone(row.status)}
                              withDot
                            />
                          </td>
                          <td className="py-sm px-md text-right">
                            <DataTableActionsMenu
                              ariaLabel={`Actions pour ${staffMemberName(row.staff_member)}`}
                              items={[
                                ...(canUpdate && row.status === "pending"
                                  ? [
                                      {
                                        kind: "button" as const,
                                        label: "Approuver",
                                        icon: "check_circle",
                                        onClick: () => void handleApprove(row),
                                        disabled: busy,
                                      },
                                      {
                                        kind: "button" as const,
                                        label: "Rejeter",
                                        icon: "cancel",
                                        onClick: () => void handleReject(row),
                                        disabled: busy,
                                        destructive: true,
                                      },
                                    ]
                                  : []),
                                ...crudRowActions({
                                  edit:
                                    canUpdate && row.status === "pending"
                                      ? { resource: "leave", recordId: row.id }
                                      : undefined,
                                  delete: {
                                    onClick: () => void handleDeleteLeave(row),
                                    disabled: busy,
                                  },
                                  canUpdate: canUpdate && row.status === "pending",
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

            {!loading && filteredLeaves.length > 0 && (
              <DataTablePagination
                canNextPage={leavesTable.canNextPage}
                canPreviousPage={leavesTable.canPreviousPage}
                entityLabel="congés"
                from={leavesTable.from}
                onFirstPage={() => leavesTable.setPageIndex(0)}
                onLastPage={() => leavesTable.setPageIndex(leavesTable.pageCount - 1)}
                onNextPage={() => leavesTable.setPageIndex(leavesTable.pageIndex + 1)}
                onPageChange={leavesTable.setPageIndex}
                onPageSizeChange={leavesTable.setPageSize}
                onPreviousPage={() => leavesTable.setPageIndex(leavesTable.pageIndex - 1)}
                pageCount={leavesTable.pageCount}
                pageIndex={leavesTable.pageIndex}
                pageSize={leavesTable.pageSize}
                testId="leaves-pagination"
                to={leavesTable.to}
                total={filteredLeaves.length}
              />
            )}
          </>
        )}

        {tab === "attendance" && (
          <>
            <div className="overflow-x-auto min-h-[320px]" data-testid="attendance-table">
              {loading ? (
                <ContentSkeleton testId="leave-loading" variant="table" />
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-surface-container-low/80 sticky top-0 z-10">
                    <tr className="ui-table-head-row">
                      <DataTableSelectHeader
                        checked={attendanceTable.allPageSelected}
                        indeterminate={
                          attendanceTable.somePageSelected &&
                          !attendanceTable.allPageSelected
                        }
                        onChange={attendanceTable.toggleAllPage}
                      />
                      <th className="py-sm px-md">Employé</th>
                      <th className="py-sm px-md">Date</th>
                      <th className="py-sm px-md">Statut</th>
                      <th className="py-sm px-md">Notes</th>
                      <th className="py-sm px-md text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="font-body-sm text-body-sm">
                    {filteredAttendance.length === 0 ? (
                      <tr>
                        <td className="py-xl px-lg text-on-surface-variant" colSpan={6}>
                          Aucune présence.
                        </td>
                      </tr>
                    ) : (
                      attendanceTable.pageRows.map((row, index) => (
                        <tr className={tableRowClass(index)} key={row.id}>
                          <DataTableSelectCell
                            checked={attendanceTable.selectedIds.has(row.id)}
                            label={staffMemberName(row.staff_member)}
                            onChange={() => attendanceTable.toggleOne(row.id)}
                          />
                          <td className="py-sm px-md font-semibold">
                            {staffMemberName(row.staff_member)}
                          </td>
                          <td className="py-sm px-md">
                            {row.attendance_date?.slice(0, 10)}
                          </td>
                          <td className="py-sm px-md">
                            {STAFF_ATTENDANCE_STATUS_LABELS[row.status] ?? row.status}
                          </td>
                          <td className="py-sm px-md text-on-surface-variant">
                            {row.notes ?? "—"}
                          </td>
                          <td className="py-sm px-md text-right">
                            <DataTableActionsMenu
                              ariaLabel={`Actions pour ${staffMemberName(row.staff_member)}`}
                              items={crudRowActions({
                                edit: {
                                  resource: "staff-attendance",
                                  recordId: row.id,
                                },
                                delete: {
                                  onClick: () => void handleDeleteAttendance(row),
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

            {!loading && filteredAttendance.length > 0 && (
              <DataTablePagination
                canNextPage={attendanceTable.canNextPage}
                canPreviousPage={attendanceTable.canPreviousPage}
                entityLabel="présences"
                from={attendanceTable.from}
                onFirstPage={() => attendanceTable.setPageIndex(0)}
                onLastPage={() =>
                  attendanceTable.setPageIndex(attendanceTable.pageCount - 1)
                }
                onNextPage={() =>
                  attendanceTable.setPageIndex(attendanceTable.pageIndex + 1)
                }
                onPageChange={attendanceTable.setPageIndex}
                onPageSizeChange={attendanceTable.setPageSize}
                onPreviousPage={() =>
                  attendanceTable.setPageIndex(attendanceTable.pageIndex - 1)
                }
                pageCount={attendanceTable.pageCount}
                pageIndex={attendanceTable.pageIndex}
                pageSize={attendanceTable.pageSize}
                testId="staff-attendance-pagination"
                to={attendanceTable.to}
                total={filteredAttendance.length}
              />
            )}
          </>
        )}
      </DataTableShell>
    </div>
  );
}
