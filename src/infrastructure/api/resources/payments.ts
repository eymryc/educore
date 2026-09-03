import { api } from "@/infrastructure/api/client";
import type { Payment } from "@/shared/types/finance.types";

export type PaymentListQuery = {
  invoice_id?: number | string;
  student_id?: number | string;
};

export function listPayments(query?: PaymentListQuery): Promise<Payment[]> {
  return api.get<Payment[]>("/payments", query);
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
