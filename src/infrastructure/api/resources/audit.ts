import { api } from "@/infrastructure/api/client";
import {
  emptyPaginationMeta,
  type AuditLog,
  type AuditLogListQuery,
  type AuditLogListResult,
} from "@/shared/types/audit.types";

export async function listAuditLogs(
  query?: AuditLogListQuery
): Promise<AuditLogListResult> {
  const result = await api.getWithMeta<AuditLog[]>("/audit-logs", query);
  return {
    data: result.data ?? [],
    meta: result.meta ?? emptyPaginationMeta(),
  };
}

export function getAuditLog(id: number | string): Promise<AuditLog> {
  return api.get<AuditLog>(`/audit-logs/${id}`);
}
