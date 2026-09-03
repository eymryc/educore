import { describe, expect, it } from "vitest";
import {
  filterGuardians,
  guardianFullName,
  type Guardian,
} from "@/shared/types/guardian.types";

function guardian(
  partial: Partial<Guardian> & Pick<Guardian, "id" | "first_name" | "last_name">
): Guardian {
  return {
    institution_id: 1,
    user_id: null,
    email: "p@ecole.ci",
    phone: "+225 01 00 00 00 00",
    profession: null,
    address: null,
    students_count: 0,
    ...partial,
  };
}

describe("guardian helpers", () => {
  it("formats full name", () => {
    expect(guardianFullName({ first_name: "Moussa", last_name: "Koné" })).toBe("Koné Moussa");
  });

  it("filters by search and portal account", () => {
    const rows = [
      guardian({ id: 1, first_name: "Moussa", last_name: "Koné", user_id: 10 }),
      guardian({ id: 2, first_name: "Awa", last_name: "Traoré", user_id: null, email: "awa@ci" }),
    ];

    expect(filterGuardians(rows, { search: "awa" })).toHaveLength(1);
    expect(filterGuardians(rows, { portal: "with" })).toHaveLength(1);
    expect(filterGuardians(rows, { portal: "without" })[0].id).toBe(2);
  });
});
