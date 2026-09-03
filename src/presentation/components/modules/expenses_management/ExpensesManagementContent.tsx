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
  tableRowClass,
  useClientDataTable,
} from "@/presentation/components/shared/data-table-utils";
import {
  deleteExpense,
  listExpenses,
} from "@/infrastructure/api/resources/finance";
import { useAuth, getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import { can } from "@/shared/lib/permissions";
import {
  filterExpenses,
  formatMoneyFcfa,
  type Expense,
} from "@/shared/types/finance.types";
import { useConfirm } from "@/presentation/components/providers/ConfirmDialogProvider";

export function ExpensesManagementContent() {
  const confirmDialog = useConfirm();
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  const canCreate = can(user, "finance.create");
  const canUpdate = can(user, "finance.update");
  const canDelete = can(user, "finance.delete");

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      setExpenses(await listExpenses());
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const e of expenses) if (e.category) set.add(e.category);
    return Array.from(set).sort();
  }, [expenses]);

  const filtered = useMemo(
    () => filterExpenses(expenses, { search, category }),
    [expenses, search, category]
  );

  const total = useMemo(
    () => filtered.reduce((sum, e) => sum + Number(e.amount || 0), 0),
    [filtered]
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
  } = useClientDataTable(filtered, [search, category]);

  async function handleDelete(row: Expense) {
    if (!canDelete) return;
    if (!await confirmDialog(`Supprimer la dépense « ${row.description} » ?`)) return;
    setBusy(true);
    setError(null);
    try {
      await deleteExpense(row.id);
      setExpenses((prev) => prev.filter((e) => e.id !== row.id));
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col w-full gap-lg pb-xl max-w-7xl mx-auto">

      {error && (
        <div
          className="rounded-lg bg-error-container text-on-error-container px-md py-sm"
          data-testid="expenses-error"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="ui-table-shell" data-testid="expenses-table">
        <div className="px-lg pt-lg pb-md flex flex-wrap items-center gap-sm border-b border-outline-variant/15">
          <div className="ui-search-field flex-1 min-w-[200px] h-10 py-0">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
              search
            </span>
            <input
              aria-label="Rechercher"
              className="ui-search-input ml-sm h-full"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher description, référence…"
              type="text"
              value={search}
            />
          </div>
          <select
            aria-label="Filtrer par catégorie"
            className="ui-input cursor-pointer h-10 py-0"
            onChange={(e) => setCategory(e.target.value)}
            value={category}
          >
            <option value="">Toutes les catégories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <div className="ml-auto shrink-0 flex items-center gap-sm">
            <DataTableRefreshButton loading={loading} onRefresh={() => void reload()} />
            {canCreate && (
              <CrudCreateLink
                className="inline-flex items-center gap-sm h-10 bg-primary hover:bg-primary/90 text-on-primary font-label-caps text-label-caps px-md rounded-lg transition-colors shadow-sm"
                label="NOUVELLE DÉPENSE"
                resource="expenses"
              />
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <ContentSkeleton testId="expenses-loading" variant="table" />
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low/80 sticky top-0 z-10">
                <tr className="ui-table-head-row">
                  <DataTableSelectHeader
                    checked={allPageSelected}
                    indeterminate={somePageSelected && !allPageSelected}
                    onChange={toggleAllPage}
                  />
                  <th className="py-md px-lg">Date</th>
                  <th className="py-md px-md">Catégorie</th>
                  <th className="py-md px-md">Description</th>
                  <th className="py-md px-md">Référence</th>
                  <th className="py-md px-md text-right">Montant</th>
                  <th className="py-md px-lg text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td className="py-lg px-lg text-on-surface-variant" colSpan={7}>
                      Aucune dépense.
                    </td>
                  </tr>
                ) : (
                  pageRows.map((e, index) => (
                    <tr className={tableRowClass(index)} key={e.id}>
                      <DataTableSelectCell
                        checked={selectedIds.has(e.id)}
                        label={e.description}
                        onChange={() => toggleOne(e.id)}
                      />
                      <td className="py-md px-lg font-mono-data">{e.expense_date}</td>
                      <td className="py-md px-md">{e.category}</td>
                      <td className="py-md px-md">{e.description}</td>
                      <td className="py-md px-md text-on-surface-variant">
                        {e.reference ?? "—"}
                      </td>
                      <td className="py-md px-md text-right font-semibold">
                        {formatMoneyFcfa(e.amount)}
                      </td>
                      <td className="py-md px-lg">
                        <DataTableActionsMenu
                          ariaLabel={`Actions pour ${e.description}`}
                          items={crudRowActions({
                            edit: { resource: "expenses", recordId: e.id },
                            delete: {
                              onClick: () => void handleDelete(e),
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
            entityLabel="dépenses"
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
      </div>
    </div>
  );
}
