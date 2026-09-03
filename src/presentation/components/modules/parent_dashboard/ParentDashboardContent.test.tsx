import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ParentDashboardContent } from "@/presentation/components/modules/parent_dashboard/ParentDashboardContent";

const fetchParentDashboard = vi.fn();

vi.mock("@/infrastructure/api/resources/dashboard", () => ({
  fetchParentDashboard: (...a: unknown[]) => fetchParentDashboard(...a),
}));

vi.mock("@/infrastructure/auth/AuthProvider", () => ({
  useAuth: () => ({ user: { id: 2, name: "Parent", roles: ["PARENT"] } }),
  getAuthErrorMessage: (e: unknown) => (e instanceof Error ? e.message : "Erreur"),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/presentation/components/providers/ConfirmDialogProvider", () => ({
  useConfirm: () => vi.fn().mockResolvedValue(true),
}));
describe("ParentDashboardContent", () => {
  beforeEach(() => {
    fetchParentDashboard.mockReset();
  });

  it("lists children from the parent dashboard", async () => {
    fetchParentDashboard.mockResolvedValue({
      linked: true,
      children_count: 1,
      children: [
        {
          id: 7,
          full_name: "Awa Koné",
          class: "3ème A",
          average_grade: 14,
          attendance_rate: 98,
          unpaid_invoices: 1,
        },
      ],
    });

    render(<ParentDashboardContent />);

    await waitFor(() => {
      expect(screen.getByTestId("parent-children-list")).toHaveTextContent("Awa Koné");
    });
    expect(screen.getByTestId("parent-children-count")).toHaveTextContent("1");
  });

  it("shows error", async () => {
    fetchParentDashboard.mockRejectedValue(new Error("Parent KO"));
    render(<ParentDashboardContent />);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Parent KO");
    });
  });
});
