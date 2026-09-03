import { api, apiRequest } from "@/infrastructure/api/client";
import {
  defaultExportFilename,
  type ReportExportFormat,
  type ReportPayload,
  type ReportQuery,
  type ReportType,
} from "@/shared/types/reports.types";

export function getReport(
  type: ReportType,
  query?: ReportQuery
): Promise<ReportPayload> {
  return api.get<ReportPayload>(`/reports/${type}`, query);
}

export async function exportReport(
  type: ReportType,
  format: ReportExportFormat,
  query?: ReportQuery
): Promise<void> {
  const response = await apiRequest<Response>(`/reports/${type}`, {
    method: "GET",
    query: { ...query, format },
    raw: true,
  });
  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const match = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
  const filename =
    match?.[1]?.replace(/['"]/g, "") || defaultExportFilename(type, format);

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
