import { api } from "@/infrastructure/api/client";
import type {
  DocumentCategory,
  DocumentDownloadUrl,
  DocumentRecord,
} from "@/shared/types/documents.types";

export function listDocumentCategories(): Promise<DocumentCategory[]> {
  return api.get<DocumentCategory[]>("/document-categories");
}

export function getDocumentCategory(id: number | string): Promise<DocumentCategory> {
  return api.get<DocumentCategory>(`/document-categories/${id}`);
}

export function createDocumentCategory(
  payload: Record<string, unknown>
): Promise<DocumentCategory> {
  return api.post<DocumentCategory>("/document-categories", payload);
}

export function updateDocumentCategory(
  id: number | string,
  payload: Record<string, unknown>
): Promise<DocumentCategory> {
  return api.put<DocumentCategory>(`/document-categories/${id}`, payload);
}

export function deleteDocumentCategory(id: number | string): Promise<null> {
  return api.delete<null>(`/document-categories/${id}`);
}

export type DocumentListQuery = {
  document_category_id?: number | string;
};

export function listDocuments(query?: DocumentListQuery): Promise<DocumentRecord[]> {
  return api.get<DocumentRecord[]>("/documents", query);
}

export function getDocument(id: number | string): Promise<DocumentRecord> {
  return api.get<DocumentRecord>(`/documents/${id}`);
}

export function createDocument(payload: {
  document_category_id: number;
  title: string;
  description?: string | null;
  file: File;
}): Promise<DocumentRecord> {
  const body = new FormData();
  body.append("document_category_id", String(payload.document_category_id));
  body.append("title", payload.title);
  if (payload.description) body.append("description", payload.description);
  body.append("file", payload.file);
  return api.post<DocumentRecord>("/documents", body);
}

export function updateDocument(
  id: number | string,
  payload: { title?: string; description?: string | null; file?: File }
): Promise<DocumentRecord> {
  if (payload.file) {
    const body = new FormData();
    if (payload.title !== undefined) body.append("title", payload.title);
    if (payload.description !== undefined) {
      body.append("description", payload.description ?? "");
    }
    body.append("file", payload.file);
    return api.put<DocumentRecord>(`/documents/${id}`, body);
  }
  return api.put<DocumentRecord>(`/documents/${id}`, {
    title: payload.title,
    description: payload.description ?? null,
  });
}

export function deleteDocument(id: number | string): Promise<null> {
  return api.delete<null>(`/documents/${id}`);
}

export function getDocumentDownloadUrl(
  id: number | string
): Promise<DocumentDownloadUrl> {
  return api.get<DocumentDownloadUrl>(`/documents/${id}/download-url`);
}

/** Open temporary signed download URL in a new tab. */
export async function downloadDocument(id: number | string): Promise<void> {
  const { download_url } = await getDocumentDownloadUrl(id);
  if (typeof window !== "undefined") {
    window.open(download_url, "_blank", "noopener,noreferrer");
  }
}
