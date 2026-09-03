import type { AcademicPeriod } from "@/shared/types/academic.types";
import type { Student } from "@/shared/types/student.types";
import { studentFullName } from "@/shared/types/student.types";

export type ReportCardStatus = "draft" | "generated" | "published";

export interface ReportCardBulletinMedia {
  id: number;
  file_name: string;
  url: string;
}

export interface ReportCard {
  id: number;
  institution_id: number;
  student_id: number;
  academic_period_id: number;
  appreciation: string | null;
  status: ReportCardStatus;
  generated_at: string | null;
  published_at: string | null;
  published_by: number | null;
  created_by: number | null;
  student?: Student | null;
  academic_period?: AcademicPeriod | null;
  bulletin?: ReportCardBulletinMedia | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ReportCardAggregate {
  institution?: { name?: string };
  student?: {
    id: number;
    matricule?: string;
    first_name?: string;
    last_name?: string;
    class_name?: string | null;
    level_name?: string | null;
  };
  period?: {
    id: number;
    name?: string;
    start_date?: string | null;
    end_date?: string | null;
    academic_year?: string | null;
  };
  subjects?: Array<{
    subject_id: number;
    subject_name: string;
    coefficient: number | string;
    average: number | string | null;
  }>;
  general_average?: number | string | null;
  class_rank?: number | null;
  class_size?: number | null;
  passing_score?: number | string | null;
  scale_max?: number | string | null;
  attendance?: {
    present: number;
    absent: number;
    late: number;
    justified: number;
  };
  appreciation?: string | null;
}

export const REPORT_CARD_STATUS_LABELS: Record<ReportCardStatus, string> = {
  draft: "Brouillon",
  generated: "Généré",
  published: "Publié",
};

export function canGenerateReportCard(status: ReportCardStatus): boolean {
  return status === "draft";
}

export function canPublishReportCard(status: ReportCardStatus): boolean {
  return status === "generated";
}

export function canDownloadReportCard(card: Pick<ReportCard, "status" | "bulletin">): boolean {
  return card.status === "generated" || card.status === "published" || Boolean(card.bulletin);
}

export function filterReportCards(
  items: ReportCard[],
  filters: {
    search?: string;
    periodId?: string;
    classGroupId?: string;
    status?: string;
  }
): ReportCard[] {
  const q = filters.search?.trim().toLowerCase() ?? "";
  return items.filter((rc) => {
    if (filters.periodId && String(rc.academic_period_id) !== filters.periodId) return false;
    if (filters.status && rc.status !== filters.status) return false;
    if (
      filters.classGroupId &&
      String(rc.student?.class_group_id ?? "") !== filters.classGroupId
    ) {
      return false;
    }
    if (!q) return true;
    const name = rc.student ? studentFullName(rc.student) : "";
    const matricule = rc.student?.matricule ?? "";
    const period = rc.academic_period?.name ?? "";
    return `${name} ${matricule} ${period}`.toLowerCase().includes(q);
  });
}

export function summarizeReportCards(items: ReportCard[]): {
  total: number;
  draft: number;
  generated: number;
  published: number;
} {
  const summary = { total: items.length, draft: 0, generated: 0, published: 0 };
  for (const rc of items) {
    if (rc.status === "draft") summary.draft += 1;
    else if (rc.status === "generated") summary.generated += 1;
    else if (rc.status === "published") summary.published += 1;
  }
  return summary;
}
