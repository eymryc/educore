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
import { ContentTabs } from "@/presentation/components/shared/ContentTabs";
import {
  tableRowClass,
  useClientDataTable,
} from "@/presentation/components/shared/data-table-utils";
import {
  deleteFeeCategory,
  deleteFeeItem,
  deleteFeeStructure,
  listFeeCategories,
  listFeeItems,
  listFeeStructures,
} from "@/infrastructure/api/resources/finance";
import { useAuth, getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import { can } from "@/shared/lib/permissions";
import {
  formatMoneyFcfa,
  type FeeCategory,
  type FeeItem,
  type FeeStructure,
} from "@/shared/types/finance.types";
import { useConfirm } from "@/presentation/components/providers/ConfirmDialogProvider";

type Tab = "categories" | "structures" | "items";


export function FeesCatalogContent() {
  const confirmDialog = useConfirm();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("categories");
  const [categories, setCategories] = useState<FeeCategory[]>([]);
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [items, setItems] = useState<FeeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const canCreate = can(user, "finance.create");
  const canUpdate = can(user, "finance.update");
  const canDelete = can(user, "finance.delete");

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const [c, s, i] = await Promise.all([
        listFeeCategories(),
        listFeeStructures(),
        listFeeItems(),
      ]);
      setCategories(c);
      setStructures(s);
      setItems(i);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((row) =>
      `${row.name} ${row.code ?? ""}`.toLowerCase().includes(q)
    );
  }, [categories, search]);

  const filteredStructures = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return structures;
    return structures.filter((row) => row.name.toLowerCase().includes(q));
  }, [structures, search]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((row) => row.label.toLowerCase().includes(q));
  }, [items, search]);

  const categoriesTable = useClientDataTable(filteredCategories, [search, tab]);
  const structuresTable = useClientDataTable(filteredStructures, [search, tab]);
  const itemsTable = useClientDataTable(filteredItems, [search, tab]);

  const createResource =
    tab === "categories" ? "fee-categories" : tab === "structures" ? "fee-structures" : "fee-items";
  const createLabel =
    tab === "categories"
      ? "NOUVELLE CATÉGORIE"
      : tab === "structures"
        ? "NOUVELLE STRUCTURE"
        : "NOUVELLE LIGNE";

  function renderToolbar() {
    return (
      <div className="px-lg pt-lg pb-md flex flex-wrap items-center gap-sm border-b border-outline-variant/15">
        <div className="ui-search-field flex-1 min-w-[200px] h-10 py-0">
          <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
            search
          </span>
          <input
            aria-label="Rechercher"
            className="ui-search-input ml-sm h-full"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher…"
            type="text"
            value={search}
          />
        </div>
        <div className="ml-auto shrink-0 flex items-center gap-sm">
          <DataTableRefreshButton loading={loading} onRefresh={() => void reload()} />
          {canCreate && (
            <CrudCreateLink
              className="inline-flex items-center gap-sm h-10 bg-primary hover:bg-primary/90 text-on-primary font-label-caps text-label-caps px-md rounded-lg transition-colors shadow-sm"
              label={createLabel}
              resource={createResource}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full gap-lg pb-xl max-w-7xl mx-auto">
      {error && (
        <div
          className="rounded-lg bg-error-container text-on-error-container px-md py-sm"
          data-testid="fees-catalog-error"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="ui-table-shell flex flex-col">
        <ContentTabs
          items={[
            { id: "categories", label: "Catégories", count: categories.length },
            { id: "structures", label: "Structures", count: structures.length },
            { id: "items", label: "Lignes", count: items.length },
          ]}
          onChange={(id) => {
            setTab(id);
            setSearch("");
          }}
          testId="fees-catalog-tabs"
          value={tab}
        />
        {renderToolbar()}

        {tab === "categories" && (
          <>
            <div className="overflow-x-auto min-h-[320px]" data-testid="fee-categories-table">
              {loading ? (
                <ContentSkeleton testId="fees-catalog-loading" variant="table" />
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-surface-container-low/80 sticky top-0 z-10">
                    <tr className="ui-table-head-row">
                      <DataTableSelectHeader
                        checked={categoriesTable.allPageSelected}
                        indeterminate={
                          categoriesTable.somePageSelected && !categoriesTable.allPageSelected
                        }
                        onChange={categoriesTable.toggleAllPage}
                      />
                      <th className="py-sm px-md">Nom</th>
                      <th className="py-sm px-md">Code</th>
                      <th className="py-sm px-md">Actif</th>
                      <th className="py-sm px-md text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="font-body-sm text-body-sm">
                    {filteredCategories.length === 0 ? (
                      <tr>
                        <td className="py-lg px-lg text-on-surface-variant" colSpan={5}>
                          Aucune catégorie.
                        </td>
                      </tr>
                    ) : (
                      categoriesTable.pageRows.map((c, index) => (
                        <tr className={tableRowClass(index)} key={c.id}>
                          <DataTableSelectCell
                            checked={categoriesTable.selectedIds.has(c.id)}
                            label={c.name}
                            onChange={() => categoriesTable.toggleOne(c.id)}
                          />
                          <td className="py-sm px-md">{c.name}</td>
                          <td className="py-sm px-md">{c.code ?? "—"}</td>
                          <td className="py-sm px-md">{c.is_active ? "Oui" : "Non"}</td>
                          <td className="py-sm px-md text-right">
                            <DataTableActionsMenu
                              ariaLabel={`Actions pour ${c.name}`}
                              items={crudRowActions({
                                edit: { resource: "fee-categories", recordId: c.id },
                                delete: {
                                  onClick: () =>
                                    void (async () => {
                                      if (!await confirmDialog(`Supprimer « ${c.name} » ?`)) return;
                                      setBusy(true);
                                      void deleteFeeCategory(c.id)
                                        .then(() => reload())
                                        .catch((err) => setError(getAuthErrorMessage(err)))
                                        .finally(() => setBusy(false));
                                    })(),
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
            {!loading && filteredCategories.length > 0 && (
              <DataTablePagination
                canNextPage={categoriesTable.canNextPage}
                canPreviousPage={categoriesTable.canPreviousPage}
                entityLabel="catégories"
                from={categoriesTable.from}
                onFirstPage={() => categoriesTable.setPageIndex(0)}
                onLastPage={() => categoriesTable.setPageIndex(categoriesTable.pageCount - 1)}
                onNextPage={() => categoriesTable.setPageIndex(categoriesTable.pageIndex + 1)}
                onPageChange={categoriesTable.setPageIndex}
                onPageSizeChange={categoriesTable.setPageSize}
                onPreviousPage={() => categoriesTable.setPageIndex(categoriesTable.pageIndex - 1)}
                pageCount={categoriesTable.pageCount}
                pageIndex={categoriesTable.pageIndex}
                pageSize={categoriesTable.pageSize}
                testId="fee-categories-pagination"
                to={categoriesTable.to}
                total={filteredCategories.length}
              />
            )}
          </>
        )}

        {tab === "structures" && (
          <>
            <div className="overflow-x-auto min-h-[320px]" data-testid="fee-structures-table">
              {loading ? (
                <ContentSkeleton testId="fees-catalog-loading" variant="table" />
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-surface-container-low/80 sticky top-0 z-10">
                    <tr className="ui-table-head-row">
                      <DataTableSelectHeader
                        checked={structuresTable.allPageSelected}
                        indeterminate={
                          structuresTable.somePageSelected && !structuresTable.allPageSelected
                        }
                        onChange={structuresTable.toggleAllPage}
                      />
                      <th className="py-sm px-md">Nom</th>
                      <th className="py-sm px-md">Année</th>
                      <th className="py-sm px-md">Niveau</th>
                      <th className="py-sm px-md">Actif</th>
                      <th className="py-sm px-md text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="font-body-sm text-body-sm">
                    {filteredStructures.length === 0 ? (
                      <tr>
                        <td className="py-lg px-lg text-on-surface-variant" colSpan={6}>
                          Aucune structure.
                        </td>
                      </tr>
                    ) : (
                      structuresTable.pageRows.map((s, index) => (
                        <tr className={tableRowClass(index)} key={s.id}>
                          <DataTableSelectCell
                            checked={structuresTable.selectedIds.has(s.id)}
                            label={s.name}
                            onChange={() => structuresTable.toggleOne(s.id)}
                          />
                          <td className="py-sm px-md">{s.name}</td>
                          <td className="py-sm px-md">
                            {s.academic_year && "name" in s.academic_year
                              ? s.academic_year.name
                              : `#${s.academic_year_id}`}
                          </td>
                          <td className="py-sm px-md">
                            {s.level && "name" in s.level ? s.level.name : s.level_id ?? "—"}
                          </td>
                          <td className="py-sm px-md">{s.is_active ? "Oui" : "Non"}</td>
                          <td className="py-sm px-md text-right">
                            <DataTableActionsMenu
                              ariaLabel={`Actions pour ${s.name}`}
                              items={crudRowActions({
                                edit: { resource: "fee-structures", recordId: s.id },
                                delete: {
                                  onClick: () =>
                                    void (async () => {
                                      if (!await confirmDialog(`Supprimer « ${s.name} » ?`)) return;
                                      setBusy(true);
                                      void deleteFeeStructure(s.id)
                                        .then(() => reload())
                                        .catch((err) => setError(getAuthErrorMessage(err)))
                                        .finally(() => setBusy(false));
                                    })(),
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
            {!loading && filteredStructures.length > 0 && (
              <DataTablePagination
                canNextPage={structuresTable.canNextPage}
                canPreviousPage={structuresTable.canPreviousPage}
                entityLabel="structures"
                from={structuresTable.from}
                onFirstPage={() => structuresTable.setPageIndex(0)}
                onLastPage={() => structuresTable.setPageIndex(structuresTable.pageCount - 1)}
                onNextPage={() => structuresTable.setPageIndex(structuresTable.pageIndex + 1)}
                onPageChange={structuresTable.setPageIndex}
                onPageSizeChange={structuresTable.setPageSize}
                onPreviousPage={() => structuresTable.setPageIndex(structuresTable.pageIndex - 1)}
                pageCount={structuresTable.pageCount}
                pageIndex={structuresTable.pageIndex}
                pageSize={structuresTable.pageSize}
                testId="fee-structures-pagination"
                to={structuresTable.to}
                total={filteredStructures.length}
              />
            )}
          </>
        )}

        {tab === "items" && (
          <>
            <div className="overflow-x-auto min-h-[320px]" data-testid="fee-items-table">
              {loading ? (
                <ContentSkeleton testId="fees-catalog-loading" variant="table" />
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-surface-container-low/80 sticky top-0 z-10">
                    <tr className="ui-table-head-row">
                      <DataTableSelectHeader
                        checked={itemsTable.allPageSelected}
                        indeterminate={itemsTable.somePageSelected && !itemsTable.allPageSelected}
                        onChange={itemsTable.toggleAllPage}
                      />
                      <th className="py-sm px-md">Libellé</th>
                      <th className="py-sm px-md">Montant</th>
                      <th className="py-sm px-md">Obligatoire</th>
                      <th className="py-sm px-md text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="font-body-sm text-body-sm">
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td className="py-lg px-lg text-on-surface-variant" colSpan={5}>
                          Aucune ligne tarifaire.
                        </td>
                      </tr>
                    ) : (
                      itemsTable.pageRows.map((i, index) => (
                        <tr className={tableRowClass(index)} key={i.id}>
                          <DataTableSelectCell
                            checked={itemsTable.selectedIds.has(i.id)}
                            label={i.label}
                            onChange={() => itemsTable.toggleOne(i.id)}
                          />
                          <td className="py-sm px-md">{i.label}</td>
                          <td className="py-sm px-md font-semibold">{formatMoneyFcfa(i.amount)}</td>
                          <td className="py-sm px-md">{i.is_mandatory ? "Oui" : "Non"}</td>
                          <td className="py-sm px-md text-right">
                            <DataTableActionsMenu
                              ariaLabel={`Actions pour ${i.label}`}
                              items={crudRowActions({
                                edit: { resource: "fee-items", recordId: i.id },
                                delete: {
                                  onClick: () =>
                                    void (async () => {
                                      if (!await confirmDialog(`Supprimer « ${i.label} » ?`)) return;
                                      setBusy(true);
                                      void deleteFeeItem(i.id)
                                        .then(() => reload())
                                        .catch((err) => setError(getAuthErrorMessage(err)))
                                        .finally(() => setBusy(false));
                                    })(),
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
            {!loading && filteredItems.length > 0 && (
              <DataTablePagination
                canNextPage={itemsTable.canNextPage}
                canPreviousPage={itemsTable.canPreviousPage}
                entityLabel="lignes tarifaires"
                from={itemsTable.from}
                onFirstPage={() => itemsTable.setPageIndex(0)}
                onLastPage={() => itemsTable.setPageIndex(itemsTable.pageCount - 1)}
                onNextPage={() => itemsTable.setPageIndex(itemsTable.pageIndex + 1)}
                onPageChange={itemsTable.setPageIndex}
                onPageSizeChange={itemsTable.setPageSize}
                onPreviousPage={() => itemsTable.setPageIndex(itemsTable.pageIndex - 1)}
                pageCount={itemsTable.pageCount}
                pageIndex={itemsTable.pageIndex}
                pageSize={itemsTable.pageSize}
                testId="fee-items-pagination"
                to={itemsTable.to}
                total={filteredItems.length}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
