import { api } from "@/infrastructure/api/client";
import type {
  AcademicHoliday,
  AcademicPeriod,
  AcademicYear,
  ClassGroup,
  ClassMemberUser,
  ClassSubject,
  Level,
  NamedRef,
  Room,
  Series,
  Subject,
  TimetableSlot,
} from "@/shared/types/academic.types";
import type { AcademicRef } from "@/shared/types/student.types";
import type { SubjectRef } from "@/shared/types/teacher.types";

export function listLevels(): Promise<AcademicRef[]> {
  return api.get<AcademicRef[]>("/levels");
}

export function getLevel(id: number | string): Promise<Level> {
  return api.get<Level>(`/levels/${id}`);
}

export function createLevel(payload: Record<string, unknown>): Promise<Level> {
  return api.post<Level>("/levels", payload);
}

export function updateLevel(
  id: number | string,
  payload: Record<string, unknown>
): Promise<Level> {
  return api.put<Level>(`/levels/${id}`, payload);
}

export function deleteLevel(id: number | string): Promise<null> {
  return api.delete<null>(`/levels/${id}`);
}

export function listClassGroups(): Promise<ClassGroup[]> {
  return api.get<ClassGroup[]>("/class-groups");
}

export function getClassGroup(id: number | string): Promise<ClassGroup> {
  return api.get<ClassGroup>(`/class-groups/${id}`);
}

export function createClassGroup(payload: Record<string, unknown>): Promise<ClassGroup> {
  return api.post<ClassGroup>("/class-groups", payload);
}

export function updateClassGroup(
  id: number | string,
  payload: Record<string, unknown>
): Promise<ClassGroup> {
  return api.put<ClassGroup>(`/class-groups/${id}`, payload);
}

export function deleteClassGroup(id: number | string): Promise<null> {
  return api.delete<null>(`/class-groups/${id}`);
}

export function listClassGroupStudents(id: number | string): Promise<ClassMemberUser[]> {
  return api.get<ClassMemberUser[]>(`/class-groups/${id}/students`);
}

export function attachClassGroupStudent(
  id: number | string,
  studentUserId: number
): Promise<unknown> {
  return api.post(`/class-groups/${id}/students`, { student_id: studentUserId });
}

export function detachClassGroupStudent(
  classGroupId: number | string,
  studentUserId: number | string
): Promise<null> {
  return api.delete<null>(`/class-groups/${classGroupId}/students/${studentUserId}`);
}

export function syncClassGroupStudents(
  id: number | string,
  studentIds: number[]
): Promise<unknown> {
  return api.post(`/class-groups/${id}/students/sync`, { student_ids: studentIds });
}

export function listSubjects(): Promise<Subject[]> {
  return api.get<Subject[]>("/subjects");
}

export function getSubject(id: number | string): Promise<Subject> {
  return api.get<Subject>(`/subjects/${id}`);
}

export function createSubject(payload: Record<string, unknown>): Promise<Subject> {
  return api.post<Subject>("/subjects", payload);
}

export function updateSubject(
  id: number | string,
  payload: Record<string, unknown>
): Promise<Subject> {
  return api.put<Subject>(`/subjects/${id}`, payload);
}

export function deleteSubject(id: number | string): Promise<null> {
  return api.delete<null>(`/subjects/${id}`);
}

export function listTimetableSlots(): Promise<TimetableSlot[]> {
  return api.get<TimetableSlot[]>("/timetable-slots");
}

export function getTimetableSlot(id: number | string): Promise<TimetableSlot> {
  return api.get<TimetableSlot>(`/timetable-slots/${id}`);
}

export function createTimetableSlot(payload: Record<string, unknown>): Promise<TimetableSlot> {
  return api.post<TimetableSlot>("/timetable-slots", payload);
}

export function updateTimetableSlot(
  id: number | string,
  payload: Record<string, unknown>
): Promise<TimetableSlot> {
  return api.put<TimetableSlot>(`/timetable-slots/${id}`, payload);
}

export function deleteTimetableSlot(id: number | string): Promise<null> {
  return api.delete<null>(`/timetable-slots/${id}`);
}

export function listAcademicYears(): Promise<AcademicYear[]> {
  return api.get<AcademicYear[]>("/academic-years");
}

