import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { CanteenMenusContent } from "@/presentation/components/modules/gestion_des_menus_cantine/CanteenMenusContent";

const listCanteenMenus = vi.fn();
const deleteCanteenMenu = vi.fn();

vi.mock("@/infrastructure/api/resources/canteen", () => ({
  listCanteenMenus: (...a: unknown[]) => listCanteenMenus(...a),
  deleteCanteenMenu: (...a: unknown[]) => deleteCanteenMenu(...a),
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
describe("CanteenMenusContent", () => {
  beforeEach(() => {
    listCanteenMenus.mockReset();
    listCanteenMenus.mockResolvedValue([
      {
        id: 1,
        institution_id: 1,
        day_of_week: "lundi",
        starter: "Soupe",
        main_course: "Riz sauce",
        dessert: "Fruit",
        price: 1500,
        is_active: true,
      },
    ]);
  });

  it("lists menus by day", async () => {
    render(<CanteenMenusContent />);
    await waitFor(() => expect(listCanteenMenus).toHaveBeenCalled());
    expect(await screen.findByText("Riz sauce")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /AJOUTER UN MENU/i })).toHaveAttribute(
      "href",
      "/crud/canteen-menus/nouveau"
    );
  });
});
