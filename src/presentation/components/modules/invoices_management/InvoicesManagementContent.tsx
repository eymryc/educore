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
import { StatusBadge } from "@/presentation/components/shared/StatusBadge";
import {
  tableRowClass,
  useClientDataTable,
} from "@/presentation/components/shared/data-table-utils";
import {
  deleteInvoice,
  downloadInvoiceReceipt,
  issueInvoice,
  listInvoices,
} from "@/infrastructure/api/resources/finance";
import { useAuth, getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import { can } from "@/shared/lib/permissions";
import {
  INVOICE_STATUS_LABELS,
  canEditInvoice,
  canIssueInvoice,
  filterInvoices,
  formatMoneyFcfa,
  type Invoice,
  type InvoiceStatus,
} from "@/shared/types/finance.types";
import { studentFullName } from "@/shared/types/student.types";
import { useConfirm } from "@/presentation/components/providers/ConfirmDialogProvider";

function invoiceTone(
  status: InvoiceStatus
): "success" | "warning" | "error" | "info" | "neutral" {
  if (status === "PAID") return "success";
  if (status === "PARTIALLY_PAID" || status === "ISSUED") return "info";
  if (status === "OVERDUE") return "error";
  if (status === "CANCELLED") return "neutral";
  return "warning";
}

export function InvoicesManagementContent() {
  const confirmDialog = useConfirm();
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const canCreate = can(user, "finance.create");
  const canUpdate = can(user, "finance.update");
  const canDelete = can(user, "finance.delete");

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      setInvoices(await listInvoices(status ? { status } : undefined));
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- status drives API filter
  }, [status]);

  const filtered = useMemo(
    () => filterInvoices(invoices, { search, status: "" }),
    [invoices, search]
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

  async function handleIssue(inv: Invoice) {
    if (!canUpdate || !canIssueInvoice(inv.status)) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await issueInvoice(inv.id);
      setInvoices((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      setNotice("Facture émise.");
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleReceipt(inv: Invoice) {
    if (inv.status === "DRAFT") return;
    setBusy(true);
    setError(null);
    try {
      await downloadInvoiceReceipt(inv.id);
      setNotice("Téléchargement du reçu PDF.");
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(inv: Invoice) {
    if (!canDelete || inv.status !== "DRAFT") return;
    if (!await confirmDialog(`Supprimer la facture ${inv.invoice_number ?? inv.id} ?`)) return;
    setBusy(true);
    try {
      await deleteInvoice(inv.id);
      setInvoices((prev) => prev.filter((i) => i.id !== inv.id));
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col w-full gap-lg pb-xl max-w-7xl mx-auto">
{notice && (
        <div className="rounded-lg bg-secondary-container text-on-secondary-container px-md py-sm" role="status">
          {notice}
        </div>
      )}
      {error && (
        <div
          className="rounded-lg bg-error-container text-on-error-container px-md py-sm"
          data-testid="invoices-error"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="ui-table-shell" data-testid="invoices-table">
        <div className="px-lg pt-lg pb-md flex flex-wrap items-center gap-sm border-b border-outline-variant/15">
          <div className="ui-search-field flex-1 min-w-[200px] h-10 py-0">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
              search
            </span>
            <input
              aria-label="Rechercher"
              className="ui-search-input ml-sm h-full"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher n° ou élève…"
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
            {(Object.keys(INVOICE_STATUS_LABELS) as InvoiceStatus[]).map((s) => (
              <option key={s} value={s}>
                {INVOICE_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <div className="ml-auto shrink-0 flex items-center gap-sm">
            <DataTableRefreshButton loading={loading} onRefresh={() => void reload()} />
            {canCreate && (
              <CrudCreateLink
                className="inline-flex items-center gap-sm h-10 bg-primary hover:bg-primary/90 text-on-primary font-label-caps text-label-caps px-md rounded-lg transition-colors shadow-sm"
                label="NOUVELLE FACTURE"
                resource="invoices"
              />
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <ContentSkeleton testId="invoices-loading" variant="table" />
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low/80 sticky top-0 z-10">
                <tr className="ui-table-head-row">
                  <DataTableSelectHeader
                    checked={allPageSelected}
                    indeterminate={somePageSelected && !allPageSelected}
                    onChange={toggleAllPage}
                  />
                  <th className="py-md px-lg">N°</th>
                  <th className="py-md px-md">Élève</th>
                  <th className="py-md px-md text-right">Total</th>
                  <th className="py-md px-md text-right">Payé</th>
                  <th className="py-md px-md text-right">Solde</th>
                  <th className="py-md px-md">Échéance</th>
                  <th className="py-md px-md">Statut</th>
                  <th className="py-md px-lg text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td className="py-lg px-lg text-on-surface-variant" colSpan={9}>
                      Aucune facture.
                    </td>
                  </tr>
                ) : (
                  pageRows.map((inv, index) => (
                    <tr className={tableRowClass(index)} key={inv.id}>
                      <DataTableSelectCell
                        checked={selectedIds.has(inv.id)}
                        label={inv.invoice_number ?? `#${inv.id}`}
                        onChange={() => toggleOne(inv.id)}
                      />
                      <td className="py-md px-lg font-mono-data">
                        {inv.invoice_number ?? `#${inv.id}`}
                      </td>
                      <td className="py-md px-md">
                        {inv.student ? studentFullName(inv.student) : `Élève #${inv.student_id}`}
                      </td>
                      <td className="py-md px-md text-right">{formatMoneyFcfa(inv.total_amount)}</td>
                      <td className="py-md px-md text-right text-on-surface-variant">
                        {formatMoneyFcfa(inv.amount_paid)}
                      </td>
                      <td className="py-md px-md text-right font-semibold">
                        {formatMoneyFcfa(inv.balance_due)}
                      </td>
                      <td className="py-md px-md">{inv.due_date}</td>
                      <td className="py-md px-md">
                        <StatusBadge
                          label={INVOICE_STATUS_LABELS[inv.status]}
                          tone={invoiceTone(inv.status)}
                        />
                      </td>
                      <td className="py-md px-lg text-right">
                        <DataTableActionsMenu
                          ariaLabel={`Actions pour ${inv.invoice_number ?? inv.id}`}
                          items={[
                            ...(canUpdate && canIssueInvoice(inv.status)
                              ? [
                                  {
                                    kind: "button" as const,
                                    label: "Émettre",
                                    icon: "send",
                                    onClick: () => void handleIssue(inv),
                                    disabled: busy,
                                  },
                                ]
                              : []),
                            ...(inv.status !== "DRAFT"
                              ? [
                                  {
                                    kind: "button" as const,
                                    label: "Reçu PDF",
                                    icon: "picture_as_pdf",
                                    onClick: () => void handleReceipt(inv),
                                    disabled: busy,
                                  },
                                ]
                              : []),
                            ...crudRowActions({
                              edit: canEditInvoice(inv.status)
                                ? { resource: "invoices", recordId: inv.id }
                                : undefined,
                              delete:
                                inv.status === "DRAFT"
                                  ? {
                                      onClick: () => void handleDelete(inv),
                                      disabled: busy,
                                    }
                                  : undefined,
                              canUpdate: canUpdate && canEditInvoice(inv.status),
                              canDelete: canDelete && inv.status === "DRAFT",
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
            entityLabel="factures"
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