export function getAcademicYear(id: number | string): Promise<AcademicYear> {
  return api.get<AcademicYear>(`/academic-years/${id}`);
}

export function createAcademicYear(payload: Record<string, unknown>): Promise<AcademicYear> {
  return api.post<AcademicYear>("/academic-years", payload);
}

export function updateAcademicYear(
  id: number | string,
  payload: Record<string, unknown>
): Promise<AcademicYear> {
  return api.put<AcademicYear>(`/academic-years/${id}`, payload);
}

export function deleteAcademicYear(id: number | string): Promise<null> {
  return api.delete<null>(`/academic-years/${id}`);
}

export function activateAcademicYear(id: number | string): Promise<AcademicYear> {
  return api.post<AcademicYear>(`/academic-years/${id}/activate`);
}

export function closeAcademicYear(id: number | string): Promise<AcademicYear> {
  return api.post<AcademicYear>(`/academic-years/${id}/close`);
}

export function listAcademicPeriods(): Promise<AcademicPeriod[]> {
  return api.get<AcademicPeriod[]>("/academic-periods");
}

export function getAcademicPeriod(id: number | string): Promise<AcademicPeriod> {
  return api.get<AcademicPeriod>(`/academic-periods/${id}`);
}

export function createAcademicPeriod(payload: Record<string, unknown>): Promise<AcademicPeriod> {
  return api.post<AcademicPeriod>("/academic-periods", payload);
}

export function updateAcademicPeriod(
  id: number | string,
  payload: Record<string, unknown>
): Promise<AcademicPeriod> {
  return api.put<AcademicPeriod>(`/academic-periods/${id}`, payload);
}

export function deleteAcademicPeriod(id: number | string): Promise<null> {
  return api.delete<null>(`/academic-periods/${id}`);
}

export function listAcademicHolidays(): Promise<AcademicHoliday[]> {
  return api.get<AcademicHoliday[]>("/academic-holidays");
}

export function getAcademicHoliday(id: number | string): Promise<AcademicHoliday> {
  return api.get<AcademicHoliday>(`/academic-holidays/${id}`);
}

export function createAcademicHoliday(payload: Record<string, unknown>): Promise<AcademicHoliday> {
  return api.post<AcademicHoliday>("/academic-holidays", payload);
}

export function updateAcademicHoliday(
  id: number | string,
  payload: Record<string, unknown>
): Promise<AcademicHoliday> {
  return api.put<AcademicHoliday>(`/academic-holidays/${id}`, payload);
}

export function deleteAcademicHoliday(id: number | string): Promise<null> {
  return api.delete<null>(`/academic-holidays/${id}`);
}

export function listSeries(): Promise<NamedRef[]> {
  return api.get<NamedRef[]>("/series");
}

export function getSeries(id: number | string): Promise<Series> {
  return api.get<Series>(`/series/${id}`);
}

export function createSeries(payload: Record<string, unknown>): Promise<Series> {
  return api.post<Series>("/series", payload);
}

export function updateSeries(
  id: number | string,
  payload: Record<string, unknown>
): Promise<Series> {
  return api.put<Series>(`/series/${id}`, payload);
}

export function deleteSeries(id: number | string): Promise<null> {
  return api.delete<null>(`/series/${id}`);
}

export function listClassSubjects(): Promise<ClassSubject[]> {
  return api.get<ClassSubject[]>("/class-subjects");
}

export function getClassSubject(id: number | string): Promise<ClassSubject> {
  return api.get<ClassSubject>(`/class-subjects/${id}`);
}

export function createClassSubject(payload: Record<string, unknown>): Promise<ClassSubject> {
  return api.post<ClassSubject>("/class-subjects", payload);
}

export function updateClassSubject(
  id: number | string,
  payload: Record<string, unknown>
): Promise<ClassSubject> {
  return api.put<ClassSubject>(`/class-subjects/${id}`, payload);
}

export function deleteClassSubject(id: number | string): Promise<null> {
  return api.delete<null>(`/class-subjects/${id}`);
}

export function listRooms(): Promise<Room[]> {
  return api.get<Room[]>("/rooms");
}

/** Alias for older SubjectRef consumers */
export type { SubjectRef };
