import { describe, expect, it } from "vitest";
import {
  encodeStopsText,
  parseStopsText,
  transportDriverName,
} from "@/shared/types/transport.types";

describe("transport.types helpers", () => {
  it("parses and encodes stops text", () => {
    const parsed = parseStopsText(
      "Cocody | Rue A | 1 | 06:30\nPlateau | | 2 | 07:00"
    );
    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toEqual({
      name: "Cocody",
      address: "Rue A",
      stop_order: 1,
      pickup_time: "06:30",
    });
    expect(parsed[1].name).toBe("Plateau");
    expect(parsed[1].address).toBeNull();

    expect(
      encodeStopsText([
        {
          id: 1,
          transport_route_id: 1,
          name: "Cocody",
          address: "Rue A",
          stop_order: 1,
          pickup_time: "06:30",
        },
      ])
    ).toContain("Cocody");
  });

  it("formats driver name", () => {
    expect(transportDriverName({ first_name: "Jean", last_name: "Koffi" })).toBe(
      "Jean Koffi"
    );
  });
});
