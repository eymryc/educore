import { describe, expect, it } from "vitest";
import { resolveAdminPageChrome } from "@/shared/config/page-chrome";

describe("resolveAdminPageChrome", () => {
  it("resolves list pages with section breadcrumb", () => {
    const chrome = resolveAdminPageChrome("/finance/fees");
    expect(chrome.title).toBe("Catalogue des frais");
    expect(chrome.breadcrumbs.map((b) => b.label)).toEqual([
      "Accueil",
      "Finances",
      "Frais",
    ]);
  });

  it("resolves detail pages", () => {
    const chrome = resolveAdminPageChrome("/students/12");
    expect(chrome.title).toBe("Dossier élève");
    expect(chrome.breadcrumbs.at(-1)?.label).toBe("Dossier");
    expect(chrome.breadcrumbs.some((b) => b.href === "/students")).toBe(true);
  });

  it("resolves CRUD create/edit", () => {
    expect(resolveAdminPageChrome("/crud/teachers/nouveau").title).toContain("Nouveau");
    expect(resolveAdminPageChrome("/crud/teachers/3/modifier").title).toContain("Modifier");
  });

  it("resolves dashboard", () => {
    const chrome = resolveAdminPageChrome("/dashboard");
    expect(chrome.title).toBe("Tableau de bord");
    expect(chrome.breadcrumbs).toEqual([{ label: "Accueil" }]);
  });
});
