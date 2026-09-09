"use client";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { CrudCreateLink } from "@/presentation/components/forms/CrudLinks";
import { Checkbox } from "@/presentation/components/shared/Checkbox";
import {
  crudRowActions,
  DataTableActionsMenu,
} from "@/presentation/components/shared/DataTableActionsMenu";
import { DataTablePagination } from "@/presentation/components/shared/DataTablePagination";
import {
  DataTableShell,
  DataTableToolbar,
  DataTableSearch,
  DataTableFilterSelect,
  DATA_TABLE_CREATE_CLASS,
} from "@/presentation/components/shared/DataTable";

import { DataTableSkeleton } from "@/presentation/components/shared/DataTableSkeleton";
import { StatusBadge } from "@/presentation/components/shared/StatusBadge";
import { useConfirm } from "@/presentation/components/providers/ConfirmDialogProvider";
import {
  listAcademicYears,
  listClassGroups,
  listSubjects,
} from "@/infrastructure/api/resources/academic";
import {
  deleteAssignment,
  gradeSubmission,
  listAssignments,
  listSubmissions,
} from "@/infrastructure/api/resources/assignments";
import { getAuthErrorMessage, useAuth } from "@/infrastructure/auth/AuthProvider";
import { can } from "@/shared/lib/permissions";
import {
  classGroupsForActiveYear,
  type ClassGroup,
  type Subject,
} from "@/shared/types/academic.types";
import {
  ASSIGNMENT_STATUS_LABELS,
  filterAssignments,
  formatDueAt,
  SUBMISSION_STATUS_LABELS,
  type Assignment,
  type AssignmentSubmission,
} from "@/shared/types/assignments.types";
import { studentFullName } from "@/shared/types/student.types";

const DEFAULT_PAGE_SIZE = 10;

const ASSIGNMENTS_TABLE_SKELETON_COLUMNS = [
  { kind: "checkbox" as const, width: "w-4" },
  { kind: "text" as const, width: "w-40" },
  { kind: "text" as const, width: "w-24" },
  { kind: "text" as const, width: "w-28" },
  { kind: "text" as const, width: "w-28" },
  { kind: "text" as const, width: "w-16" },
  { kind: "badge" as const, width: "w-16" },
  { kind: "actions" as const, width: "w-20" },
];

function statusTone(status: string): "success" | "warning" | "error" | "info" | "neutral" {
  if (status === "PUBLISHED" || status === "GRADED") return "success";
  if (status === "DRAFT" || status === "SUBMITTED") return "warning";
  if (status === "CLOSED" || status === "RETURNED") return "neutral";
  return "info";
}

function SortIcon({ direction }: { direction: false | "asc" | "desc" }) {
  return (
    <span
      aria-hidden
      className={`material-symbols-outlined text-[14px] transition-opacity ${
        direction ? "opacity-100 text-primary" : "opacity-25"
      }`}
    >
      {direction === "desc" ? "arrow_downward" : "arrow_upward"}
    </span>
  );
}

