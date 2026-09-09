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
  DataTableFilterSelect,
  DATA_TABLE_CREATE_CLASS,
} from "@/presentation/components/shared/DataTable";

import { DatePicker } from "@/presentation/components/shared/DatePicker";
import { Select } from "@/presentation/components/shared/Select";
import { StatusBadge } from "@/presentation/components/shared/StatusBadge";
import {
  tableRowClass,
  useClientDataTable,
} from "@/presentation/components/shared/data-table-utils";
import {
  deleteCanteenAccount,
  listCanteenAccounts,
  topUpCanteenAccount,
} from "@/infrastructure/api/resources/canteen";
import { useAuth, getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import { can } from "@/shared/lib/permissions";
import { formatMoneyFcfa } from "@/shared/types/finance.types";
import {
  CANTEEN_ACCOUNT_STATUS_LABELS,
  canteenAccountLabel,
  type CanteenAccount,
  type CanteenPaymentMethod,
} from "@/shared/types/canteen.types";
import { useConfirm } from "@/presentation/components/providers/ConfirmDialogProvider";

export function CanteenAccountsContent() {
  const confirmDialog = useConfirm();
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<CanteenAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [topupId, setTopupId] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [paidAt, setPaidAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<CanteenPaymentMethod>("especes");
  const [notes, setNotes] = useState("");

  const canView = can(user, "canteen.view");
  const canCreate = can(user, "canteen.create");
  const canUpdate = can(user, "canteen.update");
  const canDelete = can(user, "canteen.delete");

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      setAccounts(await listCanteenAccounts());
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
    return accounts.filter((a) => {
      if (status && a.status !== status) return false;
      if (!q) return true;
      return canteenAccountLabel(a).toLowerCase().includes(q);
    });
  }, [accounts, search, status]);

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

  async function handleTopup() {
    if (!canCreate || topupId == null) return;
    const value = Number(amount);
    if (!value || value < 1) {
      setError("Montant invalide (min. 1).");
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await topUpCanteenAccount(topupId, {
        amount: value,
        paid_at: paidAt,
        payment_method: paymentMethod,
        notes: notes === "" ? null : notes,
      });
      const refreshed = await listCanteenAccounts();
      setAccounts(refreshed);
      setNotice("Rechargement enregistré.");
      setTopupId(null);
      setAmount("");
      setNotes("");
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(row: CanteenAccount) {
    if (!canDelete) return;
    if (!await confirmDialog(`Supprimer le compte de ${canteenAccountLabel(row)} ?`)) return;
    setBusy(true);
    try {
      await deleteCanteenAccount(row.id);
      setAccounts((prev) => prev.filter((a) => a.id !== row.id));
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
      data-testid="canteen-accounts-panel"
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

      {topupId != null && (
        <div
          className="ui-card p-lg flex flex-col gap-md max-w-xl"
          data-testid="canteen-topup-form"
        >
          <h2 className="font-title-sm">Recharger le compte #{topupId}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            <div className="flex flex-col gap-xs">
              <label className="ui-stat-label" htmlFor="topup-amount">
                Montant (FCFA)
              </label>
              <input
                className="bg-surface-container-low p-md rounded-lg"
                id="topup-amount"
                min={1}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                value={amount}
              />
            </div>
            <div className="flex flex-col gap-xs">
              <label className="ui-stat-label" htmlFor="topup-date">
                Date
              </label>
              <DatePicker
                id="topup-date"
                onChange={setPaidAt}
                value={paidAt}
              />
            </div>
            <div className="flex flex-col gap-xs">
              <label className="ui-stat-label" htmlFor="topup-method">
                Mode
              </label>
              <Select
                className="ui-input w-full bg-white border border-outline-variant/25 cursor-pointer"
                id="topup-method"
                onChange={(v) => setPaymentMethod(v as CanteenPaymentMethod)}
                options={[
                  { value: "especes", label: "Espèces" },
                  { value: "mobile", label: "Mobile Money" },
                ]}
                searchable
                value={paymentMethod}
              />
            </div>
            <div className="flex flex-col gap-xs md:col-span-2">
              <label className="ui-stat-label" htmlFor="topup-notes">
                Notes
              </label>
              <input
                className="bg-surface-container-low p-md rounded-lg"
                id="topup-notes"
                onChange={(e) => setNotes(e.target.value)}
                value={notes}
              />
            </div>
          </div>
          <div className="flex gap-sm">
            <button
              className="bg-primary text-on-primary px-lg py-sm rounded-lg font-title-sm disabled:opacity-40"
              disabled={busy}
              onClick={() => void handleTopup()}
              type="button"
            >
              Valider le rechargement
            </button>
            <button
              className="bg-surface-container-high px-lg py-sm rounded-lg font-title-sm"
              onClick={() => setTopupId(null)}
              type="button"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      <DataTableShell testId="canteen-accounts-table">
        <DataTableToolbar>
          <DataTableSearch
            ariaLabel={"Rechercher"}
            onChange={setSearch}
            placeholder={"Nom élève…"}
            value={search}
          />
          <DataTableFilterSelect
            ariaLabel="Statut"
            onChange={setStatus}
            options={Object.entries(CANTEEN_ACCOUNT_STATUS_LABELS).map(([k, v]) => ({
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
                label="NOUVEAU COMPTE"
                resource="canteen-accounts"
              />
            )}
          </div>
        </DataTableToolbar>

        <div className="overflow-x-auto min-h-[320px]">
          {loading ? (
            <ContentSkeleton testId="canteen-accounts-loading" variant="table" />
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low/80 sticky top-0 z-10">
                <tr className="ui-table-head-row">
                  <DataTableSelectHeader
                    checked={allPageSelected}
                    indeterminate={somePageSelected && !allPageSelected}
                    onChange={toggleAllPage}
                  />
                  <th className="py-sm px-md">Élève</th>
                  <th className="py-sm px-md text-right">Solde</th>
                  <th className="py-sm px-md">Statut</th>
                  <th className="py-sm px-md text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-body-sm">
                {filtered.length === 0 ? (
                  <tr>
                    <td className="py-xl px-lg text-on-surface-variant" colSpan={5}>
                      Aucun compte.
                    </td>
                  </tr>
                ) : (
                  pageRows.map((row, index) => (
                    <tr className={tableRowClass(index)} key={row.id}>
                      <DataTableSelectCell
                        checked={selectedIds.has(row.id)}
                        label={canteenAccountLabel(row)}
                        onChange={() => toggleOne(row.id)}
                      />
                      <td className="py-sm px-md font-semibold">{canteenAccountLabel(row)}</td>
                      <td className="py-sm px-md text-right font-mono-data">
                        {formatMoneyFcfa(row.balance)}
                      </td>
                      <td className="py-sm px-md">
                        <StatusBadge
                          label={CANTEEN_ACCOUNT_STATUS_LABELS[row.status]}
                          tone={row.status === "ACTIVE" ? "success" : "error"}
                        />
                      </td>
                      <td className="py-sm px-md text-right">
                        <DataTableActionsMenu
                          ariaLabel={`Actions pour ${canteenAccountLabel(row)}`}
                          items={[
                            ...(canCreate && row.status === "ACTIVE"
                              ? [
                                  {
                                    kind: "button" as const,
                                    label: "Recharger",
                                    icon: "add_card",
                                    onClick: () => {
                                      setTopupId(row.id);
                                      setError(null);
                                      setNotice(null);
                                    },
                                    disabled: busy,
                                  },
                                ]
                              : []),
                            ...crudRowActions({
                              edit: { resource: "canteen-accounts", recordId: row.id },
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
            entityLabel="comptes"
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
            testId="canteen-accounts-pagination"
            to={to}
            total={filtered.length}
          />
        )}
      </DataTableShell>
    </div>
  );
}
