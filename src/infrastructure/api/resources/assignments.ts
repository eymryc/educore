import { api } from "@/infrastructure/api/client";
import type {
  Assignment,
  AssignmentSubmission,
} from "@/shared/types/assignments.types";

export type AssignmentListQuery = {
  class_group_id?: number | string;
  subject_id?: number | string;
  status?: string;
};

export function listAssignments(query?: AssignmentListQuery): Promise<Assignment[]> {
  return api.get<Assignment[]>("/assignments", query);
}

export function getAssignment(id: number | string): Promise<Assignment> {
  return api.get<Assignment>(`/assignments/${id}`);
}

export function createAssignment(payload: Record<string, unknown>): Promise<Assignment> {
  return api.post<Assignment>("/assignments", payload);
}

export function updateAssignment(
  id: number | string,
  payload: Record<string, unknown>
): Promise<Assignment> {
  return api.put<Assignment>(`/assignments/${id}`, payload);
}

export function deleteAssignment(id: number | string): Promise<null> {
  return api.delete<null>(`/assignments/${id}`);
}

export type SubmissionListQuery = {
  assignment_id?: number | string;
  student_id?: number | string;
};

export function listSubmissions(
  query?: SubmissionListQuery
): Promise<AssignmentSubmission[]> {
  return api.get<AssignmentSubmission[]>("/submissions", query);
}

export function getSubmission(id: number | string): Promise<AssignmentSubmission> {
  return api.get<AssignmentSubmission>(`/submissions/${id}`);
}

export function submitAssignment(
  assignmentId: number | string,
  input: { comment?: string; files: File[] }
): Promise<AssignmentSubmission> {
  const body = new FormData();
  if (input.comment?.trim()) {
    body.append("comment", input.comment.trim());
  }
  for (const file of input.files) {
    body.append("files[]", file);
  }
  return api.post<AssignmentSubmission>(`/assignments/${assignmentId}/submit`, body);
}

export function gradeSubmission(
  submissionId: number | string,
  payload: { score: number; feedback?: string | null }
): Promise<AssignmentSubmission> {
  return api.post<AssignmentSubmission>(`/submissions/${submissionId}/grade`, payload);
}
