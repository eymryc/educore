import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PaymentsManagementContent } from "@/presentation/components/modules/payments_management/PaymentsManagementContent";

const listPayments = vi.fn();
const getPayment = vi.fn();
const refundPayment = vi.fn();

vi.mock("@/infrastructure/api/resources/payments", () => ({
  listPayments: (...args: unknown[]) => listPayments(...args),
  getPayment: (...args: unknown[]) => getPayment(...args),
  refundPayment: (...args: unknown[]) => refundPayment(...args),
}));

vi.mock("@/infrastructure/auth/AuthProvider", () => ({
  useAuth: () => ({
    user: {
      id: 1,
      name: "Admin",
      email: "admin@educore.ci",
      institution_id: 1,
      roles: ["ADMIN"],
      permissions: [],
      email_verified_at: null,
      created_at: null,
    },
  }),
  getAuthErrorMessage: (err: unknown) =>
    err instanceof Error ? err.message : "Une erreur est survenue.",
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const paymentRow = {
  id: 9,
  institution_id: 1,
  invoice_id: 3,
  student_id: 7,
  amount: 5000,
  currency: "XOF",
  status: "PROCESSING" as const,
  provider: "paystack",
  provider_reference: "ref-1",
  provider_transaction_id: null,
  authorization_url: "https://paystack.test/pay",
  refund_amount: null,
  paid_at: null,
  failed_at: null,
  refunded_at: null,
  initiated_by: 1,
  student: {
    id: 7,
    institution_id: 1,
    user_id: null,
    matricule: "EL-007",
    first_name: "Awa",
    last_name: "Koné",
    birth_date: "2010-01-01",
    gender: "F" as const,
    email: null,
    phone: null,
    address: null,
    level_id: 1,
    class_group_id: 2,
    status: "active" as const,
    enrolled_at: null,
    avatar_url: null,
  },
};

vi.mock("@/presentation/components/providers/ConfirmDialogProvider", () => ({
  useConfirm: () => vi.fn().mockResolvedValue(true),
}));
describe("PaymentsManagementContent", () => {
  beforeEach(() => {
    listPayments.mockReset();
    getPayment.mockReset();
    refundPayment.mockReset();
  });

  it("lists payments and refreshes status without confirm", async () => {
    listPayments.mockResolvedValue([paymentRow]);
    getPayment.mockResolvedValue({ ...paymentRow, status: "SUCCESS" });

    render(<PaymentsManagementContent />);
    expect(screen.getByTestId("payments-loading")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("payments-table")).toHaveTextContent("Awa");
    });
    expect(screen.getByRole("link", { name: /ouvrir paystack/i })).toHaveAttribute(
      "href",
      "https://paystack.test/pay"
    );

    await userEvent.click(screen.getByRole("button", { name: /^actualiser$/i }));
    await waitFor(() => {
      expect(getPayment).toHaveBeenCalledWith(9);
    });
    expect(refundPayment).not.toHaveBeenCalled();
  });

  it("shows error state", async () => {
    listPayments.mockRejectedValue(new Error("Paiements indisponibles"));
    render(<PaymentsManagementContent />);
    await waitFor(() => {
      expect(screen.getByTestId("payments-error")).toHaveTextContent(
        "Paiements indisponibles"
      );
    });
  });
});
