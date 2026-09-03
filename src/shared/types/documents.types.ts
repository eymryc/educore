export interface DocumentFileMeta {
  id: number;
  name: string;
  file_name: string;
  mime_type: string | null;
  size: number | null;
}

export interface DocumentCategory {
  id: number;
  institution_id: number;
  name: string;
  code: string | null;
  description: string | null;
  access_roles: string[] | null;
  is_sensitive: boolean;
  is_active: boolean;
  documents_count?: number;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface DocumentRecord {
  id: number;
  institution_id: number;
  document_category_id: number;
  title: string;
  description: string | null;
  uploaded_by: number | null;
  category?: DocumentCategory | null;
  uploader?: { id: number; name?: string | null; email?: string | null } | null;
  file?: DocumentFileMeta | null;
  download_url?: string | null;
  download_expires_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface DocumentDownloadUrl {
  download_url: string;
  expires_at: string;
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function formatAccessRoles(roles: string[] | null | undefined): string {
  if (!roles?.length) return "Tous (avec documents.view)";
  return roles.join(", ");
}

export function filterCategories(
  items: DocumentCategory[],
  filters: { search?: string; activeOnly?: boolean }
): DocumentCategory[] {
  const q = filters.search?.trim().toLowerCase() ?? "";
  return items.filter((c) => {
    if (filters.activeOnly && !c.is_active) return false;
    if (!q) return true;
    return `${c.name} ${c.code ?? ""} ${c.description ?? ""}`.toLowerCase().includes(q);
  });
}

export function filterDocuments(
  items: DocumentRecord[],
  filters: { search?: string; categoryId?: string }
): DocumentRecord[] {
  const q = filters.search?.trim().toLowerCase() ?? "";
  return items.filter((d) => {
    if (filters.categoryId && String(d.document_category_id) !== filters.categoryId) {
      return false;
    }
    if (!q) return true;
    return `${d.title} ${d.description ?? ""} ${d.file?.file_name ?? ""}`
      .toLowerCase()
      .includes(q);
  });
}

export function canDownloadDocument(doc: DocumentRecord): boolean {
  return Boolean(doc.file || doc.download_url);
}
