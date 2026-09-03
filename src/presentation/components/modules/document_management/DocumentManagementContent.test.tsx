import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DocumentManagementContent } from "@/presentation/components/modules/document_management/DocumentManagementContent";

const listDocumentCategories = vi.fn();
const listDocuments = vi.fn();
const createDocument = vi.fn();
const deleteDocument = vi.fn();
const deleteDocumentCategory = vi.fn();
const downloadDocument = vi.fn();

vi.mock("@/infrastructure/api/resources/documents", () => ({
  listDocumentCategories: (...args: unknown[]) => listDocumentCategories(...args),
  listDocuments: (...args: unknown[]) => listDocuments(...args),
  createDocument: (...args: unknown[]) => createDocument(...args),
  deleteDocument: (...args: unknown[]) => deleteDocument(...args),
  deleteDocumentCategory: (...args: unknown[]) => deleteDocumentCategory(...args),
  downloadDocument: (...args: unknown[]) => downloadDocument(...args),
}));

vi.mock("@/infrastructure/auth/AuthProvider", () => ({
  useAuth: () => ({
    user: {
      id: 1,
      name: "Admin",
      email: "admin@educore.ci",
      institution_id: 1,
      roles: ["ADMIN"],
      permissions: [],
      email_verified_at: null,
      created_at: null,
    },
  }),
  getAuthErrorMessage: (err: unknown) =>
    err instanceof Error ? err.message : "Une erreur est survenue.",
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/presentation/components/providers/ConfirmDialogProvider", () => ({
  useConfirm: () => vi.fn().mockResolvedValue(true),
}));
describe("DocumentManagementContent", () => {
  beforeEach(() => {
    listDocumentCategories.mockReset();
    listDocuments.mockReset();
    createDocument.mockReset();
    downloadDocument.mockReset();
  });

  it("lists categories and documents then downloads via signed URL helper", async () => {
    listDocumentCategories.mockResolvedValue([
      {
        id: 1,
        institution_id: 1,
        name: "RH",
        code: "RH",
        description: null,
        access_roles: ["HR_MANAGER"],
        is_sensitive: true,
        is_active: true,
        documents_count: 1,
      },
    ]);
    listDocuments.mockResolvedValue([
      {
        id: 10,
        institution_id: 1,
        document_category_id: 1,
        title: "Règlement",
        description: null,
        uploaded_by: 1,
        category: { id: 1, name: "RH" },
        file: {
          id: 1,
          name: "r",
          file_name: "reglement.pdf",
          mime_type: "application/pdf",
          size: 2048,
        },
      },
    ]);
    downloadDocument.mockResolvedValue(undefined);

    render(<DocumentManagementContent />);
    expect(screen.getByTestId("documents-loading")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("categories-list")).toHaveTextContent("RH");
      expect(screen.getByTestId("documents-table")).toHaveTextContent("Règlement");
    });

    await userEvent.click(screen.getByRole("button", { name: /Actions pour Règlement/i }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Télécharger" }));
    await waitFor(() => {
      expect(downloadDocument).toHaveBeenCalledWith(10);
    });
  });

  it("uploads a document from the form", async () => {
    listDocumentCategories.mockResolvedValue([
      {
        id: 1,
        institution_id: 1,
        name: "RH",
        code: "RH",
        description: null,
        access_roles: null,
        is_sensitive: false,
        is_active: true,
      },
    ]);
    listDocuments.mockResolvedValue([]);
    createDocument.mockResolvedValue({
      id: 11,
      institution_id: 1,
      document_category_id: 1,
      title: "Contrat",
      description: null,
      uploaded_by: 1,
      file: {
        id: 2,
        name: "c",
        file_name: "contrat.pdf",
        mime_type: "application/pdf",
        size: 100,
      },
    });

    const user = userEvent.setup();
    render(<DocumentManagementContent />);
    await waitFor(() => {
      expect(screen.getByTestId("categories-list")).toBeInTheDocument();
    });

    await user.click(screen.getAllByRole("button", { name: /téléverser/i })[0]!);
    expect(screen.getByTestId("document-upload-form")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/catégorie document/i), "1");
    await user.type(screen.getByLabelText(/titre document/i), "Contrat");
    const file = new File(["x"], "contrat.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByLabelText(/fichier document/i), {
      target: { files: [file] },
    });
    await user.click(screen.getByRole("button", { name: /^envoyer$/i }));

    await waitFor(() => {
      expect(createDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          document_category_id: 1,
          title: "Contrat",
          file,
        })
      );
    });
  });

  it("shows error state", async () => {
    listDocumentCategories.mockRejectedValue(new Error("Docs KO"));
    listDocuments.mockResolvedValue([]);
    render(<DocumentManagementContent />);
    await waitFor(() => {
      expect(screen.getByTestId("documents-error")).toHaveTextContent("Docs KO");
    });
  });
});
