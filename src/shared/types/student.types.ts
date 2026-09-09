import type { AcademicYear } from "@/shared/types/academic.types";
import type { PaginatedList } from "@/shared/types/api.types";
import type { AssignmentSubmission } from "@/shared/types/assignments.types";
import type { AttendanceRecord } from "@/shared/types/attendance.types";
import type { CanteenAccount, CanteenSpecialDiet } from "@/shared/types/canteen.types";
import type { Enrollment, ReEnrollment } from "@/shared/types/enrollment.types";
import type { Invoice, Payment } from "@/shared/types/finance.types";
import type { StudentGuardianLink } from "@/shared/types/guardian.types";
import type { Grade } from "@/shared/types/grades.types";
import type { LibraryLoan } from "@/shared/types/library.types";
import type { ReportCard } from "@/shared/types/report-cards.types";
import type { TransportSubscription } from "@/shared/types/transport.types";

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
  created_at?: string | null;
}

export interface StudentPeriodAverage {
  period: AcademicRef & { sort_order?: number | null };
  average: number | null;
}

export interface StudentAverages {
  academic_year: AcademicYear;
  scale_max: number | string;
  by_period: StudentPeriodAverage[];
  annual_average: number | null;
  mention: string | null;
  mention_label: string | null;
}

export interface StudentFullDossier {
  student: Student;
  class: AcademicRef | null;
  level: AcademicRef | null;
  histories: StudentHistory[];
  grades: Grade[];
  /** null tant qu'aucune année scolaire n'est active pour l'établissement. */
  averages: StudentAverages | null;
  attendance: AttendanceRecord[];
  attendance_summary: Partial<Record<"PRESENT" | "ABSENT" | "LATE" | "JUSTIFIED", number>>;
  report_cards: ReportCard[];
  invoices: Invoice[];
  payments: Payment[];
  discipline: Array<{
    id: number;
    occurred_at?: string | null;
    type?: string | null;
    title?: string | null;
    status?: string | null;
  }>;
  guardians: StudentGuardianLink[];
  documents: StudentDocumentMeta[];
  enrollments: Enrollment[];
  re_enrollments: ReEnrollment[];
  assignments: AssignmentSubmission[];
  library_loans: LibraryLoan[];
  canteen_account: CanteenAccount | null;
  canteen_special_diets: CanteenSpecialDiet[];
  transport_subscriptions: TransportSubscription[];
}

export const STUDENT_STATUS_LABELS: Record<StudentStatus, string> = {
  active: "Actif",
  inactive: "Inactif",
  suspended: "Suspendu",
};

export type StudentListResult = PaginatedList<Student>;

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
