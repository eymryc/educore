"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CrudCreateLink } from "@/presentation/components/forms/CrudLinks";
import {
  crudRowActions,
  DataTableActionsMenu,
} from "@/presentation/components/shared/DataTableActionsMenu";
import { StatusBadge } from "@/presentation/components/shared/StatusBadge";
import {
  DataTableRefreshButton,
  DataTableSelectCell,
  DataTableSelectHeader,
} from "@/presentation/components/shared/DataTableControls";
import {
  DataTableSkeleton,
  TEACHERS_TABLE_SKELETON_COLUMNS,
} from "@/presentation/components/shared/DataTableSkeleton";
import { DataTablePagination } from "@/presentation/components/shared/DataTablePagination";
import {
  tableRowClass,
  useClientDataTable,
} from "@/presentation/components/shared/data-table-utils";
import {
  DATA_TABLE_CREATE_CLASS,
  DataTableClearFilters,
  DataTableEmpty,
  DataTableFilterSelect,
  DataTableSearch,
  DataTableShell,
  DataTableToolbar,
  DataTableToolbarActions,
} from "@/presentation/components/shared/DataTable";
import { listSubjects } from "@/infrastructure/api/resources/academic";
import { deleteTeacher, listTeachers } from "@/infrastructure/api/resources/teachers";
import { useAuth, getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import { can } from "@/shared/lib/permissions";
import type { SubjectRef } from "@/shared/types/teacher.types";
import {
  TEACHER_STATUS_LABELS,
  filterTeachers,
  teacherFullName,
  type Teacher,
  type TeacherStatus,
} from "@/shared/types/teacher.types";
import { useConfirm } from "@/presentation/components/providers/ConfirmDialogProvider";

function statusTone(status: TeacherStatus): "success" | "error" | "warning" | "neutral" | "info" {
  if (status === "active") return "success";
  if (status === "on_leave") return "info";
  if (status === "suspended") return "warning";
  return "error";
}

export function TeachersManagementContent() {
  const confirmDialog = useConfirm();
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<SubjectRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const canCreate = can(user, "teachers.create");
  const canUpdate = can(user, "teachers.update");
  const canDelete = can(user, "teachers.delete");

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const [list, subjectList] = await Promise.all([listTeachers(), listSubjects()]);
      setTeachers(list);
      setSubjects(subjectList);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  const filtered = useMemo(
    () => filterTeachers(teachers, { search, status, subjectId }),
    [teachers, search, status, subjectId]
  );

  const hasFilters = Boolean(search || status || subjectId);

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
  } = useClientDataTable(filtered, [search, status, subjectId]);

  function clearFilters() {
    setSearch("");
    setStatus("");
    setSubjectId("");
  }

  async function handleDelete(teacher: Teacher) {
    if (!canDelete) return;
    if (!await confirmDialog(`Supprimer ${teacherFullName(teacher)} ?`)) return;
    setDeletingId(teacher.id);
    try {
      await deleteTeacher(teacher.id);
      setTeachers((prev) => prev.filter((t) => t.id !== teacher.id));
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col w-full h-full max-w-[1400px] mx-auto gap-lg pb-xl">
      {error && (
        <div
          role="alert"
          className="rounded-lg bg-error-container text-on-error-container px-md py-sm font-body-sm"
        >
          {error}
        </div>
      )}

      <DataTableShell>
        <DataTableToolbar>
          <DataTableSearch
            ariaLabel="Rechercher un enseignant"
            onChange={setSearch}
            placeholder="Rechercher par nom, e-mail ou n° employé…"
            value={search}
          />
          <DataTableFilterSelect
            ariaLabel="Filtrer par matière"
            onChange={setSubjectId}
            options={subjects.map((s) => ({ value: String(s.id), label: s.name }))}
            placeholder="Toutes les matières"
            value={subjectId}
          />
          <DataTableFilterSelect
            ariaLabel="Filtrer par statut"
            onChange={setStatus}
            options={(Object.keys(TEACHER_STATUS_LABELS) as TeacherStatus[]).map((key) => ({
              value: key,
              label: TEACHER_STATUS_LABELS[key],
            }))}
            placeholder="Tous les statuts"
            value={status}
          />
          {hasFilters && <DataTableClearFilters onClick={clearFilters} />}
          <DataTableToolbarActions>
            <DataTableRefreshButton loading={loading} onRefresh={() => void reload()} />
            {canCreate && (
              <CrudCreateLink
                className={DATA_TABLE_CREATE_CLASS}
                label="AJOUTER UN ENSEIGNANT"
                resource="teachers"
              />
            )}
          </DataTableToolbarActions>
        </DataTableToolbar>

        <div className="overflow-x-auto min-h-[320px]">
          {loading ? (
            <DataTableSkeleton
              columns={TEACHERS_TABLE_SKELETON_COLUMNS}
              label="Chargement des enseignants…"
              labels={[
                "",
                "Nom",
                "Prénom",
                "E-mail",
                "N° employé",
                "Matière principale",
                "Affectations",
                "Statut",
                "",
              ]}
              rows={10}
              testId="teachers-loading"
            />
          ) : filtered.length === 0 ? (
            <DataTableEmpty
              description="Aucun enseignant ne correspond à vos filtres, ou la liste est vide."
              icon="school"
              testId="teachers-empty"
              title="Aucun enseignant trouvé"
            >
              {canCreate && <CrudCreateLink resource="teachers" label="AJOUTER UN ENSEIGNANT" />}
            </DataTableEmpty>
          ) : (
            <table className="w-full text-left border-collapse" data-testid="teachers-table">
              <thead className="bg-surface-container-low/80 sticky top-0 z-10">
                <tr className="ui-table-head-row">
                  <DataTableSelectHeader
                    checked={allPageSelected}
                    indeterminate={somePageSelected && !allPageSelected}
                    onChange={toggleAllPage}
                  />
                  <th className="py-sm px-lg">Nom</th>
                  <th className="py-sm px-lg">Prénom</th>
                  <th className="py-sm px-lg">E-mail</th>
                  <th className="py-sm px-lg">N° employé</th>
                  <th className="py-sm px-lg">Matière principale</th>
                  <th className="py-sm px-lg">Affectations</th>
                  <th className="py-sm px-lg">Statut</th>
                  <th className="py-sm px-lg text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-body-sm">
                {pageRows.map((teacher, index) => (
                  <tr className={tableRowClass(index)} key={teacher.id}>
                    <DataTableSelectCell
                      checked={selectedIds.has(teacher.id)}
                      label={teacherFullName(teacher)}
                      onChange={() => toggleOne(teacher.id)}
                    />
                    <td className="py-sm px-lg">
                      <Link
                        className="font-semibold text-on-surface group-hover:text-primary hover:opacity-90 transition-colors"
                        href={`/teachers/${teacher.id}`}
                      >
                        {teacher.last_name}
                      </Link>
                    </td>
                    <td className="py-sm px-lg">
                      <Link
                        className="text-on-surface hover:text-primary"
                        href={`/teachers/${teacher.id}`}
                      >
                        {teacher.first_name}
                      </Link>
                    </td>
                    <td className="py-sm px-lg text-[13px] text-on-surface-variant font-mono-data">
                      {teacher.email || "—"}
                    </td>
                    <td className="py-sm px-lg text-[12px] text-on-surface-variant font-mono-data">
                      {teacher.employee_number || "—"}
                    </td>
                    <td className="py-sm px-lg">
                      {teacher.main_subject ? (
                        <span className="px-[8px] py-[4px] rounded-md bg-secondary-fixed/50 text-on-secondary-fixed-variant text-[11px] font-semibold">
                          {teacher.main_subject.name}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-sm px-lg font-mono-data">
                      {teacher.assignments_count ?? 0}
                    </td>
                    <td className="py-sm px-lg">
                      <StatusBadge
                        label={TEACHER_STATUS_LABELS[teacher.status]}
                        tone={statusTone(teacher.status)}
                        withDot
                      />
                    </td>
                    <td className="py-sm px-lg text-right">
                      <DataTableActionsMenu
                        ariaLabel={`Actions pour ${teacherFullName(teacher)}`}
                        items={crudRowActions({
                          view: {
                            href: `/teachers/${teacher.id}`,
                            label: "Voir la fiche",
                            icon: "assignment",
                          },
                          edit: { resource: "teachers", recordId: teacher.id },
                          delete: {
                            onClick: () => void handleDelete(teacher),
                            disabled: deletingId === teacher.id,
                          },
                          canUpdate,
                          canDelete,
                        })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!loading && filtered.length > 0 && (
          <DataTablePagination
            canNextPage={canNextPage}
            canPreviousPage={canPreviousPage}
            entityLabel="enseignants"
            filteredHint={
              filtered.length !== teachers.length
                ? `filtre sur ${teachers.length}`
                : undefined
            }
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
            testId="teachers-pagination"
            to={to}
            total={filtered.length}
          />
        )}
      </DataTableShell>
    </div>
  );
}
