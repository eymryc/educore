import { api } from "@/infrastructure/api/client";
import type { Assessment } from "@/shared/types/grades.types";

export type AssessmentListQuery = {
  class_group_id?: number | string;
  academic_period_id?: number | string;
  subject_id?: number | string;
};

export function listAssessments(query?: AssessmentListQuery): Promise<Assessment[]> {
  return api.get<Assessment[]>("/assessments", query);
}

export function getAssessment(id: number | string): Promise<Assessment> {
  return api.get<Assessment>(`/assessments/${id}`);
}

export function createAssessment(payload: Record<string, unknown>): Promise<Assessment> {
  return api.post<Assessment>("/assessments", payload);
}

export function updateAssessment(
  id: number | string,
  payload: Record<string, unknown>
): Promise<Assessment> {
  return api.put<Assessment>(`/assessments/${id}`, payload);
}

export function deleteAssessment(id: number | string): Promise<null> {
  return api.delete<null>(`/assessments/${id}`);
}
