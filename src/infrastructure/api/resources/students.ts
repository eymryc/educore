import { api, apiRequest } from "@/infrastructure/api/client";
import { emptyPaginationMeta } from "@/shared/types/api.types";
import type {
  Student,
  StudentDocumentMeta,
  StudentFullDossier,
  StudentListResult,
} from "@/shared/types/student.types";

export type StudentListQuery = {
  search?: string;
  status?: string;
  level_id?: number | string;
  class_group_id?: number | string;
  page?: number | string;
  per_page?: number | string;
};

export function listStudents(): Promise<Student[]> {
  return api.get<Student[]>("/students");
}

export async function listStudentsPage(query: StudentListQuery): Promise<StudentListResult> {
  const result = await api.getWithMeta<Student[]>("/students", query);
  return {
    data: result.data ?? [],
    meta: result.meta ?? emptyPaginationMeta(),
  };
}

export function getStudent(id: number | string): Promise<Student> {
  return api.get<Student>(`/students/${id}`);
}

export function getStudentFull(id: number | string): Promise<StudentFullDossier> {
  return api.get<StudentFullDossier>(`/students/${id}/full`);
}

export function createStudent(payload: Record<string, unknown>): Promise<Student> {
  return api.post<Student>("/students", payload);
}

export function updateStudent(
  id: number | string,
  payload: Record<string, unknown>
): Promise<Student> {
  return api.put<Student>(`/students/${id}`, payload);
}

export function deleteStudent(id: number | string): Promise<null> {
  return api.delete<null>(`/students/${id}`);
}

export function uploadStudentPhoto(id: number | string, file: File): Promise<Student> {
  const body = new FormData();
  body.append("photo", file);
  return apiRequest<Student>(`/students/${id}/photo`, {
    method: "POST",
    body,
  });
}

export function uploadStudentDocument(
  id: number | string,
  file: File
): Promise<StudentDocumentMeta> {
  const body = new FormData();
  body.append("document", file);
  return apiRequest<StudentDocumentMeta>(`/students/${id}/documents`, {
    method: "POST",
    body,
  });
}
