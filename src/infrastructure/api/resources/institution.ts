import { api } from "@/infrastructure/api/client";
import type {
  Building,
  Campus,
  Institution,
  InstitutionRoom,
  InstitutionUpdatePayload,
} from "@/shared/types/institution.types";

export function getInstitution(): Promise<Institution> {
  return api.get<Institution>("/institution");
}

export function updateInstitution(
  payload: InstitutionUpdatePayload
): Promise<Institution> {
  return api.put<Institution>("/institution", payload);
}

/** Same payload as institution (API mirrors GET/PUT /settings). */
export function getSettings(): Promise<Institution> {
  return api.get<Institution>("/settings");
}

export function updateSettings(
  payload: InstitutionUpdatePayload
): Promise<Institution> {
  return api.put<Institution>("/settings", payload);
}

export function listCampuses(): Promise<Campus[]> {
  return api.get<Campus[]>("/campuses");
}

export function getCampus(id: number | string): Promise<Campus> {
  return api.get<Campus>(`/campuses/${id}`);
}

export function createCampus(payload: Record<string, unknown>): Promise<Campus> {
  return api.post<Campus>("/campuses", payload);
}

export function updateCampus(
  id: number | string,
  payload: Record<string, unknown>
): Promise<Campus> {
  return api.put<Campus>(`/campuses/${id}`, payload);
}

export function deleteCampus(id: number | string): Promise<null> {
  return api.delete<null>(`/campuses/${id}`);
}

export function listBuildings(): Promise<Building[]> {
  return api.get<Building[]>("/buildings");
}

export function getBuilding(id: number | string): Promise<Building> {
  return api.get<Building>(`/buildings/${id}`);
}

export function createBuilding(payload: Record<string, unknown>): Promise<Building> {
  return api.post<Building>("/buildings", payload);
}

export function updateBuilding(
  id: number | string,
  payload: Record<string, unknown>
): Promise<Building> {
  return api.put<Building>(`/buildings/${id}`, payload);
}

export function deleteBuilding(id: number | string): Promise<null> {
  return api.delete<null>(`/buildings/${id}`);
}

export function listInstitutionRooms(): Promise<InstitutionRoom[]> {
  return api.get<InstitutionRoom[]>("/rooms");
}

export function getInstitutionRoom(id: number | string): Promise<InstitutionRoom> {
  return api.get<InstitutionRoom>(`/rooms/${id}`);
}

export function createInstitutionRoom(
  payload: Record<string, unknown>
): Promise<InstitutionRoom> {
  return api.post<InstitutionRoom>("/rooms", payload);
}

export function updateInstitutionRoom(
  id: number | string,
  payload: Record<string, unknown>
): Promise<InstitutionRoom> {
  return api.put<InstitutionRoom>(`/rooms/${id}`, payload);
}

export function deleteInstitutionRoom(id: number | string): Promise<null> {
  return api.delete<null>(`/rooms/${id}`);
}
