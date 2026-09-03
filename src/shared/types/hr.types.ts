export type HrJobPostingStatus = "ouvert" | "cloture";

export type HrApplicationStatus =
  | "applied"
  | "screening"
  | "interview"
  | "offer"
  | "hired"
  | "rejected";

export interface HrDepartmentRef {
  id: number;
  institution_id?: number;
  name: string;
  code?: string | null;
  description?: string | null;
}

export interface HrJobPosting {
  id: number;
  institution_id: number;
  department_id: number | null;
  title: string;
  description: string;
  application_deadline: string;
  status: HrJobPostingStatus;
  department?: HrDepartmentRef | null;
  applications_count?: number;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface HrApplication {
  id: number;
  institution_id: number;
  hr_job_posting_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  applied_position: string;
  status: HrApplicationStatus;
  applied_at: string | null;
  notes: string | null;
  job_posting?: HrJobPosting | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export const HR_JOB_STATUS_LABELS: Record<HrJobPostingStatus, string> = {
  ouvert: "Ouvert",
  cloture: "Clôturé",
};

export const HR_APPLICATION_STATUS_LABELS: Record<HrApplicationStatus, string> = {
  applied: "Candidature",
  screening: "Présélection",
  interview: "Entretien",
  offer: "Offre",
  hired: "Embauché",
  rejected: "Rejeté",
};

/** Colonnes kanban actives (hors rejet). */
export const HR_APPLICATION_PIPELINE: HrApplicationStatus[] = [
  "applied",
  "screening",
  "interview",
  "offer",
  "hired",
];

export function hrApplicantName(
  row: Pick<HrApplication, "first_name" | "last_name">
): string {
  return `${row.first_name} ${row.last_name}`.trim();
}

export function canAdvanceHrApplication(status: HrApplicationStatus): boolean {
  return status !== "hired" && status !== "rejected";
}

export function canRejectHrApplication(status: HrApplicationStatus): boolean {
  return status !== "hired" && status !== "rejected";
}

export function groupApplicationsByStatus(
  rows: HrApplication[]
): Record<HrApplicationStatus, HrApplication[]> {
  const groups: Record<HrApplicationStatus, HrApplication[]> = {
    applied: [],
    screening: [],
    interview: [],
    offer: [],
    hired: [],
    rejected: [],
  };
  for (const row of rows) {
    const key = groups[row.status] ? row.status : "applied";
    groups[key].push(row);
  }
  return groups;
}

export function jobPostingToForm(row: HrJobPosting): Record<string, string | boolean> {
  return {
    title: row.title ?? "",
    department_id: row.department_id != null ? String(row.department_id) : "",
    description: row.description ?? "",
    application_deadline: row.application_deadline?.slice(0, 10) ?? "",
    status: row.status ?? "ouvert",
  };
}

export function hrApplicationToForm(
  row: HrApplication
): Record<string, string | boolean> {
  return {
    hr_job_posting_id: String(row.hr_job_posting_id ?? ""),
    first_name: row.first_name ?? "",
    last_name: row.last_name ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    applied_position: row.applied_position ?? "",
    applied_at: row.applied_at?.slice(0, 10) ?? "",
    notes: row.notes ?? "",
  };
}

export type StaffMemberStatus = "active" | "inactive" | "suspended" | "on_leave";
export type StaffLeaveType = "annuel" | "maladie" | "maternite" | "exceptionnel";
export type StaffLeaveStatus = "pending" | "approved" | "rejected" | "cancelled";
export type StaffAttendanceStatus = "present" | "absent" | "late" | "justified";
export type StaffPayrollStatus = "draft" | "processed" | "paid";
export type StaffEvaluationStatus = "draft" | "finalized";

export interface StaffMember {
  id: number;
  institution_id: number;
  department_id: number | null;
  user_id: number | null;
  employee_number: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  job_title: string;
  hired_at: string | null;
  status: StaffMemberStatus;
  department?: HrDepartmentRef | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface StaffLeave {
  id: number;
  institution_id: number;
  staff_member_id: number;
  leave_type: StaffLeaveType;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: StaffLeaveStatus;
  approved_by: number | null;
  approved_at: string | null;
  duration_days?: number | null;
  staff_member?: StaffMember | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface StaffAttendance {
  id: number;
  institution_id: number;
  staff_member_id: number;
  attendance_date: string;
  status: StaffAttendanceStatus;
  notes: string | null;
  recorded_by: number | null;
  staff_member?: StaffMember | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface StaffPayroll {
  id: number;
  institution_id: number;
  staff_member_id: number;
  period_month: number;
  period_year: number;
  base_salary: number | string;
  allowances: number | string;
  deductions: number | string;
  leave_days?: number | string | null;
  leave_deduction?: number | string | null;
  net_salary: number | string;
  status: StaffPayrollStatus;
  processed_at: string | null;
  notes: string | null;
  staff_member?: StaffMember | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface StaffEvaluation {
  id: number;
  institution_id: number;
  staff_member_id: number;
  evaluator_id: number | null;
  evaluation_date: string;
  period_label: string;
  overall_score: number | string;
  strengths: string | null;
  improvements: string | null;
  comments: string | null;
  status: StaffEvaluationStatus;
  staff_member?: StaffMember | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export const STAFF_STATUS_LABELS: Record<StaffMemberStatus, string> = {
  active: "Actif",
  inactive: "Inactif",
  suspended: "Suspendu",
  on_leave: "En congé",
};

export const STAFF_LEAVE_TYPE_LABELS: Record<StaffLeaveType, string> = {
  annuel: "Congé annuel",
  maladie: "Maladie",
  maternite: "Maternité",
  exceptionnel: "Exceptionnel",
};

export const STAFF_LEAVE_STATUS_LABELS: Record<StaffLeaveStatus, string> = {
  pending: "En attente",
  approved: "Approuvé",
  rejected: "Rejeté",
  cancelled: "Annulé",
};

export const STAFF_ATTENDANCE_STATUS_LABELS: Record<StaffAttendanceStatus, string> = {
  present: "Présent",
  absent: "Absent",
  late: "Retard",
  justified: "Justifié",
};

export const STAFF_PAYROLL_STATUS_LABELS: Record<StaffPayrollStatus, string> = {
  draft: "Brouillon",
  processed: "Traité",
  paid: "Payé",
};

export const STAFF_EVALUATION_STATUS_LABELS: Record<StaffEvaluationStatus, string> = {
  draft: "Brouillon",
  finalized: "Finalisée",
};

export function staffMemberName(
  row: Pick<StaffMember, "first_name" | "last_name"> | null | undefined
): string {
  if (!row) return "—";
  return `${row.first_name} ${row.last_name}`.trim();
}

export function departmentToForm(
  row: HrDepartmentRef
): Record<string, string | boolean> {
  return {
    name: row.name ?? "",
    code: row.code ?? "",
    description: row.description ?? "",
  };
}

export function staffMemberToForm(row: StaffMember): Record<string, string | boolean> {
  return {
    first_name: row.first_name ?? "",
    last_name: row.last_name ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    job_title: row.job_title ?? "",
    department_id: row.department_id != null ? String(row.department_id) : "",
    employee_number: row.employee_number ?? "",
    hired_at: row.hired_at?.slice(0, 10) ?? "",
    status: row.status ?? "active",
    create_portal_account: false,
  };
}

export function staffLeaveToForm(row: StaffLeave): Record<string, string | boolean> {
  return {
    staff_member_id: String(row.staff_member_id ?? ""),
    leave_type: row.leave_type ?? "annuel",
    start_date: row.start_date?.slice(0, 10) ?? "",
    end_date: row.end_date?.slice(0, 10) ?? "",
    reason: row.reason ?? "",
  };
}

export function staffAttendanceToForm(
  row: StaffAttendance
): Record<string, string | boolean> {
  return {
    staff_member_id: String(row.staff_member_id ?? ""),
    attendance_date: row.attendance_date?.slice(0, 10) ?? "",
    status: row.status ?? "present",
    notes: row.notes ?? "",
  };
}

export function staffPayrollToForm(row: StaffPayroll): Record<string, string | boolean> {
  return {
    staff_member_id: String(row.staff_member_id ?? ""),
    period_month: String(row.period_month ?? ""),
    period_year: String(row.period_year ?? ""),
    base_salary: String(row.base_salary ?? ""),
    allowances: String(row.allowances ?? "0"),
    deductions: String(row.deductions ?? "0"),
    notes: row.notes ?? "",
  };
}

export function staffEvaluationToForm(
  row: StaffEvaluation
): Record<string, string | boolean> {
  return {
    staff_member_id: String(row.staff_member_id ?? ""),
    evaluation_date: row.evaluation_date?.slice(0, 10) ?? "",
    period_label: row.period_label ?? "",
    overall_score: String(row.overall_score ?? ""),
    strengths: row.strengths ?? "",
    improvements: row.improvements ?? "",
    comments: row.comments ?? "",
    status: row.status ?? "draft",
  };
}
