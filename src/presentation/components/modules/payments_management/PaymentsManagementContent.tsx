"use client";

import { useEffect, useState } from "react";
import { CrudCreateLink } from "@/presentation/components/forms/CrudLinks";
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

import { Select } from "@/presentation/components/shared/Select";
import { StatusBadge } from "@/presentation/components/shared/StatusBadge";
import {
  DEFAULT_TABLE_PAGE_SIZE,
  tableRowClass,
} from "@/presentation/components/shared/data-table-utils";
import { listUnpaidInvoices } from "@/infrastructure/api/resources/finance";
import {
  downloadPaymentReceipt,
  getPayment,
  listPayments,
  recordManualPayment,
  refundPayment,
} from "@/infrastructure/api/resources/payments";
import { useAuth, getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import { can } from "@/shared/lib/permissions";
import { emptyPaginationMeta, type PaginationMeta } from "@/shared/types/api.types";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  canOpenPaystackCheckout,
  formatMoneyFcfa,
  type Invoice,
  type Payment,
  type PaymentMethod,
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
  const [meta, setMeta] = useState<PaginationMeta>(emptyPaginationMeta());
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_TABLE_PAGE_SIZE);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [successCount, setSuccessCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const [showManualForm, setShowManualForm] = useState(false);
  const [unpaidInvoices, setUnpaidInvoices] = useState<Invoice[]>([]);
  const [manualInvoiceId, setManualInvoiceId] = useState("");
  const [manualAmount, setManualAmount] = useState("");
  const [manualMethod, setManualMethod] = useState<PaymentMethod | "">("");
  const [manualReference, setManualReference] = useState("");
  const [recording, setRecording] = useState(false);

  const canCreate = can(user, "payments.create");
  const canRefund = can(user, "payments.refund");

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const [result, successResult] = await Promise.all([
        listPayments({
          ...(status ? { status } : {}),
          ...(search ? { search } : {}),
          page,
          per_page: perPage,
        }),
        // Compte global (pas la page courante) via une requête légère
        // (1 ligne demandée) qui ne lit que `meta.total`.
        listPayments({ status: "SUCCESS", per_page: 1 }),
      ]);
      setPayments(result.data);
      setMeta(result.meta);
      setSuccessCount(successResult.meta.total);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- search/status/page/perPage drive API filters
  }, [search, status, page, perPage]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [search, status, page, perPage]);

  const allPageSelected =
    payments.length > 0 && payments.every((p) => selectedIds.has(p.id));
  const somePageSelected = payments.some((p) => selectedIds.has(p.id));

  function toggleAllPage() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        payments.forEach((p) => next.delete(p.id));
      } else {
        payments.forEach((p) => next.add(p.id));
      }
      return next;
    });
  }

  function toggleOne(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const from = meta.total === 0 ? 0 : (meta.current_page - 1) * meta.per_page + 1;
  const to = Math.min(meta.current_page * meta.per_page, meta.total);

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

  async function openManualForm() {
    setShowManualForm(true);
    setNotice(null);
    setError(null);
    try {
      setUnpaidInvoices(await listUnpaidInvoices());
    } catch (err) {
      setError(getAuthErrorMessage(err));
    }
  }

  async function handleRecordManualPayment() {
    if (!manualInvoiceId || !manualAmount || !manualMethod) return;
    setRecording(true);
    setError(null);
    setNotice(null);
    try {
      const payment = await recordManualPayment({
        invoice_id: manualInvoiceId,
        amount: Number(manualAmount),
        method: manualMethod,
        reference: manualReference || undefined,
      });
      await reload();
      setNotice(`Paiement enregistré — reçu ${payment.receipt_number ?? ""}.`);
      setShowManualForm(false);
      setManualInvoiceId("");
      setManualAmount("");
      setManualMethod("");
      setManualReference("");
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setRecording(false);
    }
  }

  async function handleDownloadReceipt(payment: Payment) {
    setError(null);
    try {
      await downloadPaymentReceipt(payment.id);
    } catch (err) {
      setError(getAuthErrorMessage(err));
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
          {successCount} paiement(s) SUCCESS
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

      <DataTableShell testId="payments-table">
        <DataTableToolbar>
          <DataTableSearch
            ariaLabel={"Rechercher"}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder={"Rechercher élève, référence…"}
            value={search}
          />
          <DataTableFilterSelect
            ariaLabel="Filtrer par statut"
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            options={(Object.keys(PAYMENT_STATUS_LABELS) as PaymentStatus[]).map((s) => ({
              value: s,
              label: PAYMENT_STATUS_LABELS[s],
            }))}
            placeholder="Tous les statuts"
            value={status}
          />
          <div className="flex flex-wrap items-center justify-end gap-sm w-full sm:w-auto sm:ml-auto">
            <DataTableRefreshButton loading={loading} onRefresh={() => void reload()} />
            {canCreate && (
              <button
                className="inline-flex items-center gap-sm h-10 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-caps text-label-caps px-md rounded-lg transition-colors shadow-sm"
                onClick={() => void openManualForm()}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">payments</span>
                Enregistrer un paiement
              </button>
            )}
            {canCreate && (
              <CrudCreateLink
                className={DATA_TABLE_CREATE_CLASS}
                label="INITIER UN PAIEMENT"
                resource="payments"
              />
            )}
          </div>
        </DataTableToolbar>

        {showManualForm && (
          <div
            className="px-lg py-md flex flex-wrap items-end gap-sm bg-surface-container-low/80 border-b border-outline-variant/15"
            data-testid="manual-payment-panel"
          >
            <label className="flex flex-col gap-xs font-body-sm w-full sm:w-auto min-w-0 sm:min-w-[240px]">
              <span className="ui-stat-label">Facture</span>
              <Select
                ariaLabel="Facture"
                className="ui-input h-10 py-0"
                onChange={setManualInvoiceId}
                options={unpaidInvoices.map((inv) => ({
                  value: String(inv.id),
                  label: `${inv.invoice_number ?? `#${inv.id}`} — ${inv.student ? studentFullName(inv.student) : `Élève #${inv.student_id}`} (solde ${formatMoneyFcfa(inv.balance_due)})`,
                }))}
                placeholder="Sélectionner…"
                searchable
                value={manualInvoiceId}
              />
            </label>
            <label className="flex flex-col gap-xs font-body-sm w-full sm:w-auto min-w-0 sm:min-w-[140px]">
              <span className="ui-stat-label">Montant (FCFA)</span>
              <input
                aria-label="Montant du paiement"
                className="ui-input h-10 py-0"
                min={1}
                onChange={(e) => setManualAmount(e.target.value)}
                type="number"
                value={manualAmount}
              />
            </label>
            <label className="flex flex-col gap-xs font-body-sm w-full sm:w-auto min-w-0 sm:min-w-[180px]">
              <span className="ui-stat-label">Mode de paiement</span>
              <Select
                ariaLabel="Mode de paiement"
                className="ui-input h-10 py-0"
                onChange={(v) => setManualMethod(v as PaymentMethod)}
                options={(["CASH", "MOBILE_MONEY", "CHEQUE", "BANK_TRANSFER"] as PaymentMethod[]).map(
                  (m) => ({ value: m, label: PAYMENT_METHOD_LABELS[m] })
                )}
                placeholder="Sélectionner…"
                searchable
                value={manualMethod}
              />
            </label>
            <label className="flex flex-col gap-xs font-body-sm w-full sm:w-auto min-w-0 sm:min-w-[200px]">
              <span className="ui-stat-label">Référence (optionnel)</span>
              <input
                aria-label="Référence du paiement"
                className="ui-input h-10 py-0"
                onChange={(e) => setManualReference(e.target.value)}
                placeholder="N° chèque, transaction…"
                type="text"
                value={manualReference}
              />
            </label>
            <button
              className="inline-flex items-center gap-sm h-9 bg-primary hover:bg-primary/90 text-on-primary font-label-caps text-label-caps px-md rounded-lg transition-colors shadow-sm disabled:opacity-50"
              disabled={recording || !manualInvoiceId || !manualAmount || !manualMethod}
              onClick={() => void handleRecordManualPayment()}
              type="button"
            >
              {recording ? "Enregistrement…" : "Enregistrer"}
            </button>
            <button
              className="inline-flex items-center gap-sm h-10 bg-surface-container-high text-on-surface font-label-caps text-label-caps px-md rounded-lg transition-colors"
              onClick={() => setShowManualForm(false)}
              type="button"
            >
              Annuler
            </button>
          </div>
        )}

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
                {payments.length === 0 ? (
                  <tr>
                    <td className="py-lg px-lg text-on-surface-variant" colSpan={6}>
                      Aucun paiement.
                    </td>
                  </tr>
                ) : (
                  payments.map((p, index) => (
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
                          {p.status === "SUCCESS" && p.receipt_number && (
                            <button
                              className="px-sm py-xs rounded bg-surface-container-high text-[11px] font-label-caps"
                              onClick={() => void handleDownloadReceipt(p)}
                              type="button"
                            >
                              Reçu {p.receipt_number}
                            </button>
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

        {!loading && meta.total > 0 && (
          <DataTablePagination
            canNextPage={meta.current_page < meta.last_page}
            canPreviousPage={meta.current_page > 1}
            entityLabel="paiements"
            from={from}
            onFirstPage={() => setPage(1)}
            onLastPage={() => setPage(meta.last_page)}
            onNextPage={() => setPage((p) => p + 1)}
            onPageChange={(index) => setPage(index + 1)}
            onPageSizeChange={(size) => {
              setPerPage(size);
              setPage(1);
            }}
            onPreviousPage={() => setPage((p) => Math.max(1, p - 1))}
            pageCount={meta.last_page}
            pageIndex={meta.current_page - 1}
            pageSize={perPage}
            to={to}
            total={meta.total}
          />
        )}
      </DataTableShell>
    </div>
  );
}
