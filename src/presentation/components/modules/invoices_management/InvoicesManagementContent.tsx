"use client";

import { useEffect, useState } from "react";
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

import { Select } from "@/presentation/components/shared/Select";
import { StatusBadge } from "@/presentation/components/shared/StatusBadge";
import {
  DEFAULT_TABLE_PAGE_SIZE,
  tableRowClass,
} from "@/presentation/components/shared/data-table-utils";
import {
  deleteInvoice,
  downloadInvoiceReceipt,
  generateInvoices,
  issueInvoice,
  listInvoices,
} from "@/infrastructure/api/resources/finance";
import { listAcademicYears, listClassGroups } from "@/infrastructure/api/resources/academic";
import { listStudents } from "@/infrastructure/api/resources/students";
import { useAuth, getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import { can } from "@/shared/lib/permissions";
import { emptyPaginationMeta, type PaginationMeta } from "@/shared/types/api.types";
import type { AcademicYear, ClassGroup } from "@/shared/types/academic.types";
import {
  INVOICE_STATUS_LABELS,
  canEditInvoice,
  canIssueInvoice,
  formatMoneyFcfa,
  type Invoice,
  type InvoiceStatus,
} from "@/shared/types/finance.types";
import { studentFullName, type Student } from "@/shared/types/student.types";
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
  const [meta, setMeta] = useState<PaginationMeta>(emptyPaginationMeta());
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_TABLE_PAGE_SIZE);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [classId, setClassId] = useState("");
  const [classGroups, setClassGroups] = useState<ClassGroup[]>([]);

  const [showGenerate, setShowGenerate] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [generateStudentId, setGenerateStudentId] = useState("");
  const [generateYearId, setGenerateYearId] = useState("");
  const [generating, setGenerating] = useState(false);

  const canCreate = can(user, "finance.create");
  const canUpdate = can(user, "finance.update");
  const canDelete = can(user, "finance.delete");

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const result = await listInvoices({
        ...(status ? { status } : {}),
        ...(classId ? { class_group_id: classId } : {}),
        ...(search ? { search } : {}),
        page,
        per_page: perPage,
      });
      setInvoices(result.data);
      setMeta(result.meta);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- search/status/classId/page/perPage drive API filters
  }, [search, status, classId, page, perPage]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [search, status, classId, page, perPage]);

  useEffect(() => {
    void listClassGroups()
      .then(setClassGroups)
      .catch((err) => setError(getAuthErrorMessage(err)));
  }, []);

  const allPageSelected =
    invoices.length > 0 && invoices.every((inv) => selectedIds.has(inv.id));
  const somePageSelected = invoices.some((inv) => selectedIds.has(inv.id));

  function toggleAllPage() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        invoices.forEach((inv) => next.delete(inv.id));
      } else {
        invoices.forEach((inv) => next.add(inv.id));
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

  async function openGeneratePanel() {
    setShowGenerate(true);
    setError(null);
    if (students.length === 0 || academicYears.length === 0) {
      try {
        const [studentList, yearList] = await Promise.all([listStudents(), listAcademicYears()]);
        setStudents(studentList);
        setAcademicYears(yearList);
        const activeYear = yearList.find((y) => y.is_active) ?? yearList[0];
        if (activeYear) setGenerateYearId(String(activeYear.id));
      } catch (err) {
        setError(getAuthErrorMessage(err));
      }
    }
  }

  async function handleGenerate() {
    if (!generateStudentId || !generateYearId) {
      setError("Sélectionnez un élève et une année scolaire.");
      return;
    }
    setGenerating(true);
    setError(null);
    setNotice(null);
    try {
      const created = await generateInvoices({
        student_id: generateStudentId,
        academic_year_id: generateYearId,
      });
      setNotice(
        created.length === 0
          ? "Aucune nouvelle facture à générer (déjà existantes)."
          : `${created.length} facture(s) générée(s).`
      );
      setShowGenerate(false);
      setGenerateStudentId("");
      await reload();
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setGenerating(false);
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

      <DataTableShell testId="invoices-table">
        <DataTableToolbar>
          <DataTableSearch
            ariaLabel={"Rechercher"}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder={"Rechercher n° ou élève…"}
            value={search}
          />
          <DataTableFilterSelect
            ariaLabel="Filtrer par statut"
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            options={(Object.keys(INVOICE_STATUS_LABELS) as InvoiceStatus[]).map((s) => ({
              value: s,
              label: INVOICE_STATUS_LABELS[s],
            }))}
            placeholder="Tous les statuts"
            value={status}
          />
          <DataTableFilterSelect
            ariaLabel="Filtrer par classe"
            onChange={(v) => {
              setClassId(v);
              setPage(1);
            }}
            options={classGroups.map((c) => ({ value: String(c.id), label: c.name }))}
            placeholder="Toutes les classes"
            value={classId}
          />
          <div className="flex flex-wrap items-center justify-end gap-sm w-full sm:w-auto sm:ml-auto">
            <DataTableRefreshButton loading={loading} onRefresh={() => void reload()} />
            {canCreate && (
              <button
                className="inline-flex items-center gap-sm h-10 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-caps text-label-caps px-md rounded-lg transition-colors shadow-sm"
                onClick={() => void openGeneratePanel()}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                Générer les factures
              </button>
            )}
            {canCreate && (
              <CrudCreateLink
                className={DATA_TABLE_CREATE_CLASS}
                label="NOUVELLE FACTURE"
                resource="invoices"
              />
            )}
          </div>
        </DataTableToolbar>

        {showGenerate && (
          <div
            className="px-lg py-md flex flex-wrap items-end gap-sm bg-surface-container-low/80 border-b border-outline-variant/15"
            data-testid="generate-invoices-panel"
          >
            <label className="flex flex-col gap-xs font-body-sm w-full sm:w-auto min-w-0 sm:min-w-[220px]">
              <span className="ui-stat-label">Élève</span>
              <Select
                ariaLabel="Élève"
                className="ui-input h-10 py-0"
                onChange={setGenerateStudentId}
                options={students.map((s) => ({
                  value: String(s.id),
                  label: `${studentFullName(s)} — ${s.matricule}`,
                }))}
                placeholder="Sélectionner…"
                searchable
                value={generateStudentId}
              />
            </label>
            <label className="flex flex-col gap-xs font-body-sm w-full sm:w-auto min-w-0 sm:min-w-[180px]">
              <span className="ui-stat-label">Année scolaire</span>
              <Select
                ariaLabel="Année scolaire"
                className="ui-input h-10 py-0"
                onChange={setGenerateYearId}
                options={academicYears.map((y) => ({
                  value: String(y.id),
                  label: `${y.name}${y.is_active ? " · active" : ""}`,
                }))}
                placeholder="Sélectionner…"
                searchable
                value={generateYearId}
              />
            </label>
            <button
              className="inline-flex items-center gap-sm h-9 bg-primary hover:bg-primary/90 text-on-primary font-label-caps text-label-caps px-md rounded-lg transition-colors shadow-sm disabled:opacity-50"
              disabled={generating}
              onClick={() => void handleGenerate()}
              type="button"
            >
              {generating ? "Génération…" : "Générer"}
            </button>
            <button
              className="inline-flex items-center h-10 px-md text-[13px] text-on-surface-variant hover:text-primary transition-colors"
              onClick={() => setShowGenerate(false)}
              type="button"
            >
              Annuler
            </button>
          </div>
        )}

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
                {invoices.length === 0 ? (
                  <tr>
                    <td className="py-lg px-lg text-on-surface-variant" colSpan={9}>
                      Aucune facture.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv, index) => (
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

        {!loading && meta.total > 0 && (
          <DataTablePagination
            canNextPage={meta.current_page < meta.last_page}
            canPreviousPage={meta.current_page > 1}
            entityLabel="factures"
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
