"use client";

import { useEffect, useMemo, useState } from "react";
import { CrudCreateLink } from "@/presentation/components/forms/CrudLinks";
import {
  DataTableRefreshButton,
  DataTableSelectCell,
  DataTableSelectHeader,
} from "@/presentation/components/shared/DataTableControls";
import { ContentSkeleton } from "@/presentation/components/shared/DataTableSkeleton";
import { DataTablePagination } from "@/presentation/components/shared/DataTablePagination";
import { StatusBadge } from "@/presentation/components/shared/StatusBadge";
import {
  tableRowClass,
  useClientDataTable,
} from "@/presentation/components/shared/data-table-utils";
import {
  getPayment,
  listPayments,
  refundPayment,
} from "@/infrastructure/api/resources/payments";
import { useAuth, getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import { can } from "@/shared/lib/permissions";
import {
  PAYMENT_STATUS_LABELS,
  canOpenPaystackCheckout,
  filterPayments,
  formatMoneyFcfa,
  type Payment,
  type PaymentStatus,
} from "@/shared/types/finance.types";
import { studentFullName } from "@/shared/types/student.types";
import { useConfirm } from "@/presentation/components/providers/ConfirmDialogProvider";

function paymentTone(
  status: PaymentStatus
): "success" | "warning" | "error" | "info" | "neutral" {
  if (status === "SUCCESS") return "success";
  if (status === "PROCESSING" || status === "PENDING") return "warning";
  if (status === "FAILED" || status === "CANCELLED") return "error";
  if (status === "REFUNDED") return "neutral";
  return "info";
}

export function PaymentsManagementContent() {
  const confirmDialog = useConfirm();
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const canCreate = can(user, "payments.create");
  const canRefund = can(user, "payments.refund");

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      setPayments(await listPayments());
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
    () => filterPayments(payments, { search, status }),
    [payments, search, status]
  );

  const successTotal = useMemo(
    () =>
      payments
        .filter((p) => p.status === "SUCCESS")
        .reduce((sum, p) => sum + Number(p.amount || 0), 0),
    [payments]
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
  } = useClientDataTable(filtered, [search, status]);

  async function handleRefresh(payment: Payment) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await getPayment(payment.id);
      setPayments((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setNotice(`Statut actualisé : ${PAYMENT_STATUS_LABELS[updated.status]}.`);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleRefund(payment: Payment) {
    if (!canRefund || payment.status !== "SUCCESS") return;
    if (!await confirmDialog("Rembourser ce paiement via Paystack ?")) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await refundPayment(payment.id);
      setPayments((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setNotice("Remboursement initié.");
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col w-full gap-lg pb-xl max-w-7xl mx-auto">
<div
        className="bg-surface-container-high rounded-xl p-lg"
        data-testid="payments-success-total"
      >
        <span className="font-label-caps text-on-surface-variant uppercase">Encaissements réussis</span>
<p className="font-body-sm text-on-surface-variant mt-xs">
          {payments.filter((p) => p.status === "SUCCESS").length} paiement(s) SUCCESS
        </p>
      </div>

      {notice && (
        <div className="rounded-lg bg-secondary-container text-on-secondary-container px-md py-sm" role="status">
          {notice}
        </div>
      )}
      {error && (
        <div
          className="rounded-lg bg-error-container text-on-error-container px-md py-sm"
          data-testid="payments-error"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="ui-table-shell" data-testid="payments-table">
        <div className="px-lg pt-lg pb-md flex flex-wrap items-center gap-sm border-b border-outline-variant/15">
          <div className="ui-search-field flex-1 min-w-[200px] h-10 py-0">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
              search
            </span>
            <input
              aria-label="Rechercher"
              className="ui-search-input ml-sm h-full"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher élève, référence…"
              type="text"
              value={search}
            />
          </div>
          <select
            aria-label="Filtrer par statut"
            className="ui-input cursor-pointer h-10 py-0"
            onChange={(e) => setStatus(e.target.value)}
            value={status}
          >
            <option value="">Tous les statuts</option>
            {(Object.keys(PAYMENT_STATUS_LABELS) as PaymentStatus[]).map((s) => (
              <option key={s} value={s}>
                {PAYMENT_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <div className="ml-auto shrink-0 flex items-center gap-sm">
            <DataTableRefreshButton loading={loading} onRefresh={() => void reload()} />
            {canCreate && (
              <CrudCreateLink
                className="inline-flex items-center gap-sm h-10 bg-primary hover:bg-primary/90 text-on-primary font-label-caps text-label-caps px-md rounded-lg transition-colors shadow-sm"
                label="INITIER UN PAIEMENT"
                resource="payments"
              />
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <ContentSkeleton testId="payments-loading" variant="table" />
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low/80 sticky top-0 z-10">
                <tr className="ui-table-head-row">
                  <DataTableSelectHeader
                    checked={allPageSelected}
                    indeterminate={somePageSelected && !allPageSelected}
                    onChange={toggleAllPage}
                  />
                  <th className="py-md px-lg">Élève / facture</th>
                  <th className="py-md px-md">Référence</th>
                  <th className="py-md px-md text-right">Montant</th>
                  <th className="py-md px-md">Statut</th>
                  <th className="py-md px-lg text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td className="py-lg px-lg text-on-surface-variant" colSpan={6}>
                      Aucun paiement.
                    </td>
                  </tr>
                ) : (
                  pageRows.map((p, index) => (
                    <tr className={tableRowClass(index)} key={p.id}>
                      <DataTableSelectCell
                        checked={selectedIds.has(p.id)}
                        label={p.provider_reference ?? `#${p.id}`}
                        onChange={() => toggleOne(p.id)}
                      />
                      <td className="py-md px-lg">
                        <div className="font-semibold">
                          {p.student ? studentFullName(p.student) : `Élève #${p.student_id ?? "—"}`}
                        </div>
                        <div className="font-body-sm text-on-surface-variant">
                          Facture #{p.invoice_id}
                          {p.invoice?.invoice_number ? ` · ${p.invoice.invoice_number}` : ""}
                        </div>
                      </td>
                      <td className="py-md px-md font-mono-data text-on-surface-variant">
                        {p.provider_reference ?? "—"}
                      </td>
                      <td className="py-md px-md text-right font-semibold">
                        {formatMoneyFcfa(p.amount)}
                      </td>
                      <td className="py-md px-md">
                        <StatusBadge
                          label={PAYMENT_STATUS_LABELS[p.status]}
                          tone={paymentTone(p.status)}
                        />
                      </td>
                      <td className="py-md px-lg">
                        <div className="flex justify-end gap-xs flex-wrap">
                          {canOpenPaystackCheckout(p) && (
                            <a
                              className="px-sm py-xs rounded bg-primary text-on-primary text-[11px] font-label-caps"
                              href={p.authorization_url!}
                              rel="noopener noreferrer"
                              target="_blank"
                            >
                              Ouvrir Paystack
                            </a>
                          )}
                          <button
                            className="px-sm py-xs rounded bg-surface-container-high text-[11px] font-label-caps disabled:opacity-40"
                            disabled={busy}
                            onClick={() => void handleRefresh(p)}
                            type="button"
                          >
                            Actualiser
                          </button>
                          {canRefund && p.status === "SUCCESS" && (
                            <button
                              className="px-sm py-xs rounded bg-surface-container-high text-[11px] font-label-caps disabled:opacity-40"
                              disabled={busy}
                              onClick={() => void handleRefund(p)}
                              type="button"
                            >
                              Rembourser
                            </button>
                          )}
                        </div>
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
            entityLabel="paiements"
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
