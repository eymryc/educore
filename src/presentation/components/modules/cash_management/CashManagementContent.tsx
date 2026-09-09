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
import {
  tableRowClass,
  useClientDataTable,
} from "@/presentation/components/shared/data-table-utils";
import {
  deleteCashRegister,
  listCashRegisters,
  listCashTransactions,
} from "@/infrastructure/api/resources/finance";
import { useAuth, getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import { can } from "@/shared/lib/permissions";
import {
  CASH_TRANSACTION_DIRECTION_LABELS,
  CASH_TRANSACTION_TYPE_LABELS,
  formatMoneyFcfa,
  type CashRegister,
  type CashTransaction,
} from "@/shared/types/finance.types";
import { useConfirm } from "@/presentation/components/providers/ConfirmDialogProvider";

type Tab = "registers" | "transactions";

const CARD_CLASS =
  "border border-outline-variant/30 bg-white overflow-hidden shadow-[0_2px_4px_rgb(15_23_42/0.06),0_8px_24px_rgb(15_23_42/0.1),0_20px_48px_rgb(15_23_42/0.12)]";

export function CashManagementContent() {
  const confirmDialog = useConfirm();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("registers");
  const [registers, setRegisters] = useState<CashRegister[]>([]);
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
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
      const [regs, txs] = await Promise.all([listCashRegisters(), listCashTransactions()]);
      setRegisters(regs);
      setTransactions(txs);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  const filteredRegisters = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return registers;
    return registers.filter((r) =>
      `${r.name} ${r.code ?? ""}`.toLowerCase().includes(q)
    );
  }, [registers, search]);

  const filteredTransactions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return transactions;
    return transactions.filter((t) =>
      `${t.description} ${t.type} ${t.direction} ${t.transaction_date ?? ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [transactions, search]);

  const registersTable = useClientDataTable(filteredRegisters, [search, tab]);
  const transactionsTable = useClientDataTable(filteredTransactions, [search, tab]);

  const searchPlaceholder =
    tab === "registers" ? "Nom, code…" : "Description, type…";
  const searchLabel =
    tab === "registers" ? "Rechercher caisses" : "Rechercher mouvements";
  const createLabel = tab === "registers" ? "Nouvelle caisse" : "Nouveau mouvement";
  const createResource = tab === "registers" ? "cash-registers" : "cash-transactions";

  return (
    <div className="flex flex-col w-full gap-lg pb-xl max-w-7xl mx-auto">
      <section className={CARD_CLASS} data-testid="cash-intro">
        <div className="flex items-start gap-md px-md sm:px-lg py-md bg-[#f7f9fb]">
          <span className="w-10 h-10 bg-primary-container text-on-primary-container inline-flex items-center justify-center shrink-0">
            <span aria-hidden className="material-symbols-outlined text-[22px]">
              point_of_sale
            </span>
          </span>
          <div className="min-w-0">
            <h2 className="font-title-sm text-[16px] text-on-surface">
              Suivi de l&apos;argent liquide réellement en caisse
            </h2>
            <p className="text-[13px] text-on-surface-variant mt-0.5">
              Distinct des factures/paiements élèves : chaque caisse (guichet, cantine…) a
              un solde et un responsable ; chaque mouvement (recette, dépense, transfert,
              ajustement) sert à faire correspondre ce solde théorique à l&apos;argent
              compté physiquement en fin de journée.
            </p>
          </div>
        </div>
      </section>

      {error && (
        <div
          className="rounded-lg bg-error-container text-on-error-container px-md py-sm"
          data-testid="cash-error"
          role="alert"
        >
          {error}
        </div>
      )}

      <DataTableShell>
        <ContentTabs
          items={[
            { id: "registers", label: "Caisses", count: registers.length },
            { id: "transactions", label: "Mouvements", count: transactions.length },
          ]}
          onChange={(id) => {
            setTab(id);
            setSearch("");
          }}
          testId="cash-tabs"
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

        {tab === "registers" && (
          <>
            <div className="overflow-x-auto min-h-[320px]" data-testid="cash-registers-table">
              {loading ? (
                <ContentSkeleton testId="cash-loading" variant="table" />
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-surface-container-low/80 sticky top-0 z-10">
                    <tr className="ui-table-head-row">
                      <DataTableSelectHeader
                        checked={registersTable.allPageSelected}
                        indeterminate={
                          registersTable.somePageSelected && !registersTable.allPageSelected
                        }
                        onChange={registersTable.toggleAllPage}
                      />
                      <th className="py-sm px-md">Nom</th>
                      <th className="py-sm px-md">Code</th>
                      <th className="py-sm px-md text-right">Solde</th>
                      <th className="py-sm px-md">Actif</th>
                      <th className="py-sm px-md text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="font-body-sm text-body-sm">
                    {filteredRegisters.length === 0 ? (
                      <tr>
                        <td className="py-lg px-lg text-on-surface-variant" colSpan={6}>
                          Aucune caisse.
                        </td>
                      </tr>
                    ) : (
                      registersTable.pageRows.map((r, index) => (
                        <tr className={tableRowClass(index)} key={r.id}>
                          <DataTableSelectCell
                            checked={registersTable.selectedIds.has(r.id)}
                            label={r.name}
                            onChange={() => registersTable.toggleOne(r.id)}
                          />
                          <td className="py-sm px-md">{r.name}</td>
                          <td className="py-sm px-md">{r.code ?? "—"}</td>
                          <td className="py-sm px-md text-right font-semibold">
                            {formatMoneyFcfa(r.current_balance)}
                          </td>
                          <td className="py-sm px-md">{r.is_active ? "Oui" : "Non"}</td>
                          <td className="py-sm px-md text-right">
                            <DataTableActionsMenu
                              ariaLabel={`Actions pour ${r.name}`}
                              items={crudRowActions({
                                edit: { resource: "cash-registers", recordId: r.id },
                                delete: {
                                  onClick: () => {
                                    void (async () => {
                                      if (!await confirmDialog(`Supprimer « ${r.name} » ?`)) return;
                                      setBusy(true);
                                      void deleteCashRegister(r.id)
                                        .then(() => reload())
                                        .catch((err) => setError(getAuthErrorMessage(err)))
                                        .finally(() => setBusy(false));
                                    })();
                                  },
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

            {!loading && filteredRegisters.length > 0 && (
              <DataTablePagination
                canNextPage={registersTable.canNextPage}
                canPreviousPage={registersTable.canPreviousPage}
                entityLabel="caisses"
                from={registersTable.from}
                onFirstPage={() => registersTable.setPageIndex(0)}
                onLastPage={() => registersTable.setPageIndex(registersTable.pageCount - 1)}
                onNextPage={() => registersTable.setPageIndex(registersTable.pageIndex + 1)}
                onPageChange={registersTable.setPageIndex}
                onPageSizeChange={registersTable.setPageSize}
                onPreviousPage={() => registersTable.setPageIndex(registersTable.pageIndex - 1)}
                pageCount={registersTable.pageCount}
                pageIndex={registersTable.pageIndex}
                pageSize={registersTable.pageSize}
                testId="cash-registers-pagination"
                to={registersTable.to}
                total={filteredRegisters.length}
              />
            )}
          </>
        )}

        {tab === "transactions" && (
          <>
            <div className="overflow-x-auto min-h-[320px]" data-testid="cash-transactions-table">
              {loading ? (
                <ContentSkeleton testId="cash-loading" variant="table" />
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-surface-container-low/80 sticky top-0 z-10">
                    <tr className="ui-table-head-row">
                      <DataTableSelectHeader
                        checked={transactionsTable.allPageSelected}
                        indeterminate={
                          transactionsTable.somePageSelected &&
                          !transactionsTable.allPageSelected
                        }
                        onChange={transactionsTable.toggleAllPage}
                      />
                      <th className="py-sm px-md">Date</th>
                      <th className="py-sm px-md">Type</th>
                      <th className="py-sm px-md">Direction</th>
                      <th className="py-sm px-md">Description</th>
                      <th className="py-sm px-md text-right">Montant</th>
                    </tr>
                  </thead>
                  <tbody className="font-body-sm text-body-sm">
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td className="py-lg px-lg text-on-surface-variant" colSpan={6}>
                          Aucun mouvement.
                        </td>
                      </tr>
                    ) : (
                      transactionsTable.pageRows.map((t, index) => (
                        <tr className={tableRowClass(index)} key={t.id}>
                          <DataTableSelectCell
                            checked={transactionsTable.selectedIds.has(t.id)}
                            label={t.description}
                            onChange={() => transactionsTable.toggleOne(t.id)}
                          />
                          <td className="py-sm px-md font-mono-data">
                            {t.transaction_date ?? "—"}
                          </td>
                          <td className="py-sm px-md">
                            {CASH_TRANSACTION_TYPE_LABELS[t.type] ?? t.type}
                          </td>
                          <td className="py-sm px-md">
                            {CASH_TRANSACTION_DIRECTION_LABELS[t.direction] ?? t.direction}
                          </td>
                          <td className="py-sm px-md">{t.description}</td>
                          <td className="py-sm px-md text-right font-semibold">
                            {formatMoneyFcfa(t.amount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {!loading && filteredTransactions.length > 0 && (
              <DataTablePagination
                canNextPage={transactionsTable.canNextPage}
                canPreviousPage={transactionsTable.canPreviousPage}
                entityLabel="mouvements"
                from={transactionsTable.from}
                onFirstPage={() => transactionsTable.setPageIndex(0)}
                onLastPage={() =>
                  transactionsTable.setPageIndex(transactionsTable.pageCount - 1)
                }
                onNextPage={() =>
                  transactionsTable.setPageIndex(transactionsTable.pageIndex + 1)
                }
                onPageChange={transactionsTable.setPageIndex}
                onPageSizeChange={transactionsTable.setPageSize}
                onPreviousPage={() =>
                  transactionsTable.setPageIndex(transactionsTable.pageIndex - 1)
                }
                pageCount={transactionsTable.pageCount}
                pageIndex={transactionsTable.pageIndex}
                pageSize={transactionsTable.pageSize}
                testId="cash-transactions-pagination"
                to={transactionsTable.to}
                total={filteredTransactions.length}
              />
            )}
          </>
        )}
      </DataTableShell>
    </div>
  );
}
