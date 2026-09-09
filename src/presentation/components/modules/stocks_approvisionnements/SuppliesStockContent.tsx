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
  DataTableSearch,
  DATA_TABLE_CREATE_CLASS,
} from "@/presentation/components/shared/DataTable";

import { Checkbox } from "@/presentation/components/shared/Checkbox";
import { DatePicker } from "@/presentation/components/shared/DatePicker";
import { Select } from "@/presentation/components/shared/Select";
import { StatusBadge } from "@/presentation/components/shared/StatusBadge";
import {
  tableRowClass,
  useClientDataTable,
} from "@/presentation/components/shared/data-table-utils";
import {
  deleteInventorySupply,
  listInventorySupplies,
  restockInventorySupply,
} from "@/infrastructure/api/resources/inventory";
import { useAuth, getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import { can } from "@/shared/lib/permissions";
import {
  INVENTORY_MOVEMENT_TYPE_LABELS,
  isSupplyLowStock,
  type InventoryMovementType,
  type InventorySupply,
} from "@/shared/types/inventory.types";
import { useConfirm } from "@/presentation/components/providers/ConfirmDialogProvider";

export function SuppliesStockContent() {
  const confirmDialog = useConfirm();
  const { user } = useAuth();
  const [rows, setRows] = useState<InventorySupply[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [restockId, setRestockId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState("");
  const [movementDate, setMovementDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [movementType, setMovementType] = useState<InventoryMovementType>("restock");
  const [supplier, setSupplier] = useState("");
  const [notes, setNotes] = useState("");

  const canView = can(user, "inventory.view");
  const canCreate = can(user, "inventory.create");
  const canUpdate = can(user, "inventory.update");
  const canDelete = can(user, "inventory.delete");

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      setRows(await listInventorySupplies());
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
      if (lowOnly && !isSupplyLowStock(r)) return false;
      if (!q) return true;
      return `${r.designation} ${r.category} ${r.supplier ?? ""}`
        .toLowerCase()
        .includes(q);
    });
  }, [rows, search, lowOnly]);

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
  } = useClientDataTable(filtered, [search, lowOnly]);

  async function handleRestock() {
    if (!canCreate || restockId == null) return;
    const qty = Number(quantity);
    if (!qty || qty < 1) {
      setError("Quantité invalide (min. 1).");
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await restockInventorySupply(restockId, {
        quantity: qty,
        movement_date: movementDate,
        type: movementType,
        supplier: supplier === "" ? null : supplier,
        notes: notes === "" ? null : notes,
      });
      await reload();
      setNotice("Mouvement de stock enregistré.");
      setRestockId(null);
      setQuantity("");
      setSupplier("");
      setNotes("");
      setMovementType("restock");
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(row: InventorySupply) {
    if (!canDelete) return;
    if (!await confirmDialog(`Supprimer « ${row.designation} » ?`)) return;
    setBusy(true);
    try {
      await deleteInventorySupply(row.id);
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
      data-testid="supplies-panel"
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

      {restockId != null && (
        <div className="ui-card p-lg flex flex-col gap-md max-w-xl" data-testid="restock-form">
          <h2 className="font-title-sm">Mouvement — article #{restockId}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            <div className="flex flex-col gap-xs">
              <label className="ui-stat-label" htmlFor="mv-type">
                Type
              </label>
              <Select
                className="ui-input w-full bg-white border border-outline-variant/25 cursor-pointer"
                id="mv-type"
                onChange={(v) => setMovementType(v as InventoryMovementType)}
                options={Object.entries(INVENTORY_MOVEMENT_TYPE_LABELS).map(([k, v]) => ({
                  value: k,
                  label: v,
                }))}
                searchable
                value={movementType}
              />
            </div>
            <div className="flex flex-col gap-xs">
              <label className="ui-stat-label" htmlFor="mv-qty">
                Quantité
              </label>
              <input
                className="bg-surface-container-low p-md rounded-lg"
                id="mv-qty"
                min={1}
                onChange={(e) => setQuantity(e.target.value)}
                type="number"
                value={quantity}
              />
            </div>
            <div className="flex flex-col gap-xs">
              <label className="ui-stat-label" htmlFor="mv-date">
                Date
              </label>
              <DatePicker
                id="mv-date"
                onChange={setMovementDate}
                value={movementDate}
              />
            </div>
            <div className="flex flex-col gap-xs">
              <label className="ui-stat-label" htmlFor="mv-supplier">
                Fournisseur
              </label>
              <input
                className="bg-surface-container-low p-md rounded-lg"
                id="mv-supplier"
                onChange={(e) => setSupplier(e.target.value)}
                value={supplier}
              />
            </div>
            <div className="flex flex-col gap-xs md:col-span-2">
              <label className="ui-stat-label" htmlFor="mv-notes">
                Notes
              </label>
              <input
                className="bg-surface-container-low p-md rounded-lg"
                id="mv-notes"
                onChange={(e) => setNotes(e.target.value)}
                value={notes}
              />
            </div>
          </div>
          <div className="flex gap-sm">
            <button
              className="bg-primary text-on-primary px-lg py-sm rounded-lg font-title-sm disabled:opacity-40"
              disabled={busy}
              onClick={() => void handleRestock()}
              type="button"
            >
              Valider
            </button>
            <button
              className="bg-surface-container-high px-lg py-sm rounded-lg font-title-sm"
              onClick={() => setRestockId(null)}
              type="button"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      <DataTableShell testId="supplies-table">
        <DataTableToolbar>
          <DataTableSearch
            ariaLabel={"Rechercher"}
            onChange={setSearch}
            placeholder={"Désignation, catégorie…"}
            value={search}
          />
          <label className="flex items-center gap-sm font-body-sm h-10">
            <Checkbox checked={lowOnly} onChange={setLowOnly} />
            Stock bas seulement
          </label>
          <div className="flex flex-wrap items-center justify-end gap-sm w-full sm:w-auto sm:ml-auto">
            <DataTableRefreshButton loading={loading} onRefresh={() => void reload()} />
            {canCreate && (
              <CrudCreateLink
                className={DATA_TABLE_CREATE_CLASS}
                label="AJOUTER UN ARTICLE"
                resource="supplies"
              />
            )}
          </div>
        </DataTableToolbar>

        <div className="overflow-x-auto min-h-[320px]">
          {loading ? (
            <ContentSkeleton testId="supplies-loading" variant="table" />
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low/80 sticky top-0 z-10">
                <tr className="ui-table-head-row">
                  <DataTableSelectHeader
                    checked={allPageSelected}
                    indeterminate={somePageSelected && !allPageSelected}
                    onChange={toggleAllPage}
                  />
                  <th className="py-sm px-md">Article</th>
                  <th className="py-sm px-md">Catégorie</th>
                  <th className="py-sm px-md text-right">Qté</th>
                  <th className="py-sm px-md text-right">Seuil</th>
                  <th className="py-sm px-md">Alerte</th>
                  <th className="py-sm px-md text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-body-sm">
                {filtered.length === 0 ? (
                  <tr>
                    <td className="py-xl px-lg text-on-surface-variant" colSpan={7}>
                      Aucun article.
                    </td>
                  </tr>
                ) : (
                  pageRows.map((row, index) => {
                    const low = isSupplyLowStock(row);
                    return (
                      <tr className={tableRowClass(index)} key={row.id}>
                        <DataTableSelectCell
                          checked={selectedIds.has(row.id)}
                          label={row.designation}
                          onChange={() => toggleOne(row.id)}
                        />
                        <td className="py-sm px-md">
                          <div className="font-semibold">{row.designation}</div>
                          <div className="text-[12px] text-on-surface-variant">
                            {row.unit ?? "—"}
                            {row.supplier ? ` · ${row.supplier}` : ""}
                          </div>
                        </td>
                        <td className="py-sm px-md">{row.category}</td>
                        <td className="py-sm px-md text-right font-mono-data">{row.quantity}</td>
                        <td className="py-sm px-md text-right font-mono-data">
                          {row.alert_threshold ?? "—"}
                        </td>
                        <td className="py-sm px-md">
                          {low ? (
                            <StatusBadge label="Stock bas" tone="error" />
                          ) : (
                            <StatusBadge
                              label={row.is_active ? "OK" : "Inactif"}
                              tone={row.is_active ? "success" : "neutral"}
                            />
                          )}
                        </td>
                        <td className="py-sm px-md">
                          <div className="flex justify-end gap-xs flex-wrap">
                            {canCreate && (
                              <button
                                className="px-sm py-xs rounded-lg bg-primary text-on-primary text-[11px] font-label-caps disabled:opacity-40"
                                disabled={busy}
                                onClick={() => {
                                  setRestockId(row.id);
                                  setError(null);
                                  setNotice(null);
                                }}
                                type="button"
                              >
                                Mouvement
                              </button>
                            )}
<DataTableActionsMenu
                              ariaLabel={`Actions pour ${row.designation}`}
                              items={crudRowActions({
                                edit: { resource: "supplies", recordId: row.id },
                                delete: {
                                  onClick: () => void handleDelete(row),
                                  disabled: busy,
                                },
                                canUpdate,
                                canDelete,
                              })}
                            />
                          </div>
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
            entityLabel="articles"
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
            testId="supplies-pagination"
            to={to}
            total={filtered.length}
          />
        )}
      </DataTableShell>
    </div>
  );
}
