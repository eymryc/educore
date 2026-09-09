"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getFinanceOverview,
  listUnpaidInvoices,
} from "@/infrastructure/api/resources/finance";
import { useAuth, getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import { can } from "@/shared/lib/permissions";
import {
  formatMoneyFcfa,
  type FinanceOverview,
  type Invoice,
} from "@/shared/types/finance.types";
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
} from "@/presentation/components/shared/DataTable";

import {
  tableRowClass,
  useClientDataTable,
} from "@/presentation/components/shared/data-table-utils";
import { studentFullName } from "@/shared/types/student.types";

export function FinancialOverviewContent() {
  const { user } = useAuth();
  const [overview, setOverview] = useState<FinanceOverview | null>(null);
  const [unpaid, setUnpaid] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canView = can(user, "finance.view") || can(user, "payments.view");

  async function reload() {
    if (!canView) {
      setLoading(false);
      setError("Accès finance non autorisé.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [ov, unpaidList] = await Promise.all([
        getFinanceOverview(),
        listUnpaidInvoices(),
      ]);
      setOverview(ov);
      setUnpaid(unpaidList);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView]);

  const unpaidTable = useClientDataTable(unpaid, [unpaid.length]);

  const kpis = overview
    ? [
        {
          key: "invoiced",
          label: "Total facturé",
          value: formatMoneyFcfa(overview.total_invoiced),
          hint: `${overview.invoices_count} facture(s)`,
          icon: "receipt_long",
        },
        {
          key: "paid",
          label: "Total encaissé",
          value: formatMoneyFcfa(overview.total_paid),
          hint: "Paiements confirmés",
          icon: "payments",
        },
        {
          key: "unpaid",
          label: "Impayés",
          value: formatMoneyFcfa(overview.total_unpaid),
          hint: `${overview.unpaid_invoices_count} facture(s)`,
          icon: "warning",
        },
        {
          key: "expenses",
          label: "Dépenses",
          value: formatMoneyFcfa(overview.total_expenses),
          hint: `Caisse : ${formatMoneyFcfa(overview.cash_balance)}`,
          icon: "shopping_cart",
        },
      ]
    : [];

  return (
    <div className="flex flex-col w-full gap-lg pb-xl max-w-7xl mx-auto">
      {error && (
        <div
          className="rounded-lg bg-error-container text-on-error-container px-md py-sm"
          data-testid="finance-overview-error"
          role="alert"
        >
          {error}
        </div>
      )}
      {loading && (
        <ContentSkeleton testId="finance-overview-loading" variant="dashboard" />
      )}

      {!loading && overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md" data-testid="finance-overview-kpis">
          {kpis.map((kpi) => (
            <div
              key={kpi.key}
              className="bg-surface-container-lowest rounded-xl p-lg shadow-sm flex flex-col gap-sm"
              data-testid={`finance-kpi-${kpi.key}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-title-sm text-on-surface-variant">{kpi.label}</span>
                <span className="material-symbols-outlined text-primary text-[20px]">{kpi.icon}</span>
              </div>
              <span className="ui-page-title text-[1.35rem]">{kpi.value}</span>
              <span className="font-body-sm text-on-surface-variant">{kpi.hint}</span>
            </div>
          ))}
        </div>
      )}

      {!loading && overview && (
        <DataTableShell testId="finance-unpaid-list">
          <DataTableToolbar>
            <h2 className="font-headline-md text-headline-md">Factures impayées</h2>
            <Link className="font-label-caps text-primary ml-sm" href="/invoices">
              Voir toutes
            </Link>
            <div className="ml-auto shrink-0">
              <DataTableRefreshButton loading={loading} onRefresh={() => void reload()} />
            </div>
          </DataTableToolbar>
          {unpaid.length === 0 ? (
            <p className="p-lg font-body-md text-on-surface-variant">Aucune facture impayée.</p>
          ) : (
            <>
              <div className="overflow-x-auto min-h-[200px]">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-surface-container-low/80 sticky top-0 z-10">
                    <tr className="ui-table-head-row">
                      <DataTableSelectHeader
                        checked={unpaidTable.allPageSelected}
                        indeterminate={
                          unpaidTable.somePageSelected && !unpaidTable.allPageSelected
                        }
                        onChange={unpaidTable.toggleAllPage}
                      />
                      <th className="py-sm px-md">N°</th>
                      <th className="py-sm px-md">Élève</th>
                      <th className="py-sm px-md">Échéance</th>
                      <th className="py-sm px-md text-right">Solde</th>
                    </tr>
                  </thead>
                  <tbody className="font-body-sm text-body-sm">
                    {unpaidTable.pageRows.map((inv, index) => (
                      <tr className={tableRowClass(index)} key={inv.id}>
                        <DataTableSelectCell
                          checked={unpaidTable.selectedIds.has(inv.id)}
                          label={inv.invoice_number ?? `#${inv.id}`}
                          onChange={() => unpaidTable.toggleOne(inv.id)}
                        />
                        <td className="py-sm px-md font-mono-data">
                          {inv.invoice_number ?? `#${inv.id}`}
                        </td>
                        <td className="py-sm px-md">
                          {inv.student ? studentFullName(inv.student) : `Élève #${inv.student_id}`}
                        </td>
                        <td className="py-sm px-md">{inv.due_date}</td>
                        <td className="py-sm px-md text-right font-semibold">
                          {formatMoneyFcfa(inv.balance_due)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <DataTablePagination
                canNextPage={unpaidTable.canNextPage}
                canPreviousPage={unpaidTable.canPreviousPage}
                entityLabel="factures impayées"
                from={unpaidTable.from}
                onFirstPage={() => unpaidTable.setPageIndex(0)}
                onLastPage={() => unpaidTable.setPageIndex(unpaidTable.pageCount - 1)}
                onNextPage={() => unpaidTable.setPageIndex(unpaidTable.pageIndex + 1)}
                onPageChange={unpaidTable.setPageIndex}
                onPageSizeChange={unpaidTable.setPageSize}
                onPreviousPage={() => unpaidTable.setPageIndex(unpaidTable.pageIndex - 1)}
                pageCount={unpaidTable.pageCount}
                pageIndex={unpaidTable.pageIndex}
                pageSize={unpaidTable.pageSize}
                testId="finance-unpaid-pagination"
                to={unpaidTable.to}
                total={unpaid.length}
              />
            </>
          )}
        </DataTableShell>
      )}
    </div>
  );
}
