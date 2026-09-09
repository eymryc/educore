import { api } from "@/infrastructure/api/client";
import { emptyPaginationMeta, type AuthUser } from "@/shared/types/api.types";
import type {
  AccessRole,
  PermissionCatalogItem,
  UserListQuery,
  UserListResult,
} from "@/shared/types/identity.types";

export type CreateUserPayload = {
  name: string;
  email: string;
  password: string;
  roles: string[];
};

export type UpdateUserPayload = {
  name?: string;
  email?: string;
  password?: string;
  roles?: string[];
};

export async function listUsers(query?: UserListQuery): Promise<UserListResult> {
  const result = await api.getWithMeta<AuthUser[]>("/users", query);
  return {
    data: result.data ?? [],
    meta: result.meta ?? emptyPaginationMeta(),
  };
}

export function getUser(id: number | string): Promise<AuthUser> {
  return api.get<AuthUser>(`/users/${id}`);
}

export function createUser(payload: CreateUserPayload): Promise<AuthUser> {
  return api.post<AuthUser>("/users", payload);
}

export function updateUser(id: number | string, payload: UpdateUserPayload): Promise<AuthUser> {
  return api.put<AuthUser>(`/users/${id}`, payload);
}

export function deleteUser(id: number | string): Promise<null> {
  return api.delete<null>(`/users/${id}`);
}

export function listRoles(): Promise<AccessRole[]> {
  return api.get<AccessRole[]>("/roles");
}

export function listPermissions(): Promise<PermissionCatalogItem[]> {
  return api.get<PermissionCatalogItem[]>("/permissions");
}

export function updateRolePermissions(
  id: number | string,
  permissions: string[]
): Promise<AccessRole> {
  return api.put<AccessRole>(`/roles/${id}`, { permissions });
}
