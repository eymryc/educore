import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AssignmentsContent } from "@/presentation/components/modules/mes_devoirs/AssignmentsContent";

const listAssignments = vi.fn();
const listSubmissions = vi.fn();
const submitAssignment = vi.fn();

vi.mock("@/infrastructure/api/resources/assignments", () => ({
  listAssignments: (...a: unknown[]) => listAssignments(...a),
  listSubmissions: (...a: unknown[]) => listSubmissions(...a),
  submitAssignment: (...a: unknown[]) => submitAssignment(...a),
}));

vi.mock("@/infrastructure/auth/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: 1, roles: ["STUDENT"], permissions: ["assignments.view"] },
  }),
  getAuthErrorMessage: (e: unknown) => (e instanceof Error ? e.message : "Erreur"),
}));

describe("AssignmentsContent", () => {
  beforeEach(() => {
    listAssignments.mockReset();
    listSubmissions.mockReset();
    submitAssignment.mockReset();
  });

  it("lists assignments for the student", async () => {
    listAssignments.mockResolvedValue([
      {
        id: 1,
        institution_id: 1,
        academic_year_id: 1,
        subject_id: 1,
        class_group_id: 1,
        title: "DM Maths",
        description: null,
        instructions: null,
        due_at: "2099-01-01T12:00:00Z",
        max_score: 20,
        status: "PUBLISHED",
        created_by: 1,
        subject: { id: 1, name: "Maths" },
        class_group: { id: 1, name: "3ème A" },
      },
    ]);
    listSubmissions.mockResolvedValue([]);

    render(<AssignmentsContent />);

    await waitFor(() => {
      expect(screen.getByTestId("assignments-list")).toHaveTextContent("DM Maths");
    });
    expect(screen.getByRole("button", { name: /Rendre le devoir/i })).toBeInTheDocument();
  });

  it("shows empty state", async () => {
    listAssignments.mockResolvedValue([]);
    listSubmissions.mockResolvedValue([]);
    render(<AssignmentsContent />);
    await waitFor(() => {
      expect(screen.getByTestId("assignments-empty")).toBeInTheDocument();
    });
  });
});
