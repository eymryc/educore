import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProfileContent } from "@/presentation/components/modules/mon_profil/ProfileContent";

vi.mock("@/infrastructure/auth/AuthProvider", () => ({
  useAuth: () => ({
    status: "authenticated",
    logout: vi.fn(),
    user: {
      id: 1,
      name: "Awa Koné",
      email: "awa@educore.ci",
      roles: ["STUDENT"],
      institution_id: 1,
      institution: { id: 1, name: "Lycée Demo", slug: "demo" },
      created_at: "2026-01-15T00:00:00Z",
    },
  }),
}));

describe("ProfileContent", () => {
  it("renders auth/me profile fields", () => {
    render(<ProfileContent />);
    expect(screen.getByTestId("profile-card")).toHaveTextContent("Awa Koné");
    expect(screen.getByTestId("profile-card")).toHaveTextContent("awa@educore.ci");
    expect(screen.getByTestId("profile-card")).toHaveTextContent("Lycée Demo");
  });
});
