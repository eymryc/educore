import { describe, expect, it } from "vitest";
import { isSupplyLowStock, supplyToForm } from "@/shared/types/inventory.types";

describe("inventory.types helpers", () => {
  it("detects low stock", () => {
    expect(
      isSupplyLowStock({
        id: 1,
        institution_id: 1,
        designation: "A",
        category: "B",
        quantity: 2,
        alert_threshold: 5,
        unit: null,
        supplier: null,
        is_active: true,
      })
    ).toBe(true);
    expect(
      isSupplyLowStock({
        id: 1,
        institution_id: 1,
        designation: "A",
        category: "B",
        quantity: 10,
        alert_threshold: 5,
        unit: null,
        supplier: null,
        is_active: true,
        is_low_stock: false,
      })
    ).toBe(false);
  });

  it("maps supply to form", () => {
    expect(
      supplyToForm({
        id: 1,
        institution_id: 1,
        designation: "Craies",
        category: "Fournitures",
        quantity: 12,
        alert_threshold: 5,
        unit: "boîte",
        supplier: null,
        is_active: true,
      })
    ).toMatchObject({
      designation: "Craies",
      category: "Fournitures",
      quantity: "12",
      alert_threshold: "5",
      is_active: true,
    });
  });
});
