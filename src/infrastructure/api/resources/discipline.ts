import { api } from "@/infrastructure/api/client";
import type { DisciplinaryRecord } from "@/shared/types/discipline.types";

export type DisciplineListQuery = {
  student_id?: number | string;
  academic_year_id?: number | string;
  type?: string;
  class_group_id?: number | string;
};

export function listDisciplineRecords(
  query?: DisciplineListQuery
): Promise<DisciplinaryRecord[]> {
  return api.get<DisciplinaryRecord[]>("/discipline-records", query);
}

export function getDisciplineRecord(id: number | string): Promise<DisciplinaryRecord> {
  return api.get<DisciplinaryRecord>(`/discipline-records/${id}`);
}

export function createDisciplineRecord(
  payload: Record<string, unknown>
): Promise<DisciplinaryRecord> {
  return api.post<DisciplinaryRecord>("/discipline-records", payload);
}

export function updateDisciplineRecord(
  id: number | string,
  payload: Record<string, unknown>
): Promise<DisciplinaryRecord> {
  return api.put<DisciplinaryRecord>(`/discipline-records/${id}`, payload);
}

export function deleteDisciplineRecord(id: number | string): Promise<null> {
  return api.delete<null>(`/discipline-records/${id}`);
}

export function validateDisciplineRecord(id: number | string): Promise<DisciplinaryRecord> {
  return api.post<DisciplinaryRecord>(`/discipline-records/${id}/validate`);
}

export function cancelDisciplineRecord(id: number | string): Promise<DisciplinaryRecord> {
  return api.post<DisciplinaryRecord>(`/discipline-records/${id}/cancel`);
}

export function listStudentDisciplineRecords(
  studentId: number | string
): Promise<DisciplinaryRecord[]> {
  return api.get<DisciplinaryRecord[]>(`/students/${studentId}/discipline-records`);
}
