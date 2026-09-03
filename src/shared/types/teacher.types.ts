export type TeacherStatus = "active" | "inactive" | "suspended" | "on_leave";

export interface SubjectRef {
  id: number;
  name: string;
  code?: string | null;
}

export interface Teacher {
  id: number;
  institution_id: number;
  user_id: number | null;
  employee_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  main_subject_id: number | null;
  main_subject?: SubjectRef | null;
  grade_title: string | null;
  hired_at: string | null;
  status: TeacherStatus;
  assignments_count?: number;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface TeacherAssignment {
  id: number;
  institution_id: number;
  teacher_id: number;
  class_group_id: number;
  subject_id: number;
  class_group?: { id: number; name: string } | null;
  subject?: SubjectRef | null;
}

export interface TeacherHistory {
  id: number;
  event_type: string;
  notes: string | null;
  metadata?: Record<string, unknown> | null;
  recorded_at: string | null;
}

export const TEACHER_STATUS_LABELS: Record<TeacherStatus, string> = {
  active: "Actif",
  inactive: "Inactif",
  suspended: "Suspendu",
  on_leave: "En congé",
};

export function teacherFullName(teacher: Pick<Teacher, "first_name" | "last_name">): string {
  return `${teacher.last_name} ${teacher.first_name}`.trim();
}

export function filterTeachers(
  teachers: Teacher[],
  filters: { search?: string; status?: string; subjectId?: string }
): Teacher[] {
  const q = filters.search?.trim().toLowerCase() ?? "";
  return teachers.filter((t) => {
    if (filters.status && t.status !== filters.status) return false;
    if (filters.subjectId && String(t.main_subject_id ?? "") !== filters.subjectId) return false;
    if (!q) return true;
    const haystack =
      `${t.first_name} ${t.last_name} ${t.email} ${t.employee_number} ${t.main_subject?.name ?? ""}`.toLowerCase();
    return haystack.includes(q);
  });
}
