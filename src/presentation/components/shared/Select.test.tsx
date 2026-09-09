import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Select } from "@/presentation/components/shared/Select";

const OPTIONS = [
  { value: "m", label: "Masculin" },
  { value: "f", label: "Féminin" },
  { value: "6a", label: "6ème A" },
  { value: "6b", label: "6ème B" },
  { value: "5a", label: "5ème A" },
];

describe("Select", () => {
  it("filters options from the search field", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Select
        ariaLabel="Classe"
        onChange={onChange}
        options={OPTIONS}
        searchable
        value=""
      />
    );

    await user.click(screen.getByLabelText(/^classe$/i));
    expect(await screen.findByRole("option", { name: "6ème A" })).toBeInTheDocument();

    await user.type(screen.getByLabelText(/rechercher une option/i), "5ème");
    expect(screen.getByRole("option", { name: "5ème A" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "6ème A" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("option", { name: "5ème A" }));
    expect(onChange).toHaveBeenCalledWith("5a");
  });
});