export function AssignmentsManagementContent() {
  const confirmDialog = useConfirm();
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [status, setStatus] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "due_at", desc: false }]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [subsLoading, setSubsLoading] = useState(false);
  const [gradeDrafts, setGradeDrafts] = useState<
    Record<number, { score: string; feedback: string }>
  >({});

  const canCreate = can(user, "assignments.create");
  const canUpdate = can(user, "assignments.update");
  const canDelete = can(user, "assignments.delete");
  const canGrade = can(user, "assignments.grade");

  const openAssignment = useMemo(
    () => assignments.find((a) => a.id === openId) ?? null,
    [assignments, openId]
  );

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const [rows, classList, subjectList, yearList] = await Promise.all([
        listAssignments(),
        listClassGroups(),
        listSubjects(),
        listAcademicYears(),
      ]);
      setAssignments(rows);
      setClasses(classGroupsForActiveYear(classList, yearList));
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
    () =>
      filterAssignments(assignments, {
        search,
        classGroupId: classId,
        subjectId,
        status,
      }),
    [assignments, search, classId, subjectId, status]
  );

  const hasFilters = Boolean(search || classId || subjectId || status);

  function clearFilters() {
    setSearch("");
    setClassId("");
    setSubjectId("");
    setStatus("");
  }

  async function openSubmissions(assignment: Assignment) {
    if (openId === assignment.id) {
      setOpenId(null);
      setSubmissions([]);
      return;
    }
    setOpenId(assignment.id);
    setSubsLoading(true);
    setError(null);
    try {
      const rows = await listSubmissions({ assignment_id: assignment.id });
      setSubmissions(rows);
      const drafts: Record<number, { score: string; feedback: string }> = {};
      for (const s of rows) {
        drafts[s.id] = {
          score: s.score != null ? String(s.score) : "",
          feedback: s.feedback ?? "",
        };
      }
      setGradeDrafts(drafts);
    } catch (err) {
      setError(getAuthErrorMessage(err));
      setSubmissions([]);
    } finally {
      setSubsLoading(false);
    }
  }

  async function handleDelete(row: Assignment) {
    if (!canDelete) return;
    if (
      !(await confirmDialog(`Supprimer le devoir « ${row.title} » ?`, { destructive: true }))
    ) {
      return;
    }
    setDeletingId(row.id);
    setBusy(true);
    setError(null);
    try {
      await deleteAssignment(row.id);
      setAssignments((prev) => prev.filter((a) => a.id !== row.id));
      if (openId === row.id) {
        setOpenId(null);
        setSubmissions([]);
      }
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setDeletingId(null);
      setBusy(false);
    }
  }

  async function handleGrade(submission: AssignmentSubmission, maxScore: number | string | null) {
    if (!canGrade) return;
    const draft = gradeDrafts[submission.id];
    const score = Number(draft?.score);
    if (!Number.isFinite(score) || score < 0) {
      setError("Saisissez une note valide.");
      return;
    }
    if (maxScore != null && score > Number(maxScore)) {
      setError(`La note ne peut pas dépasser ${maxScore}.`);
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await gradeSubmission(submission.id, {
        score,
        feedback: draft?.feedback?.trim() ? draft.feedback.trim() : null,
      });
      setSubmissions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setNotice("Soumission notée.");
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const columnHelper = useMemo(() => createColumnHelper<Assignment>(), []);

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "select",
        enableSorting: false,
        header: ({ table }) => (
          <Checkbox
            ariaLabel="Tout sélectionner"
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()}
            onChange={(checked) => table.toggleAllPageRowsSelected(checked)}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            ariaLabel={`Sélectionner ${row.original.title}`}
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onChange={(checked) => row.toggleSelected(checked)}
          />
        ),
      }),
      columnHelper.accessor("title", {
        header: "Titre",
        cell: ({ row }) => (
          <button
            className="font-semibold text-on-surface truncate hover:text-primary transition-colors text-left"
            onClick={() => void openSubmissions(row.original)}
            type="button"
          >
            {row.original.title}
          </button>
        ),
      }),
      columnHelper.accessor((row) => row.class_group?.name ?? "", {
        id: "class",
        header: "Classe",
        cell: ({ row }) => (
          <span className="font-medium text-on-surface">
            {row.original.class_group?.name || `Classe #${row.original.class_group_id}`}
          </span>
        ),
      }),
      columnHelper.accessor((row) => row.subject?.name ?? "", {
        id: "subject",
        header: "Matière",
        cell: ({ row }) => (
          <span className="text-on-surface-variant">
            {row.original.subject?.name || `Matière #${row.original.subject_id}`}
          </span>
        ),
      }),
      columnHelper.accessor("due_at", {
        header: "Échéance",
        cell: (info) => (
          <span className="font-mono-data text-[12px] text-on-surface-variant tracking-wide">
            {formatDueAt(info.getValue())}
          </span>
        ),
      }),
      columnHelper.accessor((row) => Number(row.submissions_count ?? 0), {
        id: "submissions_count",
        header: "Rendus",
        cell: ({ row }) => (
          <span className="font-mono-data text-[12px] tabular-nums">
            {row.original.submissions_count ?? "—"}
          </span>
        ),
      }),
      columnHelper.accessor((row) => String(row.status), {
        id: "status",
        header: "Statut",
        cell: ({ row }) => (
          <StatusBadge
            label={
              ASSIGNMENT_STATUS_LABELS[String(row.original.status)] ?? String(row.original.status)
            }
            tone={statusTone(String(row.original.status))}
            withDot
          />
        ),
      }),
      columnHelper.display({
        id: "actions",
        enableSorting: false,
        header: "Actions",
        cell: ({ row }) => {
          const a = row.original;
          const isOpen = openId === a.id;
          return (
            <div className="inline-flex items-center justify-end gap-xs">
              <button
                className={`inline-flex items-center gap-xs h-8 px-sm rounded-lg text-[11px] font-label-caps transition-colors ${
                  isOpen
                    ? "bg-primary-container text-on-primary-container"
                    : "bg-surface-container-high text-on-surface-variant hover:text-primary"
                }`}
                onClick={() => void openSubmissions(a)}
                type="button"
              >
                {isOpen ? "Masquer rendus" : "Voir rendus"}
              </button>
              <DataTableActionsMenu
                ariaLabel={`Actions pour ${a.title}`}
                items={crudRowActions({
                  edit: { resource: "assignments", recordId: a.id },
                  delete: {
                    onClick: () => void handleDelete(a),
                    disabled: deletingId === a.id || busy,
                  },
                  canUpdate,
                  canDelete,
                })}
              />
            </div>
          );
        },
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [columnHelper, canUpdate, canDelete, deletingId, busy, openId]
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, rowSelection, pagination },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    enableRowSelection: true,
    getRowId: (row) => String(row.id),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    setRowSelection({});
  }, [search, classId, subjectId, status]);

  const { pageIndex, pageSize } = pagination;
  const rowCount = filtered.length;
  const from = rowCount === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, rowCount);

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
      {notice && (
        <div
          className="rounded-lg bg-secondary-container text-on-secondary-container px-md py-sm font-body-sm"
          role="status"
        >
          {notice}
        </div>
      )}

      <DataTableShell testId="assignments-admin-list">
        <DataTableToolbar>
          <DataTableSearch
            ariaLabel={"Rechercher un devoir"}
            onChange={setSearch}
            placeholder={"Rechercher par titre…"}
            value={search}
          />
          <DataTableFilterSelect
            ariaLabel="Filtrer par classe"
            onChange={setClassId}
            options={classes.map((c) => ({ value: String(c.id), label: c.name }))}
            placeholder="Toutes les classes"
            value={classId}
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
            options={Object.entries(ASSIGNMENT_STATUS_LABELS).map(([value, label]) => ({
              value,
              label,
            }))}
            placeholder="Tous les statuts"
            value={status}
          />
          {hasFilters && (
            <button
              className="inline-flex items-center gap-xs h-10 px-md text-[13px] text-on-surface-variant hover:text-primary transition-colors"
              onClick={clearFilters}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">filter_alt_off</span>
              Réinitialiser
            </button>
          )}
          <div className="flex flex-wrap items-center justify-end gap-sm w-full sm:w-auto sm:ml-auto">
            <button
              aria-label="Actualiser la liste"
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest hover:text-primary transition-colors disabled:opacity-40 shadow-sm"
              disabled={loading}
              onClick={() => void reload()}
              title="Actualiser"
              type="button"
            >
              <span
                className={`material-symbols-outlined text-[20px] ${
                  loading ? "animate-spin" : ""
                }`}
              >
                refresh
              </span>
            </button>
            {canCreate && (
              <CrudCreateLink
                className={DATA_TABLE_CREATE_CLASS}
                label="Nouveau devoir"
                resource="assignments"
              />
            )}
          </div>
        </DataTableToolbar>

        <div className="overflow-auto">
          {loading ? (
            <DataTableSkeleton
              columns={ASSIGNMENTS_TABLE_SKELETON_COLUMNS}
              label="Chargement des devoirs…"
              labels={["", "Titre", "Classe", "Matière", "Échéance", "Rendus", "Statut", ""]}
              rows={10}
              testId="assignments-loading"
            />
          ) : rowCount === 0 ? (
            <div
              className="flex flex-col items-center justify-center px-lg py-2xl text-center"
              data-testid="assignments-admin-empty"
            >
              <span className="material-symbols-outlined text-[40px] text-on-surface-variant/50 mb-md">
                assignment
              </span>
              <h3 className="font-title-md text-on-surface mb-xs">Aucun devoir trouvé</h3>
              <p className="font-body-sm text-on-surface-variant max-w-sm mb-lg">
                Aucun résultat pour ces filtres, ou aucun devoir n&apos;a encore été créé.
              </p>
              <div className="flex flex-wrap gap-sm justify-center">
                {hasFilters && (
                  <button className="ui-btn-secondary" onClick={clearFilters} type="button">
                    Effacer les filtres
                  </button>
                )}
                {canCreate && <CrudCreateLink label="Nouveau devoir" resource="assignments" />}
              </div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse" data-testid="assignments-table">
              <thead className="bg-surface-container-low/80 sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const sortable = header.column.getCanSort();
                      const direction = header.column.getIsSorted();
                      const isActions = header.id === "actions";
                      const isSelect = header.id === "select";
                      return (
                        <th
                          aria-sort={
                            direction === "asc"
                              ? "ascending"
                              : direction === "desc"
                                ? "descending"
                                : "none"
                          }
                          className={`px-lg py-sm ui-stat-label whitespace-nowrap ${
                            isActions
                              ? "text-right sticky right-0 bg-surface-container-low/95"
                              : isSelect
                                ? "w-10"
                                : ""
                          }`}
                          key={header.id}
                        >
                          {header.isPlaceholder ? null : sortable ? (
                            <button
                              className="flex items-center gap-xs hover:text-on-surface transition-colors"
                              onClick={header.column.getToggleSortingHandler()}
                              type="button"
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              <SortIcon direction={direction} />
                            </button>
                          ) : (
                            flexRender(header.column.columnDef.header, header.getContext())
                          )}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody className="text-body-sm font-body-sm divide-y divide-outline-variant/10">
                {table.getRowModel().rows.map((row) => {
                  const zebra = row.index % 2 === 1;
                  const isOpen = openId === row.original.id;
                  return (
                    <tr
                      className={`group transition-colors hover:bg-surface-container-low/70 ${
                        isOpen
                          ? "bg-primary-container/15"
                          : zebra
                            ? "bg-surface-container-low/45"
                            : "bg-surface-container-lowest"
                      }`}
                      key={row.id}
                    >
                      {row.getVisibleCells().map((cell) => {
                        const isActions = cell.column.id === "actions";
                        return (
                          <td
                            className={`px-lg py-sm align-middle ${
                              isActions
                                ? `sticky right-0 text-right overflow-visible group-hover:bg-surface-container-low/70 ${
                                    isOpen
                                      ? "bg-primary-container/15"
                                      : zebra
                                        ? "bg-surface-container-low/45"
                                        : "bg-surface-container-lowest"
                                  }`
                                : ""
                            }`}
                            key={cell.id}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {!loading && rowCount > 0 && (
          <DataTablePagination
            canNextPage={table.getCanNextPage()}
            canPreviousPage={table.getCanPreviousPage()}
            entityLabel="devoirs"
            filteredHint={
              filtered.length !== assignments.length
                ? `filtre sur ${assignments.length}`
                : undefined
            }
            from={from}
            onFirstPage={() => table.setPageIndex(0)}
            onLastPage={() => table.setPageIndex(table.getPageCount() - 1)}
            onNextPage={() => table.nextPage()}
            onPageChange={(index) => table.setPageIndex(index)}
            onPageSizeChange={(size) => setPagination({ pageIndex: 0, pageSize: size })}
            onPreviousPage={() => table.previousPage()}
            pageCount={table.getPageCount()}
            pageIndex={pageIndex}
            pageSize={pageSize}
            testId="assignments-pagination"
            to={to}
            total={rowCount}
          />
        )}
      </DataTableShell>

      {openAssignment && (
        <DataTableShell>
          <DataTableToolbar>
            <div>
              <h2 className="font-title-sm text-on-surface">
                Rendus — {openAssignment.title}
              </h2>
              <p className="font-body-sm text-on-surface-variant mt-xs">
                Barème {openAssignment.max_score ?? "—"} ·{" "}
                {openAssignment.class_group?.name ?? `Classe #${openAssignment.class_group_id}`}
              </p>
            </div>
            <button
              className="inline-flex items-center gap-xs h-9 px-md rounded-lg text-[13px] text-on-surface-variant hover:bg-surface-container-high transition-colors"
              onClick={() => {
                setOpenId(null);
                setSubmissions([]);
              }}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
              Fermer
            </button>
          </DataTableToolbar>

          <div className="p-lg">
            {subsLoading && (
              <DataTableSkeleton
                label="Chargement des rendus…"
                rows={4}
                testId="submissions-loading"
              />
            )}
            {!subsLoading && submissions.length === 0 && (
              <p
                className="font-body-sm text-on-surface-variant"
                data-testid="submissions-empty"
              >
                Aucune soumission pour ce devoir.
              </p>
            )}
            {!subsLoading && submissions.length > 0 && (
              <ul className="flex flex-col gap-sm" data-testid="submissions-list">
                {submissions.map((s) => (
                  <li
                    key={s.id}
                    className="rounded-xl border border-outline-variant/20 bg-surface-container-low/50 p-md flex flex-col gap-sm"
                  >
                    <div className="flex justify-between gap-md flex-wrap">
                      <div>
                        <div className="font-title-sm">
                          {s.student
                            ? studentFullName(s.student)
                            : `Élève #${s.student_id}`}
                        </div>
                        <div className="mt-xs">
                          <StatusBadge
                            label={SUBMISSION_STATUS_LABELS[String(s.status)] ?? String(s.status)}
                            tone={statusTone(String(s.status))}
                            withDot
                          />
                          {s.submitted_at ? (
                            <span className="ml-sm text-[12px] text-on-surface-variant font-mono-data">
                              {formatDueAt(s.submitted_at)}
                            </span>
                          ) : null}
                        </div>
                        {s.comment && (
                          <p className="font-body-sm text-on-surface-variant mt-xs">{s.comment}</p>
                        )}
                        {s.files && s.files.length > 0 && (
                          <div className="flex flex-wrap gap-xs mt-xs">
                            {s.files.map((f) => (
                              <a
                                key={f.id}
                                className="font-body-sm text-primary underline"
                                href={f.url}
                                rel="noreferrer"
                                target="_blank"
                              >
                                {f.file_name}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                      {s.status === "GRADED" && s.score != null && (
                        <div className="font-mono-data text-emerald-700 font-semibold">
                          {s.score}/{openAssignment.max_score ?? "—"}
                        </div>
                      )}
                    </div>

                    {canGrade && s.status !== "GRADED" && (
                      <div className="flex flex-wrap gap-sm items-end">
                        <label className="font-body-sm text-on-surface-variant">
                          Note
                          <input
                            className="ui-input mt-xs block w-28"
                            onChange={(e) =>
                              setGradeDrafts((prev) => ({
                                ...prev,
                                [s.id]: {
                                  score: e.target.value,
                                  feedback: prev[s.id]?.feedback ?? "",
                                },
                              }))
                            }
                            type="number"
                            value={gradeDrafts[s.id]?.score ?? ""}
                          />
                        </label>
                        <label className="font-body-sm text-on-surface-variant flex-1 w-full min-w-0 sm:min-w-[180px]">
                          Feedback
                          <input
                            className="ui-input mt-xs block w-full"
                            onChange={(e) =>
                              setGradeDrafts((prev) => ({
                                ...prev,
                                [s.id]: {
                                  score: prev[s.id]?.score ?? "",
                                  feedback: e.target.value,
                                },
                              }))
                            }
                            type="text"
                            value={gradeDrafts[s.id]?.feedback ?? ""}
                          />
                        </label>
                        <button
                          className="inline-flex items-center gap-sm h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-label-caps text-label-caps px-md rounded-lg transition-colors disabled:opacity-50"
                          disabled={busy}
                          onClick={() => void handleGrade(s, openAssignment.max_score)}
                          type="button"
                        >
                          Noter
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DataTableShell>
      )}
    </div>
  );
}
