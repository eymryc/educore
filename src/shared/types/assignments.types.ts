import type { NamedRef } from "@/shared/types/academic.types";
import type { Student } from "@/shared/types/student.types";

export type AssignmentStatus = "DRAFT" | "PUBLISHED" | "CLOSED";

export type SubmissionStatus = "SUBMITTED" | "GRADED" | "RETURNED" | "LATE" | "MISSING";

export interface AssignmentSubmissionFile {
  id: number;
  file_name: string;
  mime_type: string | null;
  size: number | null;
  url: string;
}

export interface AssignmentSubmission {
  id: number;
  institution_id: number;
  assignment_id: number;
  student_id: number;
  comment: string | null;
  score: number | string | null;
  feedback: string | null;
  status: SubmissionStatus | string;
  submitted_at: string | null;
  graded_at: string | null;
  graded_by: number | null;
  student?: Student | null;
  assignment?: Assignment | null;
  files?: AssignmentSubmissionFile[];
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Assignment {
  id: number;
  institution_id: number;
  academic_year_id: number;
  subject_id: number;
  class_group_id: number;
  title: string;
  description: string | null;
  instructions: string | null;
  due_at: string | null;
  max_score: number | string | null;
  status: AssignmentStatus | string;
  created_by: number | null;
  subject?: NamedRef | null;
  class_group?: NamedRef | null;
  academic_year?: NamedRef | null;
  submissions_count?: number;
  submissions?: AssignmentSubmission[];
  created_at?: string | null;
  updated_at?: string | null;
}

export const ASSIGNMENT_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publié",
  CLOSED: "Clos",
};

export const SUBMISSION_STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "Rendu",
  GRADED: "Corrigé",
  RETURNED: "À reprendre",
  LATE: "En retard",
  MISSING: "Manquant",
};

export function formatDueAt(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function isAssignmentPastDue(assignment: Pick<Assignment, "due_at">): boolean {
  if (!assignment.due_at) return false;
  const d = new Date(assignment.due_at);
  return !Number.isNaN(d.getTime()) && d.getTime() < Date.now();
}

export function dueAtToFormValue(dueAt: string | null | undefined): string {
  if (!dueAt) return "";
  const d = new Date(dueAt);
  if (Number.isNaN(d.getTime())) {
    return dueAt.length >= 16 ? dueAt.slice(0, 16) : dueAt;
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function filterAssignments(
  items: Assignment[],
  filters: {
    search?: string;
    classGroupId?: string;
    subjectId?: string;
    status?: string;
  }
): Assignment[] {
  const q = filters.search?.trim().toLowerCase() ?? "";
  return items.filter((a) => {
    if (filters.classGroupId && String(a.class_group_id) !== filters.classGroupId) {
      return false;
    }
    if (filters.subjectId && String(a.subject_id) !== filters.subjectId) {
      return false;
    }
    if (filters.status && String(a.status) !== filters.status) {
      return false;
    }
    if (!q) return true;
    const hay = [
      a.title,
      a.description,
      a.subject?.name,
      a.class_group?.name,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export function assignmentToForm(row: Assignment): Record<string, string | boolean> {
  return {
    title: row.title ?? "",
    academic_year_id: String(row.academic_year_id ?? ""),
    class_group_id: String(row.class_group_id ?? ""),
    subject_id: String(row.subject_id ?? ""),
    description: row.description ?? "",
    instructions: row.instructions ?? "",
    due_at: dueAtToFormValue(row.due_at),
    max_score: row.max_score != null ? String(row.max_score) : "20",
    status: row.status ?? "DRAFT",
  };
}
