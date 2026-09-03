import { api } from "@/infrastructure/api/client";
import type {
  ClassRankings,
  Grade,
  GradingSetting,
  StudentGradeSummary,
} from "@/shared/types/grades.types";

export type GradeListQuery = {
  assessment_id?: number | string;
  student_id?: number | string;
};

export function listGrades(query?: GradeListQuery): Promise<Grade[]> {
  return api.get<Grade[]>("/grades", query);
}

export function getGrade(id: number | string): Promise<Grade> {
  return api.get<Grade>(`/grades/${id}`);
}

export function createGrade(payload: Record<string, unknown>): Promise<Grade> {
  return api.post<Grade>("/grades", payload);
}

export function updateGrade(
  id: number | string,
  payload: Record<string, unknown>
): Promise<Grade> {
  return api.put<Grade>(`/grades/${id}`, payload);
}

export function deleteGrade(id: number | string): Promise<null> {
  return api.delete<null>(`/grades/${id}`);
}

export function validateGrade(id: number | string): Promise<Grade> {
  return api.post<Grade>(`/grades/${id}/validate`);
}

export function getGradingSettings(): Promise<GradingSetting> {
  return api.get<GradingSetting>("/grading-settings");
}

export function updateGradingSettings(
  payload: Record<string, unknown>
): Promise<GradingSetting> {
  return api.put<GradingSetting>("/grading-settings", payload);
}

export function getStudentGradeSummary(
  studentId: number | string,
  academicPeriodId: number | string
): Promise<StudentGradeSummary> {
  return api.get<StudentGradeSummary>(`/students/${studentId}/grade-summary`, {
    academic_period_id: academicPeriodId,
  });
}

export function getClassRankings(
  classGroupId: number | string,
  academicPeriodId: number | string
): Promise<ClassRankings> {
  return api.get<ClassRankings>(`/class-groups/${classGroupId}/rankings`, {
    academic_period_id: academicPeriodId,
  });
}
