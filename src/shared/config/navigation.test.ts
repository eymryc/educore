import { describe, expect, it } from "vitest";
import {
  isAdminNavActive,
  isPortalNavActive,
  PORTAL_NAV_ITEMS,
  resolveActiveAdminHref,
} from "@/shared/config/navigation";

describe("resolveActiveAdminHref / isAdminNavActive", () => {
  it("matches exact list routes including nested paths", () => {
    expect(resolveActiveAdminHref("/finance/fees")).toBe("/finance/fees");
    expect(resolveActiveAdminHref("/academic/structure")).toBe("/academic/structure");
    expect(resolveActiveAdminHref("/security/audit-logs")).toBe("/security/audit-logs");
    expect(isAdminNavActive("/hr/staff", "/hr/staff")).toBe(true);
    expect(isAdminNavActive("/hr/staff", "/hr/payroll")).toBe(false);
  });

  it("keeps detail / sous-routes on the parent list item", () => {
    expect(resolveActiveAdminHref("/students/42")).toBe("/students");
    expect(resolveActiveAdminHref("/teachers/7")).toBe("/teachers");
    expect(resolveActiveAdminHref("/parents/3")).toBe("/parents");
    expect(resolveActiveAdminHref("/classes/9")).toBe("/classes");
    expect(isAdminNavActive("/students/42", "/students")).toBe(true);
  });

  it("maps CRUD pages back to the related nav item", () => {
    expect(resolveActiveAdminHref("/crud/students/nouveau")).toBe("/students");
    expect(resolveActiveAdminHref("/crud/teachers/4/modifier")).toBe("/teachers");
    expect(resolveActiveAdminHref("/crud/fee-items/nouveau")).toBe("/finance/fees");
    expect(resolveActiveAdminHref("/crud/drivers/2/modifier")).toBe("/transport/drivers");
  });

  it("only marks dashboard on the exact path", () => {
    expect(resolveActiveAdminHref("/dashboard")).toBe("/dashboard");
    expect(isAdminNavActive("/dashboard/settings", "/dashboard")).toBe(false);
  });

  it("prefers the longest matching href among siblings", () => {
    expect(resolveActiveAdminHref("/finance/overview")).toBe("/finance/overview");
    expect(resolveActiveAdminHref("/canteen/special-diets")).toBe("/canteen/special-diets");
    expect(isAdminNavActive("/canteen/special-diets", "/canteen/menus")).toBe(false);
  });
});

describe("isPortalNavActive", () => {
  it("does not keep Accueil active on other portal pages", () => {
    expect(isPortalNavActive("/portal/student", "/portal/student", PORTAL_NAV_ITEMS)).toBe(true);
    expect(isPortalNavActive("/portal/schedule", "/portal/student", PORTAL_NAV_ITEMS)).toBe(false);
    expect(isPortalNavActive("/portal/schedule", "/portal/schedule", PORTAL_NAV_ITEMS)).toBe(true);
  });
});
