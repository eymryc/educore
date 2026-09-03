import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StaffDirectoryContent } from "@/presentation/components/modules/staff_directory/StaffDirectoryContent";

const listStaffMembers = vi.fn();
const listDepartments = vi.fn();
const deleteStaffMember = vi.fn();
const deleteDepartment = vi.fn();

vi.mock("@/infrastructure/api/resources/hr", () => ({
  listStaffMembers: (...a: unknown[]) => listStaffMembers(...a),
  listDepartments: (...a: unknown[]) => listDepartments(...a),
  deleteStaffMember: (...a: unknown[]) => deleteStaffMember(...a),
  deleteDepartment: (...a: unknown[]) => deleteDepartment(...a),
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
describe("StaffDirectoryContent", () => {
  beforeEach(() => {
    listStaffMembers.mockReset();
    listDepartments.mockReset();
    listStaffMembers.mockResolvedValue([
      {
        id: 2,
        institution_id: 1,
        department_id: 1,
        user_id: null,
        employee_number: "STF-2026-001",
        first_name: "Awa",
        last_name: "Koné",
        email: "awa@educore.ci",
        phone: "07000000",
        job_title: "Secrétaire",
        hired_at: "2024-01-01",
        status: "active",
        department: { id: 1, name: "Admin" },
      },
    ]);
    listDepartments.mockResolvedValue([
      { id: 1, name: "Administration", code: "ADM", description: null },
    ]);
  });

  it("lists staff and departments", async () => {
    const user = userEvent.setup();
    render(<StaffDirectoryContent />);
    await waitFor(() => expect(listStaffMembers).toHaveBeenCalled());
    expect(screen.getByText("Awa Koné")).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: /Départements/i }));
    expect(await screen.findByText("Administration")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Nouveau département/i })).toHaveAttribute(
      "href",
      "/crud/departments/nouveau"
    );
  });
});
