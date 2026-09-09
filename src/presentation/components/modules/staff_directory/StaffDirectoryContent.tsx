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
  DATA_TABLE_CREATE_CLASS,
} from "@/presentation/components/shared/DataTable";

import { ContentTabs } from "@/presentation/components/shared/ContentTabs";
import { StatusBadge } from "@/presentation/components/shared/StatusBadge";
import {
  tableRowClass,
  useClientDataTable,
} from "@/presentation/components/shared/data-table-utils";
import {
  deleteDepartment,
  deleteStaffMember,
  listDepartments,
  listStaffMembers,
} from "@/infrastructure/api/resources/hr";
import { useAuth, getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import { can } from "@/shared/lib/permissions";
import {
  STAFF_STATUS_LABELS,
  staffMemberName,
  type HrDepartmentRef,
  type StaffMember,
  type StaffMemberStatus,
} from "@/shared/types/hr.types";
import { useConfirm } from "@/presentation/components/providers/ConfirmDialogProvider";

type Tab = "staff" | "departments";

function tone(status: StaffMemberStatus): "success" | "neutral" | "warning" | "error" {
  if (status === "active") return "success";
  if (status === "on_leave") return "warning";
  if (status === "suspended") return "error";
  return "neutral";
}

export function StaffDirectoryContent() {
  const confirmDialog = useConfirm();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("staff");
  const [members, setMembers] = useState<StaffMember[]>([]);
  const [departments, setDepartments] = useState<HrDepartmentRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const canView = can(user, "hr.view");
  const canCreate = can(user, "hr.create");
  const canUpdate = can(user, "hr.update");
  const canDelete = can(user, "hr.delete");

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const [m, d] = await Promise.all([listStaffMembers(), listDepartments()]);
      setMembers(m);
      setDepartments(d);
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

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => {
      const hay = `${m.first_name} ${m.last_name} ${m.email} ${m.job_title} ${m.employee_number ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [members, search]);

  const filteredDepartments = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return departments;
    return departments.filter((d) =>
      `${d.name} ${d.code ?? ""} ${d.description ?? ""}`.toLowerCase().includes(q)
    );
  }, [departments, search]);

  const staffTable = useClientDataTable(filteredMembers, [search, tab]);
  const departmentsTable = useClientDataTable(filteredDepartments, [search, tab]);

  async function handleDeleteMember(row: StaffMember) {
    if (!canDelete) return;
    if (!(await confirmDialog(`Supprimer ${staffMemberName(row)} ?`, { destructive: true })))
      return;
    setBusy(true);
    try {
      await deleteStaffMember(row.id);
      setMembers((prev) => prev.filter((m) => m.id !== row.id));
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteDepartment(row: HrDepartmentRef) {
    if (!canDelete) return;
    if (
      !(await confirmDialog(`Supprimer le département « ${row.name} » ?`, { destructive: true }))
    )
      return;
    setBusy(true);
    try {
      await deleteDepartment(row.id);
      setDepartments((prev) => prev.filter((d) => d.id !== row.id));
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
    tab === "staff" ? "Nom, e-mail, poste, matricule…" : "Nom, code…";
  const searchLabel =
    tab === "staff" ? "Rechercher personnel" : "Rechercher départements";
  const createLabel = tab === "staff" ? "Nouveau membre" : "Nouveau département";
  const createResource = tab === "staff" ? "staff-members" : "departments";

  return (
    <div className="flex flex-col w-full gap-lg pb-xl max-w-7xl mx-auto" data-testid="staff-panel">
      {error && (
        <div className="rounded-lg bg-error-container text-on-error-container px-md py-sm" role="alert">
          {error}
        </div>
      )}

      <DataTableShell>
        <ContentTabs
          items={[
            { id: "staff", label: "Personnel", count: members.length },
            { id: "departments", label: "Départements", count: departments.length },
          ]}
          onChange={(id) => {
            setTab(id);
            setSearch("");
          }}
          testId="staff-tabs"
          value={tab}
        />

        <DataTableToolbar>
          <DataTableSearch
            ariaLabel={searchLabel}
            onChange={setSearch}
            placeholder={searchPlaceholder}
            value={search}
          />
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

        {tab === "staff" && (
          <>
            <div className="overflow-x-auto min-h-[320px]" data-testid="staff-table">
              {loading ? (
                <ContentSkeleton testId="staff-loading" variant="table" />
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-surface-container-low/80 sticky top-0 z-10">
                    <tr className="ui-table-head-row">
                      <DataTableSelectHeader
                        checked={staffTable.allPageSelected}
                        indeterminate={
                          staffTable.somePageSelected && !staffTable.allPageSelected
                        }
                        onChange={staffTable.toggleAllPage}
                      />
                      <th className="py-sm px-md">Nom</th>
                      <th className="py-sm px-md">Poste</th>
                      <th className="py-sm px-md">Département</th>
                      <th className="py-sm px-md">Statut</th>
                      <th className="py-sm px-md text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="font-body-sm text-body-sm">
                    {filteredMembers.length === 0 ? (
                      <tr>
                        <td className="py-xl px-lg text-on-surface-variant" colSpan={6}>
                          Aucun membre.
                        </td>
                      </tr>
                    ) : (
                      staffTable.pageRows.map((row, index) => (
                        <tr className={tableRowClass(index)} key={row.id}>
                          <DataTableSelectCell
                            checked={staffTable.selectedIds.has(row.id)}
                            label={staffMemberName(row)}
                            onChange={() => staffTable.toggleOne(row.id)}
                          />
                          <td className="py-sm px-md">
                            <div className="font-semibold">{staffMemberName(row)}</div>
                            <div className="text-[12px] text-on-surface-variant">
                              {row.employee_number ?? "—"} · {row.email}
                            </div>
                          </td>
                          <td className="py-sm px-md">{row.job_title}</td>
                          <td className="py-sm px-md">{row.department?.name ?? "—"}</td>
                          <td className="py-sm px-md">
                            <StatusBadge
                              label={STAFF_STATUS_LABELS[row.status]}
                              tone={tone(row.status)}
                              withDot
                            />
                          </td>
                          <td className="py-sm px-md text-right">
                            <DataTableActionsMenu
                              ariaLabel={`Actions pour ${staffMemberName(row)}`}
                              items={crudRowActions({
                                edit: { resource: "staff-members", recordId: row.id },
                                delete: {
                                  onClick: () => void handleDeleteMember(row),
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

            {!loading && filteredMembers.length > 0 && (
              <DataTablePagination
                canNextPage={staffTable.canNextPage}
                canPreviousPage={staffTable.canPreviousPage}
                entityLabel="membres"
                from={staffTable.from}
                onFirstPage={() => staffTable.setPageIndex(0)}
                onLastPage={() => staffTable.setPageIndex(staffTable.pageCount - 1)}
                onNextPage={() => staffTable.setPageIndex(staffTable.pageIndex + 1)}
                onPageChange={staffTable.setPageIndex}
                onPageSizeChange={staffTable.setPageSize}
                onPreviousPage={() => staffTable.setPageIndex(staffTable.pageIndex - 1)}
                pageCount={staffTable.pageCount}
                pageIndex={staffTable.pageIndex}
                pageSize={staffTable.pageSize}
                testId="staff-pagination"
                to={staffTable.to}
                total={filteredMembers.length}
              />
            )}
          </>
        )}

        {tab === "departments" && (
          <>
            <div className="overflow-x-auto min-h-[320px]" data-testid="departments-table">
              {loading ? (
                <ContentSkeleton testId="staff-loading" variant="table" />
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-surface-container-low/80 sticky top-0 z-10">
                    <tr className="ui-table-head-row">
                      <DataTableSelectHeader
                        checked={departmentsTable.allPageSelected}
                        indeterminate={
                          departmentsTable.somePageSelected && !departmentsTable.allPageSelected
                        }
                        onChange={departmentsTable.toggleAllPage}
                      />
                      <th className="py-sm px-md">Nom</th>
                      <th className="py-sm px-md">Code</th>
                      <th className="py-sm px-md">Description</th>
                      <th className="py-sm px-md text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="font-body-sm text-body-sm">
                    {filteredDepartments.length === 0 ? (
                      <tr>
                        <td className="py-xl px-lg text-on-surface-variant" colSpan={5}>
                          Aucun département.
                        </td>
                      </tr>
                    ) : (
                      departmentsTable.pageRows.map((row, index) => (
                        <tr className={tableRowClass(index)} key={row.id}>
                          <DataTableSelectCell
                            checked={departmentsTable.selectedIds.has(row.id)}
                            label={row.name}
                            onChange={() => departmentsTable.toggleOne(row.id)}
                          />
                          <td className="py-sm px-md font-semibold">{row.name}</td>
                          <td className="py-sm px-md font-mono-data">{row.code ?? "—"}</td>
                          <td className="py-sm px-md text-on-surface-variant">
                            {row.description ?? "—"}
                          </td>
                          <td className="py-sm px-md text-right">
                            <DataTableActionsMenu
                              ariaLabel={`Actions pour ${row.name}`}
                              items={crudRowActions({
                                edit: { resource: "departments", recordId: row.id },
                                delete: {
                                  onClick: () => void handleDeleteDepartment(row),
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

            {!loading && filteredDepartments.length > 0 && (
              <DataTablePagination
                canNextPage={departmentsTable.canNextPage}
                canPreviousPage={departmentsTable.canPreviousPage}
                entityLabel="départements"
                from={departmentsTable.from}
                onFirstPage={() => departmentsTable.setPageIndex(0)}
                onLastPage={() => departmentsTable.setPageIndex(departmentsTable.pageCount - 1)}
                onNextPage={() => departmentsTable.setPageIndex(departmentsTable.pageIndex + 1)}
                onPageChange={departmentsTable.setPageIndex}
                onPageSizeChange={departmentsTable.setPageSize}
                onPreviousPage={() => departmentsTable.setPageIndex(departmentsTable.pageIndex - 1)}
                pageCount={departmentsTable.pageCount}
                pageIndex={departmentsTable.pageIndex}
                pageSize={departmentsTable.pageSize}
                testId="departments-pagination"
                to={departmentsTable.to}
                total={filteredDepartments.length}
              />
            )}
          </>
        )}
      </DataTableShell>
    </div>
  );
}
