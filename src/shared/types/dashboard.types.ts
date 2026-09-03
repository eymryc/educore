export interface AdminAttendanceToday {
  present: number;
  absent: number;
  late: number;
  justified: number;
}

export interface AdminDashboardData {
  students_count: number;
  students_active: number;
  teachers_count: number;
  staff_count: number;
  guardians_count: number;
  classes_count: number;
  subjects_count: number;
  enrollments_active: number;
  invoices_unpaid: number;
  invoices_unpaid_amount: number;
  payments_this_month: number;
  attendance_today: AdminAttendanceToday;
  attendance_rate: number | null;
  discipline_open_count: number;
  library_loans_active: number;
  library_loans_overdue: number;
  assignments_due_soon: number;
  announcements_published_month: number;
}

export interface StudentDashboardData {
  linked: boolean;
  student_id?: number;
  average_grade: number | null;
  grades_count?: number;
  attendance_rate: number | null;
  assignments_pending: number;
  assignments_due_soon: number;
  unpaid_invoices?: number;
}

export interface ParentChildSummary {
  id: number;
  full_name: string;
  class: string | null;
  average_grade: number | null;
  attendance_rate: number | null;
  unpaid_invoices: number;
}

export interface ParentDashboardData {
  linked: boolean;
  children_count: number;
  children: ParentChildSummary[];
}

export interface TeacherDashboardData {
  classes_count: number;
  students_count: number;
  assignments_count: number;
  assignments_due_soon: number;
  submissions_pending_grading: number;
  attendance_to_record_today: number;
}

export function attendanceRate(attendance: AdminAttendanceToday): number | null {
  const total =
    attendance.present + attendance.absent + attendance.late + attendance.justified;
  if (total === 0) return null;
  const presentLike = attendance.present + attendance.late + attendance.justified;
  return Math.round((presentLike / total) * 1000) / 10;
}

export function attendanceTotal(attendance: AdminAttendanceToday): number {
  return attendance.present + attendance.absent + attendance.late + attendance.justified;
}

export function formatFcfa(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCompactNumber(value: number): string {
  return value.toLocaleString("fr-FR");
}

export function pctLabel(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${value.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
}
