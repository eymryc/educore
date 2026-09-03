import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PersonnelEvaluationsContent } from "@/presentation/components/modules/valuations_du_personnel/PersonnelEvaluationsContent";

const listStaffEvaluations = vi.fn();
const updateStaffEvaluation = vi.fn();
const deleteStaffEvaluation = vi.fn();

vi.mock("@/infrastructure/api/resources/hr", () => ({
  listStaffEvaluations: (...a: unknown[]) => listStaffEvaluations(...a),
  updateStaffEvaluation: (...a: unknown[]) => updateStaffEvaluation(...a),
  deleteStaffEvaluation: (...a: unknown[]) => deleteStaffEvaluation(...a),
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
describe("PersonnelEvaluationsContent", () => {
  beforeEach(() => {
    listStaffEvaluations.mockReset();
    updateStaffEvaluation.mockReset();
    listStaffEvaluations.mockResolvedValue([
      {
        id: 5,
        institution_id: 1,
        staff_member_id: 2,
        evaluator_id: 1,
        evaluation_date: "2026-09-01",
        period_label: "T3 2026",
        overall_score: 16,
        strengths: null,
        improvements: null,
        comments: null,
        status: "draft",
        staff_member: { id: 2, first_name: "Awa", last_name: "Koné" },
      },
    ]);
    updateStaffEvaluation.mockResolvedValue({
      id: 5,
      institution_id: 1,
      staff_member_id: 2,
      evaluator_id: 1,
      evaluation_date: "2026-09-01",
      period_label: "T3 2026",
      overall_score: 16,
      strengths: null,
      improvements: null,
      comments: null,
      status: "finalized",
      staff_member: { id: 2, first_name: "Awa", last_name: "Koné" },
    });
  });

  it("lists and finalizes an evaluation", async () => {
    const user = userEvent.setup();
    render(<PersonnelEvaluationsContent />);
    await screen.findByText("Awa Koné");
    await user.click(screen.getByRole("button", { name: /Actions pour Awa Koné/i }));
    await user.click(screen.getByRole("menuitem", { name: "Finaliser" }));
    await waitFor(() =>
      expect(updateStaffEvaluation).toHaveBeenCalledWith(5, { status: "finalized" })
    );
    expect(await screen.findByText(/Évaluation de Awa Koné finalisée/i)).toBeInTheDocument();
  });
});
