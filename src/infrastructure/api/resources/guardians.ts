import { api } from "@/infrastructure/api/client";
import type {
  Guardian,
  GuardianRelationship,
  StudentGuardianLink,
} from "@/shared/types/guardian.types";
import type { Student } from "@/shared/types/student.types";

export function listGuardians(): Promise<Guardian[]> {
  return api.get<Guardian[]>("/guardians");
}

export function getGuardian(id: number | string): Promise<Guardian> {
  return api.get<Guardian>(`/guardians/${id}`);
}

export function createGuardian(payload: Record<string, unknown>): Promise<Guardian> {
  return api.post<Guardian>("/guardians", payload);
}

export function updateGuardian(
  id: number | string,
  payload: Record<string, unknown>
): Promise<Guardian> {
  return api.put<Guardian>(`/guardians/${id}`, payload);
}

export function deleteGuardian(id: number | string): Promise<null> {
  return api.delete<null>(`/guardians/${id}`);
}

export function listGuardianStudents(id: number | string): Promise<Student[]> {
  return api.get<Student[]>(`/guardians/${id}/students`);
}

export function attachGuardianStudent(
  id: number | string,
  payload: {
    student_id: number;
    relationship: GuardianRelationship;
    is_primary?: boolean;
  }
): Promise<StudentGuardianLink> {
  return api.post<StudentGuardianLink>(`/guardians/${id}/students`, payload);
}

export function detachGuardianStudent(
  guardianId: number | string,
  studentId: number | string
): Promise<null> {
  return api.delete<null>(`/guardians/${guardianId}/students/${studentId}`);
}

export function syncGuardianStudents(
  id: number | string,
  students: Array<{
    student_id: number;
    relationship: GuardianRelationship;
    is_primary?: boolean;
  }>
): Promise<StudentGuardianLink[]> {
  return api.post<StudentGuardianLink[]>(`/guardians/${id}/students/sync`, { students });
}
