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
import {
  DataTableSkeleton,
  SUBJECTS_TABLE_SKELETON_COLUMNS,
} from "@/presentation/components/shared/DataTableSkeleton";
import { DataTablePagination } from "@/presentation/components/shared/DataTablePagination";
import {
  DataTableShell,
  DataTableToolbar,
  DataTableSearch,
  DataTableFilterSelect,
  DATA_TABLE_CREATE_CLASS,
} from "@/presentation/components/shared/DataTable";

import {
  deleteSubject,
  listLevels,
  listSubjects,
} from "@/infrastructure/api/resources/academic";
import { useAuth, getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import { can } from "@/shared/lib/permissions";
import { filterBySearch, type NamedRef, type Subject } from "@/shared/types/academic.types";
import { useConfirm } from "@/presentation/components/providers/ConfirmDialogProvider";

const DEFAULT_PAGE_SIZE = 10;

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

export function SubjectsManagementContent() {
  const confirmDialog = useConfirm();
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [levels, setLevels] = useState<NamedRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [levelId, setLevelId] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const canCreate = can(user, "subjects.create");
  const canUpdate = can(user, "subjects.update");
  const canDelete = can(user, "subjects.delete");

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const [list, levelList] = await Promise.all([listSubjects(), listLevels()]);
      setSubjects(list);
      setLevels(levelList);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  const filtered = useMemo(() => {
    let rows = filterBySearch(subjects, search, (s) => `${s.name} ${s.code}`);
    if (levelId) rows = rows.filter((s) => String(s.level_id ?? "") === levelId);
    return rows;
  }, [subjects, search, levelId]);

  const hasFilters = Boolean(search || levelId);

  function clearFilters() {
    setSearch("");
    setLevelId("");
  }

  async function handleDelete(row: Subject) {
    if (!canDelete) return;
    if (!(await confirmDialog(`Supprimer la matière « ${row.name} » ?`, { destructive: true })))
      return;
    setDeletingId(row.id);
    try {
      await deleteSubject(row.id);
      setSubjects((prev) => prev.filter((s) => s.id !== row.id));
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  const columnHelper = useMemo(() => createColumnHelper<Subject>(), []);

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
            ariaLabel={`Sélectionner ${row.original.name}`}
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onChange={(checked) => row.toggleSelected(checked)}
          />
        ),
      }),
      columnHelper.accessor("code", {
        header: "Code",
        cell: (info) => (
          <span className="font-mono-data text-[12px] text-on-surface-variant tracking-wide">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("name", {
        header: "Nom",
        cell: (info) => (
          <span className="font-semibold text-on-surface">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor((row) => row.level?.name ?? "", {
        id: "level",
        header: "Niveau",
        cell: ({ row }) => (
          <span className="text-on-surface-variant">{row.original.level?.name || "Tous niveaux"}</span>
        ),
      }),
      columnHelper.accessor("coefficient", {
        header: "Coefficient",
        cell: (info) => {
          const value = info.getValue();
          return (
            <span className="font-mono-data text-[13px] text-on-surface tabular-nums">
              {value ?? "—"}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        enableSorting: false,
        header: "Actions",
        cell: ({ row }) => {
          const s = row.original;
          return (
            <DataTableActionsMenu
              ariaLabel={`Actions pour ${s.name}`}
              items={crudRowActions({
                edit: { resource: "subjects", recordId: s.id },
                delete: {
                  onClick: () => void handleDelete(s),
                  disabled: deletingId === s.id,
                },
                canUpdate,
                canDelete,
              })}
            />
          );
        },
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [columnHelper, canUpdate, canDelete, deletingId]
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
  }, [search, levelId]);

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

      <DataTableShell>
        <DataTableToolbar>
          <DataTableSearch
            ariaLabel={"Rechercher une matière"}
            onChange={setSearch}
            placeholder={"Rechercher par nom ou code…"}
            value={search}
          />
          <DataTableFilterSelect
            ariaLabel="Filtrer par niveau"
            onChange={setLevelId}
            options={levels.map((l) => ({ value: String(l.id), label: l.name }))}
            placeholder="Tous les niveaux"
            value={levelId}
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
                className={`material-symbols-outlined text-[20px] ${loading ? "animate-spin" : ""}`}
              >
                refresh
              </span>
            </button>
            {canCreate && (
              <CrudCreateLink
                className={DATA_TABLE_CREATE_CLASS}
                label="Nouvelle matière"
                resource="subjects"
              />
            )}
          </div>
        </DataTableToolbar>

        <div className="overflow-auto">
          {loading ? (
            <DataTableSkeleton
              columns={SUBJECTS_TABLE_SKELETON_COLUMNS}
              label="Chargement des matières…"
              labels={["", "Code", "Nom", "Niveau", "Coefficient", ""]}
              rows={8}
              testId="subjects-loading"
            />
          ) : rowCount === 0 ? (
            <div
              className="flex flex-col items-center justify-center px-lg py-2xl text-center"
              data-testid="subjects-empty"
            >
              <span className="material-symbols-outlined text-[40px] text-on-surface-variant/50 mb-md">
                menu_book
              </span>
              <h3 className="font-title-md text-on-surface mb-xs">Aucune matière trouvée</h3>
              <p className="font-body-sm text-on-surface-variant max-w-sm mb-lg">
                Aucun résultat pour ces filtres, ou aucune matière n&apos;a encore été ajoutée.
              </p>
              <div className="flex flex-wrap gap-sm justify-center">
                {hasFilters && (
                  <button className="ui-btn-secondary" onClick={clearFilters} type="button">
                    Effacer les filtres
                  </button>
                )}
                {canCreate && <CrudCreateLink label="Nouvelle matière" resource="subjects" />}
              </div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse" data-testid="subjects-table">
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
                              ? "text-right sticky right-0 bg-surface-container-low/95 w-16"
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
                  return (
                    <tr
                      className={`group transition-colors hover:bg-surface-container-low/70 ${
                        zebra ? "bg-surface-container-low/45" : "bg-surface-container-lowest"
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
                                    zebra
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
            entityLabel="matières"
            filteredHint={
              filtered.length !== subjects.length ? `filtre sur ${subjects.length}` : undefined
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
            testId="subjects-pagination"
            to={to}
            total={rowCount}
          />
        )}
      </DataTableShell>
    </div>
  );
}
