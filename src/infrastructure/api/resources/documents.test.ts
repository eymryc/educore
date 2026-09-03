import { beforeEach, describe, expect, it, vi } from "vitest";

const apiGet = vi.fn();
const apiPost = vi.fn();
const apiPut = vi.fn();
const apiDelete = vi.fn();

vi.mock("@/infrastructure/api/client", () => ({
  api: {
    get: (...args: unknown[]) => apiGet(...args),
    post: (...args: unknown[]) => apiPost(...args),
    put: (...args: unknown[]) => apiPut(...args),
    delete: (...args: unknown[]) => apiDelete(...args),
  },
}));

import {
  createDocument,
  createDocumentCategory,
  downloadDocument,
  getDocumentDownloadUrl,
  listDocumentCategories,
  listDocuments,
} from "@/infrastructure/api/resources/documents";

describe("documents API resource", () => {
  beforeEach(() => {
    apiGet.mockReset();
    apiPost.mockReset();
    apiPut.mockReset();
    apiDelete.mockReset();
  });

  it("lists categories and documents", async () => {
    apiGet.mockResolvedValue([]);
    await listDocumentCategories();
    expect(apiGet).toHaveBeenCalledWith("/document-categories");
    await listDocuments({ document_category_id: 2 });
    expect(apiGet).toHaveBeenCalledWith("/documents", { document_category_id: 2 });
  });

  it("creates category and uploads document as FormData", async () => {
    apiPost.mockResolvedValue({ id: 1 });
    await createDocumentCategory({
      name: "RH",
      access_roles: ["HR_MANAGER"],
      is_sensitive: true,
    });
    expect(apiPost).toHaveBeenCalledWith(
      "/document-categories",
      expect.objectContaining({ name: "RH" })
    );

    const file = new File(["pdf"], "doc.pdf", { type: "application/pdf" });
    await createDocument({
      document_category_id: 1,
      title: "Règlement",
      description: null,
      file,
    });
    expect(apiPost).toHaveBeenCalledWith("/documents", expect.any(FormData));
    const body = apiPost.mock.calls.at(-1)![1] as FormData;
    expect(body.get("title")).toBe("Règlement");
    expect(body.get("document_category_id")).toBe("1");
    expect(body.get("file")).toBeInstanceOf(File);
  });

  it("fetches signed download URL", async () => {
    apiGet.mockResolvedValue({
      download_url: "https://api.test/download?signature=abc",
      expires_at: "2026-09-02T19:00:00Z",
    });
    const open = vi.fn();
    vi.stubGlobal("open", open);

    await getDocumentDownloadUrl(5);
    expect(apiGet).toHaveBeenCalledWith("/documents/5/download-url");

    await downloadDocument(5);
    expect(open).toHaveBeenCalledWith(
      "https://api.test/download?signature=abc",
      "_blank",
      "noopener,noreferrer"
    );
    vi.unstubAllGlobals();
  });
});
