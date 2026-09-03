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
  assignInventoryAsset,
  listLowStockSupplies,
  restockInventorySupply,
} from "@/infrastructure/api/resources/inventory";

describe("inventory resource", () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
  });

  it("loads low stock and posts restock / assign", async () => {
    get.mockResolvedValue([{ id: 1, designation: "Craies" }]);
    post.mockResolvedValueOnce({ id: 9, type: "restock" });
    post.mockResolvedValueOnce({ id: 2, designation: "PC" });

    await expect(listLowStockSupplies()).resolves.toEqual([
      { id: 1, designation: "Craies" },
    ]);
    expect(get).toHaveBeenCalledWith("/inventory-supplies/low-stock");

    await restockInventorySupply(1, {
      quantity: 10,
      movement_date: "2026-09-02",
      type: "restock",
    });
    expect(post).toHaveBeenCalledWith(
      "/inventory-supplies/1/restocks",
      expect.any(Object)
    );

    await assignInventoryAsset(2, { location: "Salle 1" });
    expect(post).toHaveBeenCalledWith("/inventory-assets/2/assign", {
      location: "Salle 1",
    });
  });
});
