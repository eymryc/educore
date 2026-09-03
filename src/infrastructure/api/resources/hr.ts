import { api } from "@/infrastructure/api/client";
import type {
  HrApplication,
  HrApplicationStatus,
  HrDepartmentRef,
  HrJobPosting,
  HrJobPostingStatus,
  StaffAttendance,
  StaffAttendanceStatus,
  StaffEvaluation,
  StaffEvaluationStatus,
  StaffLeave,
  StaffLeaveStatus,
  StaffMember,
  StaffPayroll,
} from "@/shared/types/hr.types";

export type HrJobPostingListQuery = {
  status?: HrJobPostingStatus | string;
};

export type HrApplicationListQuery = {
  hr_job_posting_id?: number | string;
  status?: HrApplicationStatus | string;
};

export type StaffLeaveListQuery = {
  staff_member_id?: number | string;
  status?: StaffLeaveStatus | string;
};

export type StaffAttendanceListQuery = {
  staff_member_id?: number | string;
  status?: StaffAttendanceStatus | string;
  date_from?: string;
  date_to?: string;
};

export type StaffPayrollListQuery = {
  staff_member_id?: number | string;
  period_month?: number | string;
  period_year?: number | string;
};

export type StaffEvaluationListQuery = {
  staff_member_id?: number | string;
  status?: StaffEvaluationStatus | string;
};

export function listDepartments(): Promise<HrDepartmentRef[]> {
  return api.get<HrDepartmentRef[]>("/departments");
}

export function getDepartment(id: number | string): Promise<HrDepartmentRef> {
  return api.get<HrDepartmentRef>(`/departments/${id}`);
}

export function createDepartment(
  payload: Record<string, unknown>
): Promise<HrDepartmentRef> {
  return api.post<HrDepartmentRef>("/departments", payload);
}

export function updateDepartment(
  id: number | string,
  payload: Record<string, unknown>
): Promise<HrDepartmentRef> {
  return api.put<HrDepartmentRef>(`/departments/${id}`, payload);
}

export function deleteDepartment(id: number | string): Promise<null> {
  return api.delete<null>(`/departments/${id}`);
}

export function listStaffMembers(): Promise<StaffMember[]> {
  return api.get<StaffMember[]>("/staff-members");
}

export function getStaffMember(id: number | string): Promise<StaffMember> {
  return api.get<StaffMember>(`/staff-members/${id}`);
}

export function createStaffMember(
  payload: Record<string, unknown>
): Promise<StaffMember> {
  return api.post<StaffMember>("/staff-members", payload);
}

export function updateStaffMember(
  id: number | string,
  payload: Record<string, unknown>
): Promise<StaffMember> {
  return api.put<StaffMember>(`/staff-members/${id}`, payload);
}

export function deleteStaffMember(id: number | string): Promise<null> {
  return api.delete<null>(`/staff-members/${id}`);
}

export function listHrJobPostings(
  query?: HrJobPostingListQuery
): Promise<HrJobPosting[]> {
  return api.get<HrJobPosting[]>("/hr-job-postings", query);
}

export function getHrJobPosting(id: number | string): Promise<HrJobPosting> {
  return api.get<HrJobPosting>(`/hr-job-postings/${id}`);
}

export function createHrJobPosting(
  payload: Record<string, unknown>
): Promise<HrJobPosting> {
  return api.post<HrJobPosting>("/hr-job-postings", payload);
}

export function updateHrJobPosting(
  id: number | string,
  payload: Record<string, unknown>
): Promise<HrJobPosting> {
  return api.put<HrJobPosting>(`/hr-job-postings/${id}`, payload);
}

export function deleteHrJobPosting(id: number | string): Promise<null> {
  return api.delete<null>(`/hr-job-postings/${id}`);
}

export function listHrApplications(
  query?: HrApplicationListQuery
): Promise<HrApplication[]> {
  return api.get<HrApplication[]>("/hr-applications", query);
}

export function getHrApplication(id: number | string): Promise<HrApplication> {
  return api.get<HrApplication>(`/hr-applications/${id}`);
}

export function createHrApplication(
  payload: Record<string, unknown>
): Promise<HrApplication> {
  return api.post<HrApplication>("/hr-applications", payload);
}

export function updateHrApplication(
  id: number | string,
  payload: Record<string, unknown>
): Promise<HrApplication> {
  return api.put<HrApplication>(`/hr-applications/${id}`, payload);
}

