import type { ClassGroup } from "@/shared/types/academic.types";
import type { Student } from "@/shared/types/student.types";

export type AttendanceStatus = "PRESENT" | "ABSENT" | "JUSTIFIED" | "LATE";

export interface AttendanceRecord {
  id: number;
  institution_id: number;
  student_id: number;
  class_group_id: number;
  academic_year_id: number;
  date: string;
  status: AttendanceStatus;
  notes: string | null;
  justification: string | null;
  justified_at: string | null;
  justified_by: number | null;
  validated_at: string | null;
  validated_by: number | null;
  recorded_by: number | null;
  student?: Student | null;
  class_group?: ClassGroup | null;
}

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  PRESENT: "Présent",
  ABSENT: "Absent",
  LATE: "Retard",
  JUSTIFIED: "Justifié",
};

export function summarizeAttendance(records: AttendanceRecord[]): {
  total: number;
  present: number;
  absent: number;
  late: number;
  justified: number;
} {
  const summary = { total: records.length, present: 0, absent: 0, late: 0, justified: 0 };
  for (const r of records) {
    if (r.status === "PRESENT") summary.present += 1;
    else if (r.status === "ABSENT") summary.absent += 1;
    else if (r.status === "LATE") summary.late += 1;
    else if (r.status === "JUSTIFIED") summary.justified += 1;
  }
  return summary;
}

export function isJustifiable(status: AttendanceStatus): boolean {
  return status === "ABSENT" || status === "LATE";
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}
