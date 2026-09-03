import { api } from "@/infrastructure/api/client";
import type {
  Teacher,
  TeacherAssignment,
  TeacherHistory,
} from "@/shared/types/teacher.types";

export function listTeachers(): Promise<Teacher[]> {
  return api.get<Teacher[]>("/teachers");
}

export function getTeacher(id: number | string): Promise<Teacher> {
  return api.get<Teacher>(`/teachers/${id}`);
}

export function createTeacher(payload: Record<string, unknown>): Promise<Teacher> {
  return api.post<Teacher>("/teachers", payload);
}

export function updateTeacher(
  id: number | string,
  payload: Record<string, unknown>
): Promise<Teacher> {
  return api.put<Teacher>(`/teachers/${id}`, payload);
}

export function deleteTeacher(id: number | string): Promise<null> {
  return api.delete<null>(`/teachers/${id}`);
}

export function listTeacherAssignments(id: number | string): Promise<TeacherAssignment[]> {
  return api.get<TeacherAssignment[]>(`/teachers/${id}/assignments`);
}

export function createTeacherAssignment(
  id: number | string,
  payload: { class_group_id: number; subject_id: number }
): Promise<TeacherAssignment> {
  return api.post<TeacherAssignment>(`/teachers/${id}/assignments`, payload);
}

export function deleteTeacherAssignment(assignmentId: number | string): Promise<null> {
  return api.delete<null>(`/teacher-subjects/${assignmentId}`);
}

export function listTeacherHistories(id: number | string): Promise<TeacherHistory[]> {
  return api.get<TeacherHistory[]>(`/teachers/${id}/histories`);
}
