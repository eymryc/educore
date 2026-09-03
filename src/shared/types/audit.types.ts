import type { PaginationMeta } from "@/shared/types/api.types";

export interface AuditLogUser {
  id: number;
  name?: string | null;
  email?: string | null;
  roles?: string[];
}

export interface AuditLog {
  id: number;
  institution_id: number;
  user_id: number | null;
  action: string;
  resource: string | null;
  resource_id: number | string | null;
  old_values: Record<string, unknown> | unknown[] | null;
  new_values: Record<string, unknown> | unknown[] | null;
  ip_address: string | null;
  user_agent: string | null;
  user?: AuditLogUser | null;
  created_at: string | null;
}

export type AuditLogListQuery = {
  action?: string;
  resource?: string;
  user_id?: number | string;
  date_from?: string;
  date_to?: string;
  per_page?: number | string;
  page?: number | string;
};

export type AuditLogListResult = {
  data: AuditLog[];
  meta: PaginationMeta;
};

export function formatAuditTimestamp(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("fr-FR");
}

export function auditActorLabel(log: AuditLog): string {
  if (log.user?.name) return log.user.name;
  if (log.user?.email) return log.user.email;
  if (log.user_id != null) return `User #${log.user_id}`;
  return "Système";
}

export function auditActorRoles(log: AuditLog): string {
  const roles = log.user?.roles;
  if (!roles?.length) return "—";
  return roles.join(", ");
}

export function prettyJson(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function emptyPaginationMeta(): PaginationMeta {
  return { current_page: 1, per_page: 10, total: 0, last_page: 1 };
}
