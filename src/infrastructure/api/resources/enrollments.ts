import { api } from "@/infrastructure/api/client";
import type {
  Enrollment,
  EnrollmentDocument,
  ReEnrollment,
} from "@/shared/types/enrollment.types";

export function listEnrollments(): Promise<Enrollment[]> {
  return api.get<Enrollment[]>("/enrollments");
}

export function getEnrollment(id: number | string): Promise<Enrollment> {
  return api.get<Enrollment>(`/enrollments/${id}`);
}

export function createEnrollment(payload: Record<string, unknown>): Promise<Enrollment> {
  return api.post<Enrollment>("/enrollments", payload);
}

export function updateEnrollment(
  id: number | string,
  payload: Record<string, unknown>
): Promise<Enrollment> {
  return api.put<Enrollment>(`/enrollments/${id}`, payload);
}

export function deleteEnrollment(id: number | string): Promise<null> {
  return api.delete<null>(`/enrollments/${id}`);
}

export function reviewEnrollment(id: number | string): Promise<Enrollment> {
  return api.post<Enrollment>(`/enrollments/${id}/review`);
}

export function approveEnrollment(id: number | string): Promise<Enrollment> {
  return api.post<Enrollment>(`/enrollments/${id}/approve`);
}

export function markEnrollmentPayment(id: number | string): Promise<Enrollment> {
  return api.post<Enrollment>(`/enrollments/${id}/payment`);
}

export function enrollEnrollment(id: number | string): Promise<Enrollment> {
  return api.post<Enrollment>(`/enrollments/${id}/enroll`);
}

export function assignEnrollmentClass(
  id: number | string,
  classGroupId: number
): Promise<Enrollment> {
  return api.post<Enrollment>(`/enrollments/${id}/assign-class`, {
    class_group_id: classGroupId,
  });
}

export function rejectEnrollment(id: number | string): Promise<Enrollment> {
  return api.post<Enrollment>(`/enrollments/${id}/reject`);
}

export function uploadEnrollmentDocument(
  id: number | string,
  file: File
): Promise<EnrollmentDocument> {
  const body = new FormData();
  body.append("document", file);
  return api.post<EnrollmentDocument>(`/enrollments/${id}/documents`, body);
}

export function listReEnrollments(): Promise<ReEnrollment[]> {
  return api.get<ReEnrollment[]>("/re-enrollments");
}

export function getReEnrollment(id: number | string): Promise<ReEnrollment> {
  return api.get<ReEnrollment>(`/re-enrollments/${id}`);
}

export function createReEnrollment(payload: Record<string, unknown>): Promise<ReEnrollment> {
  return api.post<ReEnrollment>("/re-enrollments", payload);
}

export function updateReEnrollment(
  id: number | string,
  payload: Record<string, unknown>
): Promise<ReEnrollment> {
  return api.put<ReEnrollment>(`/re-enrollments/${id}`, payload);
}

export function deleteReEnrollment(id: number | string): Promise<null> {
  return api.delete<null>(`/re-enrollments/${id}`);
}

export function completeReEnrollment(id: number | string): Promise<ReEnrollment> {
  return api.post<ReEnrollment>(`/re-enrollments/${id}/complete`);
}
