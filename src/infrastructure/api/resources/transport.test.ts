import { beforeEach, describe, expect, it, vi } from "vitest";

const get = vi.fn();
const post = vi.fn();

vi.mock("@/infrastructure/api/client", () => ({
  api: {
    get: (...a: unknown[]) => get(...a),
    post: (...a: unknown[]) => post(...a),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import {
  createTransportRoute,
  listTransportVehicles,
} from "@/infrastructure/api/resources/transport";

describe("transport resource", () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
  });

  it("lists vehicles and creates route with stops", async () => {
    get.mockResolvedValue([{ id: 1, plate_number: "AB-123" }]);
    post.mockResolvedValue({ id: 2, name: "Ligne Nord" });

    await expect(listTransportVehicles()).resolves.toEqual([
      { id: 1, plate_number: "AB-123" },
    ]);
    expect(get).toHaveBeenCalledWith("/transport-vehicles");

    await createTransportRoute({
      name: "Ligne Nord",
      stops: [{ name: "Cocody", stop_order: 1 }],
    });
    expect(post).toHaveBeenCalledWith("/transport-routes", expect.any(Object));
  });
});
