import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClassDetailContent } from "@/presentation/components/modules/classes_management/ClassDetailContent";

const getClassGroup = vi.fn();
const listClassGroupStudents = vi.fn();
const listStudents = vi.fn();
const attachClassGroupStudent = vi.fn();
const detachClassGroupStudent = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "5" }),
}));

vi.mock("@/infrastructure/api/resources/academic", () => ({
  getClassGroup: (...args: unknown[]) => getClassGroup(...args),
  listClassGroupStudents: (...args: unknown[]) => listClassGroupStudents(...args),
  attachClassGroupStudent: (...args: unknown[]) => attachClassGroupStudent(...args),
  detachClassGroupStudent: (...args: unknown[]) => detachClassGroupStudent(...args),
}));

vi.mock("@/infrastructure/api/resources/students", () => ({
  listStudents: (...args: unknown[]) => listStudents(...args),
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

vi.mock("@/presentation/components/providers/ConfirmDialogProvider", () => ({
  useConfirm: () => vi.fn().mockResolvedValue(true),
}));
describe("ClassDetailContent", () => {
  beforeEach(() => {
    getClassGroup.mockReset();
    listClassGroupStudents.mockReset();
    listStudents.mockReset();
    attachClassGroupStudent.mockReset();
    getClassGroup.mockResolvedValue({
      id: 5,
      institution_id: 1,
      academic_year_id: 1,
      level_id: 1,
      series_id: null,
      name: "2nde A",
      max_capacity: 40,
      head_teacher_id: null,
      room_id: null,
      level: { id: 1, name: "2nde" },
      academic_year: { id: 1, name: "2025-2026" },
    });
  });

  it("lists members and attaches a student user", async () => {
    const user = userEvent.setup();
    listClassGroupStudents.mockResolvedValueOnce([]).mockResolvedValueOnce([
      { id: 88, name: "Aminata Koné", email: "a@ci" },
    ]);
    listStudents.mockResolvedValue([
      {
        id: 1,
        institution_id: 1,
        user_id: 88,
        matricule: "ELV-1",
        first_name: "Aminata",
        last_name: "Koné",
        birth_date: "2008-01-01",
        gender: "F",
        email: null,
        phone: null,
        address: null,
        level_id: null,
        class_group_id: null,
        status: "active",
        enrolled_at: null,
        avatar_url: null,
      },
    ]);
    attachClassGroupStudent.mockResolvedValue({});

    render(<ClassDetailContent />);
    await waitFor(() => expect(screen.getByTestId("class-detail-name")).toHaveTextContent("2nde A"));
    expect(screen.getByTestId("class-members-empty")).toBeInTheDocument();

    await user.click(screen.getByLabelText(/Élève à affecter/i));
    await user.click(await screen.findByRole("option", { name: /Koné Aminata/i }));
    await user.click(screen.getByRole("button", { name: /^Affecter$/i }));

    await waitFor(() => {
      expect(attachClassGroupStudent).toHaveBeenCalledWith("5", 88);
    });
  });
});
