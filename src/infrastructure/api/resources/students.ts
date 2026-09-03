import { api, apiRequest } from "@/infrastructure/api/client";
import type {
  Student,
  StudentDocumentMeta,
  StudentFullDossier,
} from "@/shared/types/student.types";

export function listStudents(): Promise<Student[]> {
  return api.get<Student[]>("/students");
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
