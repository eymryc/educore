import { describe, expect, it } from "vitest";
import { firstFieldError, mapFormToApi, toSnakeCaseKey } from "@/shared/lib/form-mapper";

describe("form-mapper", () => {
  it("converts camelCase keys to snake_case", () => {
    expect(toSnakeCaseKey("firstName")).toBe("first_name");
    expect(toSnakeCaseKey("day-of-week")).toBe("day_of_week");
  });

  it("maps form values with aliases and skips empty fields", () => {
    const payload = mapFormToApi(
      {
        firstName: "Aïcha",
        lastName: "",
        montantRecharge: 5000,
        active: true,
      },
      { montantRecharge: "amount" }
    );

    expect(payload).toEqual({
      first_name: "Aïcha",
      amount: 5000,
      active: true,
    });
  });

  it("reads the first field error from API validation payload", () => {
    expect(firstFieldError({ email: ["Identifiants invalides."] }, "email")).toBe(
      "Identifiants invalides."
    );
    expect(firstFieldError(undefined, "email")).toBeUndefined();
  });
});
