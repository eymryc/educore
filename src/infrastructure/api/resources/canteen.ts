import { api } from "@/infrastructure/api/client";
import type {
  CanteenAccount,
  CanteenAccountStatus,
  CanteenDayOfWeek,
  CanteenDietType,
  CanteenMenu,
  CanteenSpecialDiet,
  CanteenTopup,
} from "@/shared/types/canteen.types";

export type CanteenMenuListQuery = {
  day_of_week?: CanteenDayOfWeek | string;
  is_active?: boolean | number | string;
};

export type CanteenAccountListQuery = {
  student_id?: number | string;
  status?: CanteenAccountStatus | string;
};

export type CanteenSpecialDietListQuery = {
  student_id?: number | string;
  diet_type?: CanteenDietType | string;
  is_active?: boolean | number | string;
};

export function listCanteenMenus(
  query?: CanteenMenuListQuery
): Promise<CanteenMenu[]> {
  return api.get<CanteenMenu[]>("/canteen-menus", query);
}

export function getCanteenMenu(id: number | string): Promise<CanteenMenu> {
  return api.get<CanteenMenu>(`/canteen-menus/${id}`);
}

export function createCanteenMenu(
  payload: Record<string, unknown>
): Promise<CanteenMenu> {
  return api.post<CanteenMenu>("/canteen-menus", payload);
}

export function updateCanteenMenu(
  id: number | string,
  payload: Record<string, unknown>
): Promise<CanteenMenu> {
  return api.put<CanteenMenu>(`/canteen-menus/${id}`, payload);
}

export function deleteCanteenMenu(id: number | string): Promise<null> {
  return api.delete<null>(`/canteen-menus/${id}`);
}

export function listCanteenAccounts(
  query?: CanteenAccountListQuery
): Promise<CanteenAccount[]> {
  return api.get<CanteenAccount[]>("/canteen-accounts", query);
}

export function getCanteenAccount(id: number | string): Promise<CanteenAccount> {
  return api.get<CanteenAccount>(`/canteen-accounts/${id}`);
}

export function createCanteenAccount(
  payload: Record<string, unknown>
): Promise<CanteenAccount> {
  return api.post<CanteenAccount>("/canteen-accounts", payload);
}

export function updateCanteenAccount(
  id: number | string,
  payload: Record<string, unknown>
): Promise<CanteenAccount> {
  return api.put<CanteenAccount>(`/canteen-accounts/${id}`, payload);
}

export function deleteCanteenAccount(id: number | string): Promise<null> {
  return api.delete<null>(`/canteen-accounts/${id}`);
}

export function topUpCanteenAccount(
  id: number | string,
  payload: Record<string, unknown>
): Promise<CanteenTopup> {
  return api.post<CanteenTopup>(`/canteen-accounts/${id}/topups`, payload);
}

export function listCanteenSpecialDiets(
  query?: CanteenSpecialDietListQuery
): Promise<CanteenSpecialDiet[]> {
  return api.get<CanteenSpecialDiet[]>("/canteen-special-diets", query);
}

export function getCanteenSpecialDiet(
  id: number | string
): Promise<CanteenSpecialDiet> {
  return api.get<CanteenSpecialDiet>(`/canteen-special-diets/${id}`);
}

export function createCanteenSpecialDiet(
  payload: Record<string, unknown>
): Promise<CanteenSpecialDiet> {
  return api.post<CanteenSpecialDiet>("/canteen-special-diets", payload);
}

export function updateCanteenSpecialDiet(
  id: number | string,
  payload: Record<string, unknown>
): Promise<CanteenSpecialDiet> {
  return api.put<CanteenSpecialDiet>(`/canteen-special-diets/${id}`, payload);
}

export function deleteCanteenSpecialDiet(id: number | string): Promise<null> {
  return api.delete<null>(`/canteen-special-diets/${id}`);
}
