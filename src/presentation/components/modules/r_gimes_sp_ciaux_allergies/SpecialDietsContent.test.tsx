import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { SpecialDietsContent } from "@/presentation/components/modules/r_gimes_sp_ciaux_allergies/SpecialDietsContent";

const listCanteenSpecialDiets = vi.fn();
const deleteCanteenSpecialDiet = vi.fn();

vi.mock("@/infrastructure/api/resources/canteen", () => ({
  listCanteenSpecialDiets: (...a: unknown[]) => listCanteenSpecialDiets(...a),
  deleteCanteenSpecialDiet: (...a: unknown[]) => deleteCanteenSpecialDiet(...a),
}));

vi.mock("@/infrastructure/auth/AuthProvider", () => ({
  useAuth: () => ({
    user: {
      id: 1,
      roles: ["ADMIN"],
      permissions: [],
      institution_id: 1,
    },
  }),
  getAuthErrorMessage: (e: unknown) => (e instanceof Error ? e.message : "Erreur"),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/presentation/components/providers/ConfirmDialogProvider", () => ({
  useConfirm: () => vi.fn().mockResolvedValue(true),
}));
describe("SpecialDietsContent", () => {
  beforeEach(() => {
    listCanteenSpecialDiets.mockReset();
    listCanteenSpecialDiets.mockResolvedValue([
      {
        id: 1,
        institution_id: 1,
        student_id: 7,
        diet_type: "allergie",
        allergens: "arachides",
        notes: null,
        is_active: true,
        student: {
          id: 7,
          institution_id: 1,
          user_id: null,
          matricule: "EL-007",
          first_name: "Awa",
          last_name: "Koné",
          birth_date: null,
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
      },
    ]);
  });

  it("lists special diets", async () => {
    render(<SpecialDietsContent />);
    await waitFor(() => expect(listCanteenSpecialDiets).toHaveBeenCalled());
    expect(await screen.findByText("Koné Awa")).toBeInTheDocument();
    expect(screen.getByText("arachides")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /NOUVEAU RÉGIME/i })).toHaveAttribute(
      "href",
      "/crud/special-diets/nouveau"
    );
  });
});
