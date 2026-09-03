export type StudentStatus = "active" | "inactive" | "suspended";

export interface AcademicRef {
  id: number;
  name: string;
  code?: string | null;
  level_id?: number | null;
}

export interface Student {
  id: number;
  institution_id: number;
  user_id: number | null;
  matricule: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  gender: "M" | "F";
  email: string | null;
  phone: string | null;
  address: string | null;
  level_id: number | null;
  class_group_id: number | null;
  status: StudentStatus;
  enrolled_at: string | null;
  avatar_url: string | null;
  level?: AcademicRef | null;
  class_group?: AcademicRef | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface StudentHistory {
  id: number;
  academic_year?: { id: number; name: string } | null;
  class_group?: AcademicRef | null;
  level?: AcademicRef | null;
  status?: string | null;
}

export interface StudentDocumentMeta {
  id: number;
  name: string;
  file_name: string;
  mime_type: string;
  size: number;
  url: string;
}

export interface StudentFullDossier {
  student: Student;
  class: AcademicRef | null;
  level: AcademicRef | null;
  histories: StudentHistory[];
  grades: unknown[];
  attendance: unknown[];
  report_cards: Array<{ id: number; status?: string; created_at?: string | null }>;
  payments: unknown[];
  discipline: Array<{
    id: number;
    occurred_at?: string | null;
    type?: string | null;
    title?: string | null;
    status?: string | null;
  }>;
}

export const STUDENT_STATUS_LABELS: Record<StudentStatus, string> = {
  active: "Actif",
  inactive: "Inactif",
  suspended: "Suspendu",
};

export function studentFullName(student: Pick<Student, "first_name" | "last_name">): string {
  return `${student.last_name} ${student.first_name}`.trim();
}

export function filterStudents(
  students: Student[],
  filters: {
    search?: string;
    levelId?: string;
    classGroupId?: string;
    status?: string;
  }
): Student[] {
  const q = filters.search?.trim().toLowerCase() ?? "";

  return students.filter((s) => {
    if (filters.levelId && String(s.level_id ?? "") !== filters.levelId) return false;
    if (filters.classGroupId && String(s.class_group_id ?? "") !== filters.classGroupId) {
      return false;
    }
    if (filters.status && s.status !== filters.status) return false;
    if (!q) return true;
    const haystack = `${s.first_name} ${s.last_name} ${s.matricule} ${s.email ?? ""}`.toLowerCase();
    return haystack.includes(q);
  });
}
