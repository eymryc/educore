import { api } from "@/infrastructure/api/client";
import type { AttendanceRecord, AttendanceStatus } from "@/shared/types/attendance.types";

export type AttendanceListQuery = {
  class_group_id?: number | string;
  date?: string;
};

export function listAttendance(query?: AttendanceListQuery): Promise<AttendanceRecord[]> {
  return api.get<AttendanceRecord[]>("/attendance", query);
}

export function getAttendance(id: number | string): Promise<AttendanceRecord> {
  return api.get<AttendanceRecord>(`/attendance/${id}`);
}

export function createAttendance(payload: Record<string, unknown>): Promise<AttendanceRecord> {
  return api.post<AttendanceRecord>("/attendance", payload);
}

export function updateAttendance(
  id: number | string,
  payload: { status?: AttendanceStatus; notes?: string | null }
): Promise<AttendanceRecord> {
  return api.put<AttendanceRecord>(`/attendance/${id}`, payload);
}

export function deleteAttendance(id: number | string): Promise<null> {
  return api.delete<null>(`/attendance/${id}`);
}

export function justifyAttendance(
  id: number | string,
  justification: string
): Promise<AttendanceRecord> {
  return api.post<AttendanceRecord>(`/attendance/${id}/justify`, { justification });
}

export function validateAttendance(id: number | string): Promise<AttendanceRecord> {
  return api.post<AttendanceRecord>(`/attendance/${id}/validate`);
}
