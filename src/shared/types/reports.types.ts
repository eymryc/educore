export type ReportType = "academic" | "attendance" | "finance" | "students";

export type ReportExportFormat = "pdf" | "csv" | "xlsx";

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  academic: "Académique",
  attendance: "Présences",
  finance: "Finances",
  students: "Élèves",
};

export const REPORT_EXPORT_LABELS: Record<ReportExportFormat, string> = {
  pdf: "PDF",
  csv: "CSV",
  xlsx: "Excel",
};

const SUMMARY_LABELS: Record<string, string> = {
  assessments_count: "Évaluations",
  grades_count: "Notes",
  average_score: "Moyenne",
  validated_grades: "Notes validées",
  records_count: "Enregistrements",
  present: "Présents",
  absent: "Absents",
  late: "Retards",
  justified: "Justifiés",
  attendance_rate: "Taux de présence (%)",
  invoices_count: "Factures",
  total_invoiced: "Total facturé",
  total_paid_on_invoices: "Total encaissé",
  outstanding_amount: "Reste à payer",
  payments_count: "Paiements",
  payments_total: "Montant paiements",
  students_count: "Élèves",
  active_students: "Élèves actifs",
  rows_shown: "Lignes affichées",
  rows_total: "Lignes totales",
  pdf_rows_capped: "Lignes PDF (plafond)",
  pdf_rows_total: "Lignes PDF (total)",
};

const COLUMN_LABELS: Record<string, string> = {
  subject: "Matière",
  grades_count: "Notes",
  average_score: "Moyenne",
  class: "Classe",
  count: "Effectif",
  student: "Élève",
  assessment: "Évaluation",
  score: "Note",
  validated: "Validée",
  date: "Date",
  status: "Statut",
  paid_at: "Payé le",
  student_id: "Élève #",
  amount: "Montant",
  provider: "Moyen",
  reference: "Référence",
  matricule: "Matricule",
  full_name: "Nom",
  level: "Niveau",
  email: "E-mail",
};

export type ReportQuery = {
  class_group_id?: number | string;
  date_from?: string;
  date_to?: string;
};

export type ReportSummary = Record<string, string | number | boolean | null | undefined>;

export type ReportRow = Record<string, string | number | boolean | null | undefined>;

export interface ReportPayload {
  type: ReportType;
  summary: ReportSummary;
  rows: ReportRow[];
  by_subject?: ReportRow[];
  by_class?: ReportRow[];
}

export function supportsClassFilter(type: ReportType): boolean {
  return type === "academic" || type === "attendance" || type === "students";
}

export function supportsDateFilter(type: ReportType): boolean {
  return type === "academic" || type === "attendance" || type === "finance";
}

export function summaryLabel(key: string): string {
  return SUMMARY_LABELS[key] ?? key.replace(/_/g, " ");
}

export function columnLabel(key: string): string {
  return COLUMN_LABELS[key] ?? key.replace(/_/g, " ");
}

export function summaryEntries(summary: ReportSummary | null | undefined): Array<{
  key: string;
  label: string;
  value: string;
}> {
  if (!summary) return [];
  const skip = new Set(["rows_shown", "rows_total", "pdf_rows_capped", "pdf_rows_total"]);
  return Object.entries(summary)
    .filter(([key]) => !skip.has(key))
    .map(([key, raw]) => ({
      key,
      label: summaryLabel(key),
      value: formatReportCell(raw),
    }));
}

export function formatReportCell(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Oui" : "Non";
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? value.toLocaleString("fr-FR")
      : value.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
  }
  return String(value);
}

export function rowColumns(rows: ReportRow[]): string[] {
  if (!rows.length) return [];
  const keys = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) keys.add(key);
  }
  return Array.from(keys);
}

export function defaultExportFilename(
  type: ReportType,
  format: ReportExportFormat
): string {
  return `report-${type}.${format}`;
}
