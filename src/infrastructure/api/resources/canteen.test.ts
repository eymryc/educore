import { beforeEach, describe, expect, it, vi } from "vitest";

const get = vi.fn();
const post = vi.fn();
const put = vi.fn();
const del = vi.fn();

vi.mock("@/infrastructure/api/client", () => ({
  api: {
    get: (...a: unknown[]) => get(...a),
    post: (...a: unknown[]) => post(...a),
    put: (...a: unknown[]) => put(...a),
    delete: (...a: unknown[]) => del(...a),
  },
}));

import {
  listCanteenMenus,
  topUpCanteenAccount,
  createCanteenSpecialDiet,
} from "@/infrastructure/api/resources/canteen";

describe("canteen resource", () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    put.mockReset();
    del.mockReset();
  });

  it("lists menus and tops up an account", async () => {
    get.mockResolvedValue([{ id: 1, day_of_week: "lundi" }]);
    post.mockResolvedValue({ id: 9, amount: 5000 });

    await expect(listCanteenMenus({ day_of_week: "lundi" })).resolves.toEqual([
      { id: 1, day_of_week: "lundi" },
    ]);
    expect(get).toHaveBeenCalledWith("/canteen-menus", { day_of_week: "lundi" });

    await topUpCanteenAccount(3, {
      amount: 5000,
      paid_at: "2026-09-02",
      payment_method: "mobile",
    });
    expect(post).toHaveBeenCalledWith("/canteen-accounts/3/topups", {
      amount: 5000,
      paid_at: "2026-09-02",
      payment_method: "mobile",
    });
  });

  it("creates special diet", async () => {
    post.mockResolvedValue({ id: 1, diet_type: "allergie" });
    await createCanteenSpecialDiet({
      student_id: 2,
      diet_type: "allergie",
      allergens: "arachides",
    });
    expect(post).toHaveBeenCalledWith("/canteen-special-diets", expect.any(Object));
  });
});
