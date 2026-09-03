import type { AcademicYear, ClassGroup } from "@/shared/types/academic.types";
import type { Student } from "@/shared/types/student.types";
import { studentFullName } from "@/shared/types/student.types";

export type DisciplinaryRecordType =
  | "INCIDENT"
  | "WARNING"
  | "SANCTION"
  | "EXCLUSION"
  | "DISCIPLINARY_COUNCIL";

export type DisciplinaryRecordStatus = "RECORDED" | "VALIDATED" | "CANCELLED";

export interface DisciplinaryRecord {
  id: number;
  institution_id: number;
  student_id: number;
  academic_year_id: number;
  class_group_id: number | null;
  type: DisciplinaryRecordType;
  title: string;
  description: string | null;
  occurred_at: string;
  location: string | null;
  sanction_type: string | null;
  exclusion_start: string | null;
  exclusion_end: string | null;
  council_date: string | null;
  council_decision: string | null;
  status: DisciplinaryRecordStatus;
  validated_at: string | null;
  validated_by: number | null;
  recorded_by: number | null;
  student?: Student | null;
  class_group?: ClassGroup | { id: number; name: string } | null;
  academic_year?: AcademicYear | { id: number; name: string } | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export const DISCIPLINE_TYPE_LABELS: Record<DisciplinaryRecordType, string> = {
  INCIDENT: "Incident",
  WARNING: "Avertissement",
  SANCTION: "Sanction",
  EXCLUSION: "Exclusion",
  DISCIPLINARY_COUNCIL: "Conseil de discipline",
};

export const DISCIPLINE_STATUS_LABELS: Record<DisciplinaryRecordStatus, string> = {
  RECORDED: "Enregistré",
  VALIDATED: "Validé",
  CANCELLED: "Annulé",
};

export function canEditDiscipline(status: DisciplinaryRecordStatus): boolean {
  return status === "RECORDED";
}

export function canValidateDiscipline(status: DisciplinaryRecordStatus): boolean {
  return status === "RECORDED";
}

export function canCancelDiscipline(status: DisciplinaryRecordStatus): boolean {
  return status === "RECORDED" || status === "VALIDATED";
}

export function canDeleteDiscipline(status: DisciplinaryRecordStatus): boolean {
  return status !== "VALIDATED";
}

export function filterDisciplineRecords(
  items: DisciplinaryRecord[],
  filters: {
    search?: string;
    type?: string;
    status?: string;
    classGroupId?: string;
    yearId?: string;
    studentId?: string;
  }
): DisciplinaryRecord[] {
  const q = filters.search?.trim().toLowerCase() ?? "";
  return items.filter((row) => {
    if (filters.type && row.type !== filters.type) return false;
    if (filters.status && row.status !== filters.status) return false;
    if (filters.classGroupId && String(row.class_group_id ?? "") !== filters.classGroupId) {
      return false;
    }
    if (filters.yearId && String(row.academic_year_id) !== filters.yearId) return false;
    if (filters.studentId && String(row.student_id) !== filters.studentId) return false;
    if (!q) return true;
    const name = row.student ? studentFullName(row.student) : "";
    return `${row.title} ${name} ${row.location ?? ""}`.toLowerCase().includes(q);
  });
}

export function summarizeDiscipline(items: DisciplinaryRecord[]): {
  total: number;
  recorded: number;
  validated: number;
  cancelled: number;
} {
  const summary = { total: items.length, recorded: 0, validated: 0, cancelled: 0 };
  for (const row of items) {
    if (row.status === "RECORDED") summary.recorded += 1;
    else if (row.status === "VALIDATED") summary.validated += 1;
    else if (row.status === "CANCELLED") summary.cancelled += 1;
  }
  return summary;
}
