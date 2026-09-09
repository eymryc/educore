import { api, apiRequest } from "@/infrastructure/api/client";
import { emptyPaginationMeta } from "@/shared/types/api.types";
import type { Payment, PaymentListResult, PaymentMethod } from "@/shared/types/finance.types";

export type PaymentListQuery = {
  invoice_id?: number | string;
  student_id?: number | string;
  status?: string;
  search?: string;
  page?: number | string;
  per_page?: number | string;
};

export async function listPayments(query?: PaymentListQuery): Promise<PaymentListResult> {
  const result = await api.getWithMeta<Payment[]>("/payments", query);
  return {
    data: result.data ?? [],
    meta: result.meta ?? emptyPaginationMeta(),
  };
}

export function getPayment(id: number | string): Promise<Payment> {
  return api.get<Payment>(`/payments/${id}`);
}

/** Initiate Paystack checkout — status stays PROCESSING until webhook confirms. */
export function initiatePayment(payload: {
  invoice_id: number;
  amount?: number;
  email?: string;
}): Promise<Payment> {
  return api.post<Payment>("/payments", payload);
}

export function refundPayment(
  id: number | string,
  payload?: { amount?: number; reason?: string }
): Promise<Payment> {
  return api.post<Payment>(`/payments/${id}/refund`, payload ?? {});
}

/** Enregistre un paiement reçu au guichet (espèces, mobile money, chèque, virement) — statut SUCCESS immédiat. */
export function recordManualPayment(payload: {
  invoice_id: number | string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
}): Promise<Payment> {
  return api.post<Payment>("/payments/manual", payload);
}

export async function downloadPaymentReceipt(id: number | string): Promise<void> {
  const response = await apiRequest<Response>(`/payments/${id}/receipt`, {
    method: "GET",
    raw: true,
  });
  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const match = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
  const filename = match?.[1]?.replace(/['"]/g, "") || `recu-${id}.pdf`;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
