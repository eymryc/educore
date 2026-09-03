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
    <div className="ui-card p-lg" data-testid="reports-breakdown">
      <h2 className="font-headline-md text-headline-md mb-md">{title}</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface-container-low/80">
            <tr className="ui-table-head-row">
              {columns.map((col) => (
                <th key={col} className="py-sm px-md whitespace-nowrap">
                  {columnLabel(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="font-body-sm text-body-sm">
            {rows.map((row, index) => (
              <tr className={tableRowClass(index)} key={index}>
                {columns.map((col) => (
                  <td key={col} className="py-sm px-md whitespace-nowrap">
                    {formatReportCell(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
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
    <div className="flex flex-col w-full gap-lg pb-xl max-w-7xl mx-auto">
      <div className="flex flex-wrap justify-end gap-sm">
        <button
          className="px-md py-sm rounded-lg bg-primary text-on-primary font-label-caps disabled:opacity-40"
          disabled={loading || !canView}
          onClick={() => void loadReport()}
          type="button"
        >
          Générer
        </button>
        {canExport &&
          EXPORT_FORMATS.map((fmt) => (
            <button
              key={fmt}
              className="px-md py-sm rounded-lg bg-surface-container-high font-label-caps disabled:opacity-40"
              disabled={busyExport || loading}
              onClick={() => void handleExport(fmt)}
              type="button"
            >
              {REPORT_EXPORT_LABELS[fmt]}
            </button>
          ))}
      </div>

      <div
        className="bg-surface-container-low rounded-xl p-md flex flex-wrap gap-md items-end"
        data-testid="reports-filters"
      >
        <label className="flex flex-col gap-xs font-body-sm">
          Type de rapport
          <select
            aria-label="Type de rapport"
            className="bg-surface rounded-lg py-sm px-md min-w-[180px]"
            onChange={(e) => {
              setType(e.target.value as ReportType);
              setReport(null);
              setLoadedOnce(false);
            }}
            value={type}
          >
            {REPORT_TYPES.map((t) => (
              <option key={t} value={t}>
                {REPORT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>

        {supportsClassFilter(type) && (
          <label className="flex flex-col gap-xs font-body-sm">
            Classe
            <select
              aria-label="Filtrer par classe"
              className="bg-surface rounded-lg py-sm px-md min-w-[180px]"
              onChange={(e) => setClassGroupId(e.target.value)}
              value={classGroupId}
            >
              <option value="">Toutes</option>
              {classes.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {supportsDateFilter(type) && (
          <>
            <label className="flex flex-col gap-xs font-body-sm">
              Du
              <input
                aria-label="Date de début"
                className="bg-surface rounded-lg py-sm px-md"
                onChange={(e) => setDateFrom(e.target.value)}
                type="date"
                value={dateFrom}
              />
            </label>
            <label className="flex flex-col gap-xs font-body-sm">
              Au
              <input
                aria-label="Date de fin"
                className="bg-surface rounded-lg py-sm px-md"
                onChange={(e) => setDateTo(e.target.value)}
                type="date"
                value={dateTo}
              />
            </label>
          </>
        )}
      </div>

      {notice && (
        <div
          className="rounded-lg bg-secondary-container text-on-secondary-container px-md py-sm"
          role="status"
        >
          {notice}
        </div>
      )}
      {error && (
        <div
          className="rounded-lg bg-error-container text-on-error-container px-md py-sm"
          data-testid="reports-error"
          role="alert"
        >
          {error}
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
        <p className="font-body-md text-on-surface-variant" data-testid="reports-empty">
          {loadedOnce
            ? "Aucune donnée."
            : "Choisissez un type, des filtres optionnels, puis cliquez sur Générer."}
        </p>
      )}

      {!loading && report && (
        <>
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md"
            data-testid="reports-summary"
          >
            {kpis.map((kpi) => (
              <div
                key={kpi.key}
                className="bg-surface-container-lowest rounded-xl p-lg shadow-sm"
                data-testid={`report-kpi-${kpi.key}`}
              >
                <div className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                  {kpi.label}
                </div>
                <div className="ui-page-title text-[1.25rem] mt-sm">{kpi.value}</div>
              </div>
            ))}
          </div>

          {rowsTruncated && (
            <p className="font-body-sm text-on-surface-variant">
              Affichage de {rowsShown.toLocaleString("fr-FR")} lignes sur{" "}
              {rowsTotal.toLocaleString("fr-FR")} — affinez les filtres pour un détail
              complet. Les KPI et le découpage restent calculés sur l’ensemble.
            </p>
          )}

          {!!report.by_subject?.length && (
            <BreakdownTable rows={report.by_subject} title="Par matière" />
          )}
          {!report.by_subject?.length && !!report.by_class?.length && (
            <BreakdownTable rows={report.by_class} title="Par classe" />
          )}

          <div className="ui-table-shell" data-testid="reports-rows">
            <div className="px-lg pt-lg pb-md flex flex-wrap items-center gap-sm border-b border-outline-variant/15">
              <h2 className="font-headline-md text-headline-md">
                Lignes ({report.rows.length}
                {rowsTruncated ? ` / ${rowsTotal}` : ""})
              </h2>
              <div className="ml-auto shrink-0">
                <DataTableRefreshButton
                  loading={loading}
                  onRefresh={() => void loadReport()}
                />
              </div>
            </div>
            {reportTableRows.length === 0 ? (
              <p className="p-lg font-body-md text-on-surface-variant">Aucune ligne.</p>
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
                          <th key={col} className="py-sm px-md whitespace-nowrap">
                            {columnLabel(col)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="font-body-sm text-body-sm">
                      {reportTable.pageRows.map((entry, index) => (
                        <tr className={tableRowClass(index)} key={entry.id}>
                          <DataTableSelectCell
                            checked={reportTable.selectedIds.has(entry.id)}
                            label={`Ligne ${entry.id}`}
                            onChange={() => reportTable.toggleOne(entry.id)}
                          />
                          {columns.map((col) => (
                            <td key={col} className="py-sm px-md whitespace-nowrap">
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
          </div>
        </>
      )}
    </div>
  );
}
