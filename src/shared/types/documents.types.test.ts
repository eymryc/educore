import { describe, expect, it } from "vitest";
import {
  canDownloadDocument,
  filterCategories,
  filterDocuments,
  formatAccessRoles,
  formatFileSize,
  type DocumentCategory,
  type DocumentRecord,
} from "@/shared/types/documents.types";

describe("documents helpers", () => {
  it("formats size and access roles", () => {
    expect(formatFileSize(512)).toContain("o");
    expect(formatFileSize(2048)).toContain("Ko");
    expect(formatAccessRoles(null)).toContain("documents.view");
    expect(formatAccessRoles(["ADMIN", "DIRECTOR"])).toBe("ADMIN, DIRECTOR");
  });

  it("filters categories and documents", () => {
    const categories: DocumentCategory[] = [
      {
        id: 1,
        institution_id: 1,
        name: "Ressources humaines",
        code: "RH",
        description: null,
        access_roles: ["HR_MANAGER"],
        is_sensitive: true,
        is_active: true,
      },
      {
        id: 2,
        institution_id: 1,
        name: "Archives",
        code: "ARC",
        description: null,
        access_roles: null,
        is_sensitive: false,
        is_active: false,
      },
    ];
    expect(filterCategories(categories, { search: "humaine" })).toHaveLength(1);
    expect(filterCategories(categories, { activeOnly: true })).toHaveLength(1);

    const documents: DocumentRecord[] = [
      {
        id: 10,
        institution_id: 1,
        document_category_id: 1,
        title: "Règlement",
        description: null,
        uploaded_by: 1,
        file: {
          id: 1,
          name: "r",
          file_name: "reglement.pdf",
          mime_type: "application/pdf",
          size: 1000,
        },
      },
    ];
    expect(filterDocuments(documents, { search: "reglement" })).toHaveLength(1);
    expect(filterDocuments(documents, { categoryId: "2" })).toHaveLength(0);
    expect(canDownloadDocument(documents[0]!)).toBe(true);
  });
});