export function deleteHrApplication(id: number | string): Promise<null> {
  return api.delete<null>(`/hr-applications/${id}`);
}

export function advanceHrApplication(
  id: number | string,
  status?: HrApplicationStatus | string
): Promise<HrApplication> {
  return api.post<HrApplication>(
    `/hr-applications/${id}/advance`,
    status ? { status } : {}
  );
}

export function rejectHrApplication(id: number | string): Promise<HrApplication> {
  return api.post<HrApplication>(`/hr-applications/${id}/reject`);
}

export function listStaffLeaves(query?: StaffLeaveListQuery): Promise<StaffLeave[]> {
  return api.get<StaffLeave[]>("/staff-leaves", query);
}

export function getStaffLeave(id: number | string): Promise<StaffLeave> {
  return api.get<StaffLeave>(`/staff-leaves/${id}`);
}

export function createStaffLeave(
  payload: Record<string, unknown>
): Promise<StaffLeave> {
  return api.post<StaffLeave>("/staff-leaves", payload);
}

export function updateStaffLeave(
  id: number | string,
  payload: Record<string, unknown>
): Promise<StaffLeave> {
  return api.put<StaffLeave>(`/staff-leaves/${id}`, payload);
}

export function deleteStaffLeave(id: number | string): Promise<null> {
  return api.delete<null>(`/staff-leaves/${id}`);
}

export function approveStaffLeave(id: number | string): Promise<StaffLeave> {
  return api.post<StaffLeave>(`/staff-leaves/${id}/approve`);
}

export function rejectStaffLeave(id: number | string): Promise<StaffLeave> {
  return api.post<StaffLeave>(`/staff-leaves/${id}/reject`);
}

export function listStaffAttendance(
  query?: StaffAttendanceListQuery
): Promise<StaffAttendance[]> {
  return api.get<StaffAttendance[]>("/staff-attendance", query);
}

export function getStaffAttendance(id: number | string): Promise<StaffAttendance> {
  return api.get<StaffAttendance>(`/staff-attendance/${id}`);
}

export function createStaffAttendance(
  payload: Record<string, unknown>
): Promise<StaffAttendance> {
  return api.post<StaffAttendance>("/staff-attendance", payload);
}

export function updateStaffAttendance(
  id: number | string,
  payload: Record<string, unknown>
): Promise<StaffAttendance> {
  return api.put<StaffAttendance>(`/staff-attendance/${id}`, payload);
}

export function deleteStaffAttendance(id: number | string): Promise<null> {
  return api.delete<null>(`/staff-attendance/${id}`);
}

export function listStaffPayrolls(
  query?: StaffPayrollListQuery
): Promise<StaffPayroll[]> {
  return api.get<StaffPayroll[]>("/staff-payrolls", query);
}

export function getStaffPayroll(id: number | string): Promise<StaffPayroll> {
  return api.get<StaffPayroll>(`/staff-payrolls/${id}`);
}

export function createStaffPayroll(
  payload: Record<string, unknown>
): Promise<StaffPayroll> {
  return api.post<StaffPayroll>("/staff-payrolls", payload);
}

export function updateStaffPayroll(
  id: number | string,
  payload: Record<string, unknown>
): Promise<StaffPayroll> {
  return api.put<StaffPayroll>(`/staff-payrolls/${id}`, payload);
}

export function deleteStaffPayroll(id: number | string): Promise<null> {
  return api.delete<null>(`/staff-payrolls/${id}`);
}

export function processStaffPayroll(id: number | string): Promise<StaffPayroll> {
  return api.post<StaffPayroll>(`/staff-payrolls/${id}/process`);
}

export function listStaffEvaluations(
  query?: StaffEvaluationListQuery
): Promise<StaffEvaluation[]> {
  return api.get<StaffEvaluation[]>("/staff-evaluations", query);
}

export function getStaffEvaluation(id: number | string): Promise<StaffEvaluation> {
  return api.get<StaffEvaluation>(`/staff-evaluations/${id}`);
}

export function createStaffEvaluation(
  payload: Record<string, unknown>
): Promise<StaffEvaluation> {
  return api.post<StaffEvaluation>("/staff-evaluations", payload);
}

export function updateStaffEvaluation(
  id: number | string,
  payload: Record<string, unknown>
): Promise<StaffEvaluation> {
  return api.put<StaffEvaluation>(`/staff-evaluations/${id}`, payload);
}

export function deleteStaffEvaluation(id: number | string): Promise<null> {
  return api.delete<null>(`/staff-evaluations/${id}`);
}
