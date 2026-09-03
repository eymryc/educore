import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PersonnelPayrollContent } from "@/presentation/components/modules/gestion_du_personnel_paie/PersonnelPayrollContent";

const listStaffPayrolls = vi.fn();
const processStaffPayroll = vi.fn();
const deleteStaffPayroll = vi.fn();

vi.mock("@/infrastructure/api/resources/hr", () => ({
  listStaffPayrolls: (...a: unknown[]) => listStaffPayrolls(...a),
  processStaffPayroll: (...a: unknown[]) => processStaffPayroll(...a),
  deleteStaffPayroll: (...a: unknown[]) => deleteStaffPayroll(...a),
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
    },
  }),
  getAuthErrorMessage: (err: unknown) =>
    err instanceof Error ? err.message : "Erreur",
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/presentation/components/providers/ConfirmDialogProvider", () => ({
  useConfirm: () => vi.fn().mockResolvedValue(true),
}));
describe("PersonnelPayrollContent", () => {
  beforeEach(() => {
    listStaffPayrolls.mockReset();
    processStaffPayroll.mockReset();
    deleteStaffPayroll.mockReset();
    listStaffPayrolls.mockResolvedValue([
      {
        id: 1,
        institution_id: 1,
        staff_member_id: 2,
        period_month: 9,
        period_year: 2026,
        base_salary: 200000,
        allowances: 0,
        deductions: 0,
        net_salary: 200000,
        status: "draft",
        processed_at: null,
        notes: null,
        staff_member: { id: 2, first_name: "Awa", last_name: "Koné" },
      },
    ]);
    processStaffPayroll.mockResolvedValue({
      id: 1,
      institution_id: 1,
      staff_member_id: 2,
      period_month: 9,
      period_year: 2026,
      base_salary: 200000,
      allowances: 0,
      deductions: 0,
      net_salary: 200000,
      status: "processed",
      processed_at: "2026-09-02",
      notes: null,
      staff_member: { id: 2, first_name: "Awa", last_name: "Koné" },
    });
  });

  it("lists payrolls and processes a draft", async () => {
    const user = userEvent.setup();
    render(<PersonnelPayrollContent />);
    await waitFor(() => expect(listStaffPayrolls).toHaveBeenCalled());
    expect(screen.getByText("Awa Koné")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Actions pour Awa Koné/i }));
    await user.click(screen.getByRole("menuitem", { name: "Traiter" }));
    await waitFor(() => expect(processStaffPayroll).toHaveBeenCalledWith(1));
    expect(await screen.findByText(/Awa Koné traitée/i)).toBeInTheDocument();
  });
});
