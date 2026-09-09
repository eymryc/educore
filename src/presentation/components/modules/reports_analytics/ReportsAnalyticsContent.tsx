"use client";

import { useEffect, useMemo, useState } from "react";
import { listAcademicYears, listClassGroups } from "@/infrastructure/api/resources/academic";
import { exportReport, getReport } from "@/infrastructure/api/resources/reports";
import { useAuth, getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import { ContentSkeleton } from "@/presentation/components/shared/DataTableSkeleton";
import {
  DataTableRefreshButton,
  DataTableSelectCell,
  DataTableSelectHeader,
} from "@/presentation/components/shared/DataTableControls";
import { DataTablePagination } from "@/presentation/components/shared/DataTablePagination";
import {
  DataTableShell,
  DataTableToolbar,
  DataTableEmpty,
  DataTableFilterSelect,
  DataTableFilterDate,
  DATA_TABLE_CREATE_CLASS,
  DATA_TABLE_TH_CLASS,
  DATA_TABLE_TD_CLASS,
} from "@/presentation/components/shared/DataTable";
import {
  tableRowClass,
  useClientDataTable,
} from "@/presentation/components/shared/data-table-utils";
import { can } from "@/shared/lib/permissions";
import { classGroupsForActiveYear, type ClassGroup } from "@/shared/types/academic.types";
import {
  REPORT_EXPORT_LABELS,
  REPORT_TYPE_LABELS,
  columnLabel,
  formatReportCell,
  rowColumns,
  summaryEntries,
  supportsClassFilter,
  supportsDateFilter,
  type ReportExportFormat,
  type ReportPayload,
  type ReportRow,
  type ReportType,
} from "@/shared/types/reports.types";

const REPORT_TYPES = Object.keys(REPORT_TYPE_LABELS) as ReportType[];
const EXPORT_FORMATS = Object.keys(REPORT_EXPORT_LABELS) as ReportExportFormat[];

const CARD_CLASS =
  "border border-outline-variant/30 bg-white overflow-hidden shadow-[0_2px_4px_rgb(15_23_42/0.06),0_8px_24px_rgb(15_23_42/0.1),0_20px_48px_rgb(15_23_42/0.12)]";

const REPORT_META: Record<ReportType, { icon: string; hint: string }> = {
  academic: { icon: "school", hint: "Notes, évaluations et moyennes" },
  attendance: { icon: "how_to_reg", hint: "Présences, absences et retards" },
  finance: { icon: "payments", hint: "Factures, encaissements et impayés" },
  students: { icon: "group", hint: "Effectifs et répartition des élèves" },
};

const KPI_ICONS: Record<string, string> = {
  assessments_count: "quiz",
  grades_count: "grade",
  average_score: "trending_up",
  validated_grades: "verified",
  records_count: "list_alt",
  present: "check_circle",
  absent: "cancel",
  late: "schedule",
  justified: "assignment_turned_in",
  attendance_rate: "pie_chart",
  invoices_count: "receipt_long",
  total_invoiced: "account_balance",
  total_paid_on_invoices: "payments",
  outstanding_amount: "money_off",
  payments_count: "account_balance_wallet",
  payments_total: "payments",
  students_count: "group",
  active_students: "group",
};

const EXPORT_ICONS: Record<ReportExportFormat, string> = {
  pdf: "picture_as_pdf",
  csv: "csv",
  xlsx: "table_view",
};

function kpiIcon(key: string): string {
  return KPI_ICONS[key] ?? "analytics";
}

function BreakdownTable({
  title,
  rows,
}: {
  title: string;
  rows: ReportRow[];
}) {
  const columns = rowColumns(rows);
  if (!columns.length) return null;

  return (
    <DataTableShell className="mt-0" testId="reports-breakdown">
      <DataTableToolbar>
        <h2 className="font-title-sm text-[15px]">{title}</h2>
      </DataTableToolbar>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface-container-low/80">
            <tr className="ui-table-head-row">
              {columns.map((col) => (
                <th className={DATA_TABLE_TH_CLASS} key={col}>
                  {columnLabel(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr className={tableRowClass(index)} key={index}>
                {columns.map((col) => (
                  <td className={`${DATA_TABLE_TD_CLASS} whitespace-nowrap`} key={col}>
                    {formatReportCell(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DataTableShell>
  );
}

export function ReportsAnalyticsContent() {
  const { user } = useAuth();
  const [type, setType] = useState<ReportType>("academic");
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [classGroupId, setClassGroupId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [report, setReport] = useState<ReportPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyExport, setBusyExport] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loadedOnce, setLoadedOnce] = useState(false);

  const canView = can(user, "reports.view");
  const canExport = can(user, "reports.export");
  const meta = REPORT_META[type];

  useEffect(() => {
    let cancelled = false;
    async function loadClasses() {
      try {
        const [list, yearList] = await Promise.all([
          listClassGroups(),
          listAcademicYears(),
        ]);
        if (!cancelled) setClasses(classGroupsForActiveYear(list, yearList));
      } catch {
        /* optional filter source */
      }
    }
    void loadClasses();
    return () => {
      cancelled = true;
    };
  }, []);

  const query = useMemo(() => {
    const q: {
      class_group_id?: string;
      date_from?: string;
      date_to?: string;
    } = {};
    if (supportsClassFilter(type) && classGroupId) q.class_group_id = classGroupId;
    if (supportsDateFilter(type) && dateFrom) q.date_from = dateFrom;
    if (supportsDateFilter(type) && dateTo) q.date_to = dateTo;
    return q;
  }, [type, classGroupId, dateFrom, dateTo]);

  async function loadReport() {
    if (!canView) {
      setError("Accès rapports non autorisé.");
      return;
    }
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const data = await getReport(type, query);
      setReport(data);
      setLoadedOnce(true);
    } catch (err) {
      setError(getAuthErrorMessage(err));
      setReport(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleExport(format: ReportExportFormat) {
    if (!canExport) return;
    setBusyExport(true);
    setError(null);
    setNotice(null);
    try {
      await exportReport(type, format, query);
      setNotice(`Export ${REPORT_EXPORT_LABELS[format]} démarré.`);
    } catch (err) {
      const message = getAuthErrorMessage(err);
      setError(
        /networkerror|failed to fetch|network/i.test(message)
          ? `Export ${REPORT_EXPORT_LABELS[format]} interrompu (timeout ou volume trop important). Réessayez en filtrant par classe ou période, ou utilisez CSV.`
          : message
      );
    } finally {
      setBusyExport(false);
    }
  }

  const kpis = useMemo(() => summaryEntries(report?.summary), [report]);
  const columns = useMemo(() => rowColumns(report?.rows ?? []), [report]);

  const rowsShown = Number(report?.summary?.rows_shown ?? report?.rows?.length ?? 0);
  const rowsTotal = Number(report?.summary?.rows_total ?? report?.rows?.length ?? 0);
  const rowsTruncated = rowsTotal > rowsShown;

  type ReportTableRow = { id: number; data: Record<string, unknown> };
  const reportTableRows = useMemo<ReportTableRow[]>(
    () => (report?.rows ?? []).map((row, index) => ({ id: index + 1, data: row })),
    [report]
  );

  const reportTable = useClientDataTable(reportTableRows, [
    type,
    classGroupId,
    dateFrom,
    dateTo,
    report?.rows?.length ?? 0,
  ]);

  return (
    <div className="flex flex-col w-full gap-md min-w-0 pb-xl">
      <section className={CARD_CLASS} data-testid="reports-filters">
        <div className="flex items-start gap-md px-md sm:px-lg py-md border-b border-outline-variant/15 bg-[#f7f9fb]">
          <span className="w-10 h-10 bg-primary-container text-on-primary-container inline-flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">{meta.icon}</span>
          </span>
          <div className="min-w-0">
            <h2 className="font-title-sm text-[16px] text-on-surface">Composer un rapport</h2>
            <p className="text-[13px] text-on-surface-variant mt-0.5">{meta.hint}</p>
          </div>
        </div>

        <div className="px-md sm:px-lg py-md flex flex-nowrap items-end gap-sm overflow-x-auto">
          <label className="flex flex-col gap-xs font-body-sm shrink-0">
            <span className="ui-stat-label">Type de rapport</span>
            <DataTableFilterSelect
              ariaLabel="Type de rapport"
              className="min-w-[12rem]"
              onChange={(v) => {
                setType(v as ReportType);
                setReport(null);
                setLoadedOnce(false);
              }}
              options={REPORT_TYPES.map((t) => ({ value: t, label: REPORT_TYPE_LABELS[t] }))}
              value={type}
            />
          </label>

          {supportsClassFilter(type) && (
            <label className="flex flex-col gap-xs font-body-sm shrink-0">
              <span className="ui-stat-label">Classe</span>
              <DataTableFilterSelect
                ariaLabel="Filtrer par classe"
                className="min-w-[12rem]"
                onChange={setClassGroupId}
                options={classes.map((c) => ({ value: String(c.id), label: c.name }))}
                placeholder="Toutes les classes"
                value={classGroupId}
              />
            </label>
          )}

          {supportsDateFilter(type) && (
            <>
              <label className="flex flex-col gap-xs font-body-sm shrink-0 min-w-[10.5rem]">
                <span className="ui-stat-label">Depuis le</span>
                <DataTableFilterDate
                  ariaLabel="Date de début"
                  onChange={setDateFrom}
                  value={dateFrom}
                />
              </label>
              <label className="flex flex-col gap-xs font-body-sm shrink-0 min-w-[10.5rem]">
                <span className="ui-stat-label">Jusqu&apos;au</span>
                <DataTableFilterDate
                  ariaLabel="Date de fin"
                  onChange={setDateTo}
                  value={dateTo}
                />
              </label>
            </>
          )}

          <div className="ml-auto shrink-0 flex items-center gap-sm pb-px">
            <button
              className={DATA_TABLE_CREATE_CLASS}
              disabled={loading || !canView}
              onClick={() => void loadReport()}
              type="button"
            >
              <span aria-hidden className="material-symbols-outlined text-[18px]">
                play_arrow
              </span>
              Générer
            </button>
            {canExport &&
              EXPORT_FORMATS.map((fmt) => (
                <button
                  className="inline-flex items-center gap-xs h-9 px-md bg-surface-container-high text-on-surface font-label-caps text-label-caps whitespace-nowrap hover:bg-surface-container-highest transition-colors disabled:opacity-40"
                  disabled={busyExport || loading}
                  key={fmt}
                  onClick={() => void handleExport(fmt)}
                  type="button"
                >
                  <span aria-hidden className="material-symbols-outlined text-[18px]">
                    {EXPORT_ICONS[fmt]}
                  </span>
                  {REPORT_EXPORT_LABELS[fmt]}
                </button>
              ))}
          </div>
        </div>
      </section>

      {notice && (
        <div
          className="flex items-start gap-sm bg-secondary-container text-on-secondary-container px-md py-sm font-body-sm"
          role="status"
        >
          <span className="material-symbols-outlined text-[18px] shrink-0">check_circle</span>
          <span>{notice}</span>
        </div>
      )}
      {error && (
        <div
          className="flex items-start gap-sm bg-error-container text-on-error-container px-md py-sm font-body-sm"
          data-testid="reports-error"
          role="alert"
        >
          <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <ContentSkeleton
          label="Chargement du rapport…"
          testId="reports-loading"
          variant="dashboard"
        />
      )}

      {!loading && !report && !error && (
        <div className={CARD_CLASS} data-testid="reports-empty">
          <DataTableEmpty
            description={
              loadedOnce
                ? "Aucune donnée pour ces filtres. Changez le type, la classe ou la période, puis générez à nouveau."
                : "Choisissez un type de rapport, des filtres optionnels, puis cliquez sur Générer."
            }
            icon="bar_chart"
            title={loadedOnce ? "Aucune donnée" : "Aucun rapport généré"}
          />
        </div>
      )}

      {!loading && report && (
        <>
          {kpis.length > 0 && (
            <section
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-md"
              data-testid="reports-summary"
            >
              {kpis.map((kpi, index) => (
                <div
                  className={`min-w-0 p-md sm:p-lg flex flex-col gap-sm min-h-[6.5rem] ${
                    index === 0 ? "bg-primary text-on-primary shadow-md" : "bg-white border border-outline-variant/20 shadow-sm"
                  }`}
                  data-testid={`report-kpi-${kpi.key}`}
                  key={kpi.key}
                >
                  <div className="flex justify-between items-start gap-sm">
                    <span
                      className={
                        index === 0
                          ? "text-[11px] font-semibold uppercase tracking-[0.08em] text-on-primary/70"
                          : "ui-stat-label"
                      }
                    >
                      {kpi.label}
                    </span>
                    <span
                      className={`w-9 h-9 inline-flex items-center justify-center shrink-0 ${
                        index === 0 ? "bg-on-primary/15 text-on-primary" : "bg-surface-container-high text-on-surface-variant"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">{kpiIcon(kpi.key)}</span>
                    </span>
                  </div>
                  <span
                    className={`mt-auto text-[1.35rem] font-semibold leading-tight break-words ${
                      index === 0 ? "text-on-primary" : "text-on-surface"
                    }`}
                  >
                    {kpi.value}
                  </span>
                </div>
              ))}
            </section>
          )}

          {rowsTruncated && (
            <p className="flex items-start gap-sm font-body-sm text-on-surface-variant bg-secondary-container/40 px-md py-sm">
              <span className="material-symbols-outlined text-[18px] shrink-0">info</span>
              <span>
                Affichage de {rowsShown.toLocaleString("fr-FR")} lignes sur{" "}
                {rowsTotal.toLocaleString("fr-FR")} — affinez les filtres pour un détail
                complet. Les indicateurs restent calculés sur l&apos;ensemble.
              </span>
            </p>
          )}

          {!!report.by_subject?.length && (
            <BreakdownTable rows={report.by_subject} title="Répartition par matière" />
          )}
          {!report.by_subject?.length && !!report.by_class?.length && (
            <BreakdownTable rows={report.by_class} title="Répartition par classe" />
          )}

          <DataTableShell className="mt-0" testId="reports-rows">
            <DataTableToolbar>
              <div className="min-w-0">
                <h2 className="font-title-sm text-[15px]">Détail des lignes</h2>
                <p className="text-[12px] text-on-surface-variant">
                  {report.rows.length.toLocaleString("fr-FR")} ligne
                  {report.rows.length > 1 ? "s" : ""}
                  {rowsTruncated ? ` / ${rowsTotal.toLocaleString("fr-FR")}` : ""}
                </p>
              </div>
              <div className="ml-auto shrink-0">
                <DataTableRefreshButton
                  loading={loading}
                  onRefresh={() => void loadReport()}
                />
              </div>
            </DataTableToolbar>
            {reportTableRows.length === 0 ? (
              <DataTableEmpty
                description="Le rapport n'a renvoyé aucune ligne. Essayez une autre classe ou période."
                icon="table_rows"
                title="Aucune ligne"
              />
            ) : (
              <>
                <div className="overflow-x-auto min-h-[320px]">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-surface-container-low/80 sticky top-0 z-10">
                      <tr className="ui-table-head-row">
                        <DataTableSelectHeader
                          checked={reportTable.allPageSelected}
                          indeterminate={
                            reportTable.somePageSelected &&
                            !reportTable.allPageSelected
                          }
                          onChange={reportTable.toggleAllPage}
                        />
                        {columns.map((col) => (
                          <th className={DATA_TABLE_TH_CLASS} key={col}>
                            {columnLabel(col)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportTable.pageRows.map((entry, index) => (
                        <tr className={tableRowClass(index)} key={entry.id}>
                          <DataTableSelectCell
                            checked={reportTable.selectedIds.has(entry.id)}
                            label={`Ligne ${entry.id}`}
                            onChange={() => reportTable.toggleOne(entry.id)}
                          />
                          {columns.map((col) => (
                            <td className={`${DATA_TABLE_TD_CLASS} whitespace-nowrap`} key={col}>
                              {formatReportCell(entry.data[col])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <DataTablePagination
                  canNextPage={reportTable.canNextPage}
                  canPreviousPage={reportTable.canPreviousPage}
                  entityLabel="lignes"
                  from={reportTable.from}
                  onFirstPage={() => reportTable.setPageIndex(0)}
                  onLastPage={() =>
                    reportTable.setPageIndex(reportTable.pageCount - 1)
                  }
                  onNextPage={() =>
                    reportTable.setPageIndex(reportTable.pageIndex + 1)
                  }
                  onPageChange={reportTable.setPageIndex}
                  onPageSizeChange={reportTable.setPageSize}
                  onPreviousPage={() =>
                    reportTable.setPageIndex(reportTable.pageIndex - 1)
                  }
                  pageCount={reportTable.pageCount}
                  pageIndex={reportTable.pageIndex}
                  pageSize={reportTable.pageSize}
                  testId="reports-pagination"
                  to={reportTable.to}
                  total={reportTableRows.length}
                />
              </>
            )}
          </DataTableShell>
        </>
      )}
    </div>
  );
}
