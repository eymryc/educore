import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StudentDossierContent } from "@/presentation/components/modules/students_management/StudentDossierContent";

const getStudentFull = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "5" }),
}));

vi.mock("@/infrastructure/api/resources/students", () => ({
  getStudentFull: (...args: unknown[]) => getStudentFull(...args),
  uploadStudentPhoto: vi.fn(),
  uploadStudentDocument: vi.fn(),
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

describe("StudentDossierContent", () => {
  beforeEach(() => {
    getStudentFull.mockReset();
  });

  it("renders dossier data from GET /students/{id}/full", async () => {
    getStudentFull.mockResolvedValue({
      student: {
        id: 5,
        institution_id: 1,
        user_id: null,
        matricule: "ELV-5",
        first_name: "Aminata",
        last_name: "Koné",
        birth_date: "2008-03-15",
        gender: "F",
        email: "a@ecole.ci",
        phone: null,
        address: null,
        level_id: 1,
        class_group_id: 2,
        status: "active",
        enrolled_at: "2024-09-01",
        avatar_url: null,
      },
      class: { id: 2, name: "2nde A" },
      level: { id: 1, name: "2nde" },
      histories: [],
      grades: [],
      attendance: [],
      report_cards: [],
      payments: [],
      discipline: [],
    });

    render(<StudentDossierContent />);
    expect(screen.getByTestId("dossier-loading")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("dossier-name")).toHaveTextContent("Koné Aminata");
    });

    expect(screen.getByTestId("dossier-level")).toHaveTextContent("2nde");
    expect(screen.getByTestId("dossier-class")).toHaveTextContent("2nde A");
    expect(getStudentFull).toHaveBeenCalledWith("5");
  });

  it("shows error when dossier fails to load", async () => {
    getStudentFull.mockRejectedValue(new Error("Introuvable"));
    render(<StudentDossierContent />);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Introuvable");
    });
  });
});
