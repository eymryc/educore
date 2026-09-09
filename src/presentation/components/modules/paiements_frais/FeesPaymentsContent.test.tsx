import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FeesPaymentsContent } from "@/presentation/components/modules/paiements_frais/FeesPaymentsContent";
import { ApiError } from "@/shared/types/api.types";

const listInvoices = vi.fn();
const initiatePayment = vi.fn();
const fetchStudentDashboard = vi.fn();

vi.mock("@/infrastructure/api/resources/finance", () => ({
  listInvoices: (...a: unknown[]) => listInvoices(...a),
}));

vi.mock("@/infrastructure/api/resources/payments", () => ({
  initiatePayment: (...a: unknown[]) => initiatePayment(...a),
}));

vi.mock("@/infrastructure/api/resources/dashboard", () => ({
  fetchStudentDashboard: (...a: unknown[]) => fetchStudentDashboard(...a),
}));

const authState = {
  user: {
    id: 2,
    email: "parent@educore.ci",
    roles: ["PARENT"],
    permissions: ["payments.view", "payments.create"],
  },
};

vi.mock("@/infrastructure/auth/AuthProvider", () => ({
  useAuth: () => authState,
  getAuthErrorMessage: (e: unknown) => (e instanceof Error ? e.message : "Erreur"),
}));

describe("FeesPaymentsContent", () => {
  beforeEach(() => {
    listInvoices.mockReset();
    initiatePayment.mockReset();
    fetchStudentDashboard.mockReset();
    authState.user = {
      id: 2,
      email: "parent@educore.ci",
      roles: ["PARENT"],
      permissions: ["payments.view", "payments.create"],
    };
  });

  it("lists invoices for a parent", async () => {
    listInvoices.mockResolvedValue({
      data: [
        {
          id: 5,
          institution_id: 1,
          student_id: 7,
          academic_year_id: 1,
          invoice_number: "FAC-1",
          issue_date: "2026-01-01",
          due_date: "2026-02-01",
          status: "ISSUED",
          subtotal: 10000,
          discount_amount: 0,
          penalty_amount: 0,
          total_amount: 10000,
          amount_paid: 0,
          balance_due: 10000,
          notes: null,
          created_by: null,
          student: {
            id: 7,
            institution_id: 1,
            user_id: null,
            matricule: "EL-7",
            first_name: "Awa",
            last_name: "Koné",
            birth_date: null,
            gender: "F",
            email: null,
            phone: null,
          },
        },
      ],
      meta: { current_page: 1, per_page: 100, total: 1, last_page: 1 },
    });

    render(<FeesPaymentsContent />);

    await waitFor(() => {
      expect(screen.getByTestId("fees-list")).toHaveTextContent("FAC-1");
    });
    expect(screen.getByTestId("fees-unpaid-total")).toHaveTextContent("10");
    expect(listInvoices).toHaveBeenCalledWith({ per_page: 100 });
  });

  it("never fetches the whole school's invoices for a staff role previewing the portal", async () => {
    authState.user = {
      id: 4,
      email: "admin@educore.ci",
      roles: ["ADMIN"],
      permissions: ["payments.view", "payments.create"],
    };

    render(<FeesPaymentsContent />);

    await waitFor(() => {
      expect(screen.getByTestId("fees-empty")).toBeInTheDocument();
    });
    expect(listInvoices).not.toHaveBeenCalled();
  });

  it("shows student info without listing invoices", async () => {
    authState.user = {
      id: 3,
      email: "eleve@educore.ci",
      roles: ["STUDENT"],
      permissions: [],
    };
    fetchStudentDashboard.mockResolvedValue({
      linked: true,
      unpaid_invoices: 2,
      average_grade: null,
      attendance_rate: null,
      assignments_pending: 0,
      assignments_due_soon: 0,
    });

    render(<FeesPaymentsContent />);

    await waitFor(() => {
      expect(screen.getByTestId("student-fees-info")).toHaveTextContent("2");
    });
    expect(listInvoices).not.toHaveBeenCalled();
  });

  it("shows API error", async () => {
    listInvoices.mockRejectedValue(new ApiError("Factures KO", 403));
    render(<FeesPaymentsContent />);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Factures KO");
    });
  });
});
