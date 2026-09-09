import { api, apiRequest } from "@/infrastructure/api/client";
import { emptyPaginationMeta } from "@/shared/types/api.types";
import type {
  ReportCard,
  ReportCardAggregate,
  ReportCardListResult,
} from "@/shared/types/report-cards.types";

export type ReportCardListQuery = {
  student_id?: number | string;
  academic_period_id?: number | string;
  academic_year_id?: number | string;
  class_group_id?: number | string;
  status?: string;
  search?: string;
  page?: number | string;
  per_page?: number | string;
};

export async function listReportCards(query?: ReportCardListQuery): Promise<ReportCardListResult> {
  const result = await api.getWithMeta<ReportCard[]>("/report-cards", query);
  return {
    data: result.data ?? [],
    meta: result.meta ?? emptyPaginationMeta(),
  };
}

export function getReportCard(id: number | string): Promise<ReportCard> {
  return api.get<ReportCard>(`/report-cards/${id}`);
}

export function createReportCard(payload: Record<string, unknown>): Promise<ReportCard> {
  return api.post<ReportCard>("/report-cards", payload);
}

export function updateReportCard(
  id: number | string,
  payload: Record<string, unknown>
): Promise<ReportCard> {
  return api.put<ReportCard>(`/report-cards/${id}`, payload);
}

export function deleteReportCard(id: number | string): Promise<null> {
  return api.delete<null>(`/report-cards/${id}`);
}

export function getReportCardAggregate(id: number | string): Promise<ReportCardAggregate> {
  return api.get<ReportCardAggregate>(`/report-cards/${id}/aggregate`);
}

export function generateReportCard(id: number | string): Promise<ReportCard> {
  return api.post<ReportCard>(`/report-cards/${id}/generate`);
}

export function publishReportCard(id: number | string): Promise<ReportCard> {
  return api.post<ReportCard>(`/report-cards/${id}/publish`);
}

export async function downloadReportCardPdf(id: number | string): Promise<void> {
  const response = await apiRequest<Response>(`/report-cards/${id}/download`, {
    method: "GET",
    raw: true,
  });
  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const match = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
  const filename = match?.[1]?.replace(/['"]/g, "") || `bulletin-${id}.pdf`;

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
