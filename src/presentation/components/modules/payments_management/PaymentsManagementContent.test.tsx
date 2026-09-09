import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PaymentsManagementContent } from "@/presentation/components/modules/payments_management/PaymentsManagementContent";

const listPayments = vi.fn();
const getPayment = vi.fn();
const refundPayment = vi.fn();
const recordManualPayment = vi.fn();
const downloadPaymentReceipt = vi.fn();
const listUnpaidInvoices = vi.fn();

vi.mock("@/infrastructure/api/resources/payments", () => ({
  listPayments: (...args: unknown[]) => listPayments(...args),
  getPayment: (...args: unknown[]) => getPayment(...args),
  refundPayment: (...args: unknown[]) => refundPayment(...args),
  recordManualPayment: (...args: unknown[]) => recordManualPayment(...args),
  downloadPaymentReceipt: (...args: unknown[]) => downloadPaymentReceipt(...args),
}));

vi.mock("@/infrastructure/api/resources/finance", () => ({
  listUnpaidInvoices: (...args: unknown[]) => listUnpaidInvoices(...args),
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
  receipt_number: null,
  method: "PAYSTACK" as const,
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

function paginated<T>(data: T[]) {
  return { data, meta: { current_page: 1, per_page: 10, total: data.length, last_page: 1 } };
}

describe("PaymentsManagementContent", () => {
  beforeEach(() => {
    listPayments.mockReset();
    getPayment.mockReset();
    refundPayment.mockReset();
    recordManualPayment.mockReset();
    downloadPaymentReceipt.mockReset();
    listUnpaidInvoices.mockReset();
  });

  it("lists payments and refreshes status without confirm", async () => {
    listPayments.mockResolvedValue(paginated([paymentRow]));
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

  it("records a manual cash payment at the counter", async () => {
    const user = userEvent.setup();
    listPayments.mockResolvedValue(paginated([]));
    listUnpaidInvoices.mockResolvedValue([
      {
        id: 3,
        institution_id: 1,
        student_id: 7,
        academic_year_id: 1,
        invoice_number: "INV-2026-0003",
        issue_date: "2026-09-01",
        due_date: "2026-09-30",
        status: "ISSUED",
        subtotal: 20000,
        discount_amount: 0,
        penalty_amount: 0,
        total_amount: 20000,
        amount_paid: 0,
        balance_due: 20000,
        notes: null,
        created_by: 1,
        student: paymentRow.student,
      },
    ]);
    const recordedPayment = {
      ...paymentRow,
      id: 42,
      provider: "manual",
      method: "CASH",
      status: "SUCCESS" as const,
      receipt_number: "REC-2026-0001",
    };
    recordManualPayment.mockResolvedValue(recordedPayment);

    render(<PaymentsManagementContent />);
    await waitFor(() => expect(screen.getByTestId("payments-table")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /enregistrer un paiement/i }));
    await waitFor(() => expect(listUnpaidInvoices).toHaveBeenCalled());

    await user.click(screen.getByLabelText("Facture"));
    await user.click(await screen.findByRole("option", { name: /INV-2026-0003/i }));
    await user.type(screen.getByLabelText("Montant du paiement"), "20000");
    await user.click(screen.getByLabelText("Mode de paiement"));
    await user.click(await screen.findByRole("option", { name: /^Espèces$/i }));

    // recordManualPayment() déclenche un reload() serveur (plus un simple
    // ajout local) : la liste après enregistrement doit refléter le nouveau
    // paiement renvoyé par l'API, pas un état optimiste côté client.
    listPayments.mockResolvedValue(paginated([recordedPayment]));

    await user.click(screen.getByRole("button", { name: /^enregistrer$/i }));

    await waitFor(() => {
      expect(recordManualPayment).toHaveBeenCalledWith({
        invoice_id: "3",
        amount: 20000,
        method: "CASH",
        reference: undefined,
      });
    });
    expect(
      await screen.findByRole("button", { name: /Reçu REC-2026-0001/i })
    ).toBeInTheDocument();
  });

  it("fetches the next page from the server instead of paginating client-side", async () => {
    const user = userEvent.setup();
    listPayments.mockResolvedValue({
      data: [paymentRow],
      meta: { current_page: 1, per_page: 10, total: 15, last_page: 2 },
    });

    render(<PaymentsManagementContent />);
    await waitFor(() => expect(screen.getByTestId("payments-table")).toHaveTextContent("Awa"));

    await user.click(screen.getByLabelText("Page suivante"));

    await waitFor(() => {
      expect(listPayments).toHaveBeenCalledWith({ page: 2, per_page: 10 });
    });
  });

  it("downloads the numbered receipt for a successful payment", async () => {
    const user = userEvent.setup();
    listPayments.mockResolvedValue(
      paginated([{ ...paymentRow, status: "SUCCESS" as const, receipt_number: "REC-2026-0002" }])
    );
    downloadPaymentReceipt.mockResolvedValue(undefined);

    render(<PaymentsManagementContent />);
    await waitFor(() => expect(screen.getByTestId("payments-table")).toHaveTextContent("Awa"));

    await user.click(screen.getByRole("button", { name: /reçu REC-2026-0002/i }));
    await waitFor(() => expect(downloadPaymentReceipt).toHaveBeenCalledWith(9));
  });
});
