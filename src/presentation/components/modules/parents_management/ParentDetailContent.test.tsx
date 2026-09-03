import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ParentDetailContent } from "@/presentation/components/modules/parents_management/ParentDetailContent";

const getGuardian = vi.fn();
const listGuardianStudents = vi.fn();
const listStudents = vi.fn();
const attachGuardianStudent = vi.fn();
const detachGuardianStudent = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "7" }),
}));

vi.mock("@/infrastructure/api/resources/guardians", () => ({
  getGuardian: (...args: unknown[]) => getGuardian(...args),
  listGuardianStudents: (...args: unknown[]) => listGuardianStudents(...args),
  attachGuardianStudent: (...args: unknown[]) => attachGuardianStudent(...args),
  detachGuardianStudent: (...args: unknown[]) => detachGuardianStudent(...args),
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
describe("ParentDetailContent", () => {
  beforeEach(() => {
    getGuardian.mockReset();
    listGuardianStudents.mockReset();
    listStudents.mockReset();
    attachGuardianStudent.mockReset();
    detachGuardianStudent.mockReset();

    getGuardian.mockResolvedValue({
      id: 7,
      institution_id: 1,
      user_id: 3,
      first_name: "Moussa",
      last_name: "Koné",
      email: "moussa@ci",
      phone: "0700",
      profession: "Commerçant",
      address: "Cocody",
      students_count: 1,
    });
  });

  it("renders guardian and linked students", async () => {
    listGuardianStudents.mockResolvedValue([
      {
        id: 5,
        institution_id: 1,
        user_id: null,
        matricule: "ELV-5",
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
        class_group: { id: 1, name: "2nde A" },
      },
    ]);
    listStudents.mockResolvedValue([]);

    render(<ParentDetailContent />);
    expect(screen.getByTestId("parent-detail-loading")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("parent-detail-name")).toHaveTextContent("Koné Moussa");
    });

    expect(screen.getByTestId("parent-linked-list")).toHaveTextContent("Koné Aminata");
    expect(screen.getByTestId("parent-linked-count")).toHaveTextContent("1");
  });

  it("attaches a student via the form", async () => {
    const user = userEvent.setup();
    listGuardianStudents
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 9,
          institution_id: 1,
          user_id: null,
          matricule: "ELV-9",
          first_name: "Jean",
          last_name: "Traoré",
          birth_date: "2009-01-01",
          gender: "M",
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
    listStudents.mockResolvedValue([
      {
        id: 9,
        institution_id: 1,
        user_id: null,
        matricule: "ELV-9",
        first_name: "Jean",
        last_name: "Traoré",
        birth_date: "2009-01-01",
        gender: "M",
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
    attachGuardianStudent.mockResolvedValue({ id: 1, student_id: 9 });

    render(<ParentDetailContent />);
    await waitFor(() => expect(screen.getByTestId("parent-linked-empty")).toBeInTheDocument());

    await user.selectOptions(screen.getByLabelText(/^Élève$/i), "9");
    await user.click(screen.getByRole("button", { name: /Lier l'élève/i }));

    await waitFor(() => {
      expect(attachGuardianStudent).toHaveBeenCalledWith("7", {
        student_id: 9,
        relationship: "pere",
        is_primary: false,
      });
    });
  });

  it("shows error when guardian fails to load", async () => {
    getGuardian.mockRejectedValue(new Error("Introuvable"));
    listGuardianStudents.mockResolvedValue([]);
    listStudents.mockResolvedValue([]);

    render(<ParentDetailContent />);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Introuvable");
    });
  });
});
