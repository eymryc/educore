import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CrudForm } from "@/presentation/components/forms/CrudForm";
import { getCrudResource } from "@/shared/config/crud-forms";

const { create, loadFieldOptions } = vi.hoisted(() => ({
  create: vi.fn(),
  loadFieldOptions: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/infrastructure/api/crud-adapters", () => ({
  getCrudAdapter: () => ({
    loadFieldOptions,
    create,
  }),
}));

vi.mock("@/infrastructure/auth/AuthProvider", () => ({
  getAuthErrorMessage: (err: unknown) =>
    err instanceof Error ? err.message : "Une erreur est survenue.",
}));

vi.mock("@/presentation/components/providers/ConfirmDialogProvider", () => ({
  useConfirm: () => vi.fn().mockResolvedValue(true),
}));

describe("CrudForm stepper", () => {
  beforeEach(() => {
    create.mockReset();
    loadFieldOptions.mockReset();
    loadFieldOptions.mockResolvedValue({
      level_id: [{ value: "1", label: "6ème" }],
      class_group_id: [{ value: "10", label: "6ème A" }],
      academic_year_id: [{ value: "1", label: "2025-2026" }],
    });
  });

  it("walks the student form in three designed steps", async () => {
    const config = getCrudResource("students");
    expect(config).toBeTruthy();
    const user = userEvent.setup();
    render(<CrudForm config={config!} mode="create" />);

    await waitFor(() => {
      expect(screen.getByTestId("crud-stepper")).toBeInTheDocument();
    });
    expect(screen.getByText(/étape 1 sur 3/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^nom/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/^e-mail/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^continuer$/i }));
    expect(screen.getByText(/champs obligatoires/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^nom/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/^nom/i), "Koné");
    await user.type(screen.getByLabelText(/prénom/i), "Aminata");
    fireEvent.change(screen.getByLabelText(/date de naissance/i), {
      target: { value: "2012-04-15" },
    });
    fireEvent.blur(screen.getByLabelText(/date de naissance/i));
    await user.click(screen.getByLabelText(/^sexe$/i));
    await user.click(await screen.findByRole("option", { name: "Féminin" }));

    await user.click(screen.getByRole("button", { name: /^continuer$/i }));
    await waitFor(() => {
      expect(screen.getByText(/étape 2 sur 3/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/^statut$/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^continuer$/i }));
    await waitFor(() => {
      expect(screen.getByText(/étape 3 sur 3/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/^e-mail/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^créer$/i })).toBeInTheDocument();
  });

  it("walks the enrollment form in three designed steps", async () => {
    const config = getCrudResource("enrollment");
    expect(config).toBeTruthy();
    const user = userEvent.setup();
    render(<CrudForm config={config!} mode="create" />);

    await waitFor(() => {
      expect(screen.getByTestId("crud-stepper")).toBeInTheDocument();
    });
    expect(screen.getByText(/étape 1 sur 3/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^nom/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/année scolaire/i)).not.toBeInTheDocument();

    await user.type(screen.getByLabelText(/^nom/i), "Koné");
    await user.type(screen.getByLabelText(/prénom/i), "Awa");
    await user.click(screen.getByRole("button", { name: /^continuer$/i }));

    await waitFor(() => {
      expect(screen.getByText(/étape 2 sur 3/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/année scolaire/i)).toBeInTheDocument();

    await user.click(screen.getByLabelText(/année scolaire/i));
    await user.click(await screen.findByRole("option", { name: "2025-2026" }));
    await user.click(screen.getByLabelText(/niveau demandé/i));
    await user.click(await screen.findByRole("option", { name: "6ème" }));
    await user.click(screen.getByRole("button", { name: /^continuer$/i }));

    await waitFor(() => {
      expect(screen.getByText(/étape 3 sur 3/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/contact parent/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^créer$/i })).toBeInTheDocument();
  });

  it("keeps a short form on a single screen", async () => {
    const config = getCrudResource("parents");
    render(<CrudForm config={config!} mode="create" />);
    await waitFor(() => {
      expect(screen.getByLabelText(/^nom/i)).toBeInTheDocument();
    });
    expect(screen.queryByTestId("crud-stepper")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^créer$/i })).toBeInTheDocument();
  });
});
