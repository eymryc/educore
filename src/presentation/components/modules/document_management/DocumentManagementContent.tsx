"use client";

import { useEffect, useMemo, useState } from "react";
import { CrudCreateLink } from "@/presentation/components/forms/CrudLinks";
import {
  crudRowActions,
  DataTableActionsMenu,
  type DataTableMenuItem,
} from "@/presentation/components/shared/DataTableActionsMenu";
import { ContentSkeleton } from "@/presentation/components/shared/DataTableSkeleton";
import {
  DataTableRefreshButton,
  DataTableSelectCell,
  DataTableSelectHeader,
} from "@/presentation/components/shared/DataTableControls";
import { DataTablePagination } from "@/presentation/components/shared/DataTablePagination";
import { StatusBadge } from "@/presentation/components/shared/StatusBadge";
import {
  tableRowClass,
  useClientDataTable,
} from "@/presentation/components/shared/data-table-utils";
import {
  createDocument,
  deleteDocument,
  deleteDocumentCategory,
  downloadDocument,
  listDocumentCategories,
  listDocuments,
} from "@/infrastructure/api/resources/documents";
import { useAuth, getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import { can } from "@/shared/lib/permissions";
import {
  canDownloadDocument,
  filterCategories,
  filterDocuments,
  formatAccessRoles,
  formatFileSize,
  type DocumentCategory,
  type DocumentRecord,
} from "@/shared/types/documents.types";
import { useConfirm } from "@/presentation/components/providers/ConfirmDialogProvider";

export function DocumentManagementContent() {
  const confirmDialog = useConfirm();
  const { user } = useAuth();
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadCategoryId, setUploadCategoryId] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const canCreate = can(user, "documents.create");
  const canUpdate = can(user, "documents.update");
  const canDelete = can(user, "documents.delete");

  async function reload(categoryId = selectedCategoryId) {
    setLoading(true);
    setError(null);
    try {
      const [cats, docs] = await Promise.all([
        listDocumentCategories(),
        listDocuments(categoryId ? { document_category_id: categoryId } : undefined),
      ]);
      setCategories(cats);
      setDocuments(docs);
      setUploadCategoryId((prev) => prev || (cats[0] ? String(cats[0].id) : ""));
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- category filter reloads docs
  }, [selectedCategoryId]);

  const filteredCategories = useMemo(
    () => filterCategories(categories, { search: "" }),
    [categories]
  );

  const filteredDocuments = useMemo(
    () =>
      filterDocuments(documents, {
        search,
        categoryId: selectedCategoryId,
      }),
    [documents, search, selectedCategoryId]
  );

  const documentsTable = useClientDataTable(filteredDocuments, [
    search,
    selectedCategoryId,
  ]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    const categoryId = uploadCategoryId || (categories[0] ? String(categories[0].id) : "");
    if (!canCreate || !uploadFile || !uploadTitle.trim() || !categoryId) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const doc = await createDocument({
        document_category_id: Number(categoryId),
        title: uploadTitle.trim(),
        description: uploadDescription.trim() || null,
        file: uploadFile,
      });
      setDocuments((prev) => [doc, ...prev]);
      setNotice(`Document « ${doc.title} » téléversé.`);
      setShowUpload(false);
      setUploadTitle("");
      setUploadDescription("");
      setUploadFile(null);
      setCategories((prev) =>
        prev.map((c) =>
          c.id === doc.document_category_id
            ? { ...c, documents_count: (c.documents_count ?? 0) + 1 }
            : c
        )
      );
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDownload(doc: DocumentRecord) {
    if (!canDownloadDocument(doc)) return;
    setBusy(true);
    setError(null);
    try {
      if (doc.download_url) {
        window.open(doc.download_url, "_blank", "noopener,noreferrer");
      } else {
        await downloadDocument(doc.id);
      }
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteDoc(doc: DocumentRecord) {
    if (!canDelete) return;
    if (!await confirmDialog(`Supprimer « ${doc.title} » ?`)) return;
    setBusy(true);
    try {
      await deleteDocument(doc.id);
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteCategory(cat: DocumentCategory) {
    if (!canDelete) return;
    if (!await confirmDialog(`Supprimer la catégorie « ${cat.name} » ?`)) return;
    setBusy(true);
    try {
      await deleteDocumentCategory(cat.id);
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      if (selectedCategoryId === String(cat.id)) setSelectedCategoryId("");
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col w-full gap-lg pb-xl max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-md">
<div className="flex flex-wrap gap-sm">
          {canCreate && (
            <CrudCreateLink resource="document-categories" label="NOUVELLE CATÉGORIE" />
          )}
          {canCreate && (
            <button
              className="inline-flex items-center gap-sm bg-primary text-on-primary font-label-caps text-label-caps px-md py-sm rounded-lg"
              onClick={() => setShowUpload((v) => !v)}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">upload</span>
              Téléverser
            </button>
          )}
        </div>
      </div>

      {notice && (
        <div className="rounded-lg bg-secondary-container text-on-secondary-container px-md py-sm" role="status">
          {notice}
        </div>
      )}
      {error && (
        <div
          className="rounded-lg bg-error-container text-on-error-container px-md py-sm"
          data-testid="documents-error"
          role="alert"
        >
          {error}
        </div>
      )}
      {loading && <ContentSkeleton testId="documents-loading" variant="table" />}

      {showUpload && canCreate && (
        <form
          className="ui-card p-lg flex flex-col gap-md"
          data-testid="document-upload-form"
          onSubmit={(e) => void handleUpload(e)}
        >
          <h2 className="font-headline-md text-headline-md">Téléverser un document</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            <label className="flex flex-col gap-xs font-body-sm">
              Catégorie
              <select
                aria-label="Catégorie document"
                className="bg-surface rounded-lg py-sm px-md"
                onChange={(e) => setUploadCategoryId(e.target.value)}
                required
                value={uploadCategoryId}
              >
                <option value="">Choisir…</option>
                {categories.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-xs font-body-sm">
              Titre
              <input
                aria-label="Titre document"
                className="bg-surface rounded-lg py-sm px-md"
                onChange={(e) => setUploadTitle(e.target.value)}
                required
                value={uploadTitle}
              />
            </label>
            <label className="flex flex-col gap-xs font-body-sm md:col-span-2">
              Description
              <textarea
                aria-label="Description document"
                className="bg-surface rounded-lg py-sm px-md min-h-[72px]"
                onChange={(e) => setUploadDescription(e.target.value)}
                value={uploadDescription}
              />
            </label>
            <label className="flex flex-col gap-xs font-body-sm md:col-span-2">
              Fichier (pdf, images, office — max 10 Mo)
              <input
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                aria-label="Fichier document"
                className="bg-surface rounded-lg py-sm px-md"
                onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                required
                type="file"
              />
            </label>
          </div>
          <div className="flex gap-sm">
            <button
              className="px-md py-sm rounded-lg bg-primary text-on-primary font-label-caps disabled:opacity-40"
              disabled={busy}
              onClick={() =>
                void handleUpload({ preventDefault() {} } as React.FormEvent)
              }
              type="button"
            >
              Envoyer
            </button>
            <button
              className="px-md py-sm rounded-lg bg-surface-container-high font-label-caps"
              onClick={() => setShowUpload(false)}
              type="button"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-md">
          <aside className="lg:col-span-4 ui-card p-md flex flex-col gap-sm" data-testid="categories-list">
            <h2 className="font-title-sm text-title-sm mb-sm">Catégories</h2>
            <button
              className={`text-left px-md py-sm rounded-lg font-body-sm ${
                !selectedCategoryId
                  ? "bg-secondary-container text-on-secondary-container"
                  : "hover:bg-surface-container-low"
              }`}
              onClick={() => setSelectedCategoryId("")}
              type="button"
            >
              Toutes
            </button>
            {filteredCategories.map((c) => (
              <div
                key={c.id}
                className={`rounded-lg px-md py-sm ${
                  selectedCategoryId === String(c.id)
                    ? "bg-secondary-container/50"
                    : "hover:bg-surface-container-low"
                }`}
              >
                <button
                  className="w-full text-left"
                  onClick={() => setSelectedCategoryId(String(c.id))}
                  type="button"
                >
                  <div className="flex items-center justify-between gap-sm">
                    <span className="font-semibold text-sm">{c.name}</span>
                    <span className="text-[11px] font-mono-data text-on-surface-variant">
                      {c.documents_count ?? "—"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-xs mt-xs items-center">
                    {!c.is_active && (
                      <StatusBadge label="Inactive" tone="neutral" />
                    )}
                    {c.is_sensitive && (
                      <StatusBadge label="Sensible" tone="warning" />
                    )}
                    <span className="font-body-sm text-[11px] text-on-surface-variant">
                      {formatAccessRoles(c.access_roles)}
                    </span>
                  </div>
                </button>
                <div className="flex justify-end mt-sm">
                  <DataTableActionsMenu
                    ariaLabel={`Actions pour ${c.name}`}
                    items={crudRowActions({
                      edit: { resource: "document-categories", recordId: c.id },
                      delete: {
                        onClick: () => void handleDeleteCategory(c),
                        disabled: busy,
                      },
                      canUpdate,
                      canDelete,
                    })}
                  />
                </div>
              </div>
            ))}
            {filteredCategories.length === 0 && (
              <p className="font-body-sm text-on-surface-variant">Aucune catégorie.</p>
            )}
          </aside>

          <div className="lg:col-span-8 flex flex-col gap-md">
            <div className="ui-table-shell" data-testid="documents-table">
              <div className="px-lg pt-lg pb-md flex flex-wrap items-center gap-sm border-b border-outline-variant/15">
                <div className="ui-search-field flex-1 min-w-[200px] h-10 py-0">
                  <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
                    search
                  </span>
                  <input
                    aria-label="Rechercher documents"
                    className="ui-search-input ml-sm h-full"
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher titre ou fichier…"
                    type="text"
                    value={search}
                  />
                </div>
                <div className="ml-auto shrink-0 flex items-center gap-sm">
                  <DataTableRefreshButton
                    loading={loading}
                    onRefresh={() => void reload()}
                  />
                  {canCreate && (
                    <>
                      <CrudCreateLink
                        className="inline-flex items-center gap-sm h-10 bg-surface-container-high font-label-caps text-label-caps px-md rounded-lg"
                        label="NOUVELLE CATÉGORIE"
                        resource="document-categories"
                      />
                      <button
                        className="inline-flex items-center gap-sm h-10 bg-primary hover:bg-primary/90 text-on-primary font-label-caps text-label-caps px-md rounded-lg transition-colors shadow-sm"
                        onClick={() => setShowUpload((v) => !v)}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">upload</span>
                        Téléverser
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto min-h-[320px]">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-surface-container-low/80 sticky top-0 z-10">
                    <tr className="ui-table-head-row">
                      <DataTableSelectHeader
                        checked={documentsTable.allPageSelected}
                        indeterminate={
                          documentsTable.somePageSelected && !documentsTable.allPageSelected
                        }
                        onChange={documentsTable.toggleAllPage}
                      />
                      <th className="py-sm px-md">Titre</th>
                      <th className="py-sm px-md">Fichier</th>
                      <th className="py-sm px-md">Taille</th>
                      <th className="py-sm px-md text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="font-body-sm text-body-sm">
                    {filteredDocuments.length === 0 ? (
                      <tr>
                        <td className="py-lg px-lg text-on-surface-variant" colSpan={5}>
                          Aucun document.
                        </td>
                      </tr>
                    ) : (
                      documentsTable.pageRows.map((doc, index) => (
                        <tr className={tableRowClass(index)} key={doc.id}>
                          <DataTableSelectCell
                            checked={documentsTable.selectedIds.has(doc.id)}
                            label={doc.title}
                            onChange={() => documentsTable.toggleOne(doc.id)}
                          />
                          <td className="py-sm px-md">
                            <div className="font-semibold">{doc.title}</div>
                            <div className="text-on-surface-variant">
                              {doc.category?.name ?? `Catégorie #${doc.document_category_id}`}
                            </div>
                          </td>
                          <td className="py-sm px-md font-mono-data text-sm">
                            {doc.file?.file_name ?? "—"}
                          </td>
                          <td className="py-sm px-md">{formatFileSize(doc.file?.size)}</td>
                          <td className="py-sm px-md text-right">
                            <DataTableActionsMenu
                              ariaLabel={`Actions pour ${doc.title}`}
                              items={[
                                ...(canDownloadDocument(doc)
                                  ? [
                                      {
                                        kind: "button" as const,
                                        label: "Télécharger",
                                        icon: "download",
                                        onClick: () => void handleDownload(doc),
                                        disabled: busy,
                                      },
                                    ]
                                  : []),
                                ...crudRowActions({
                                  edit: { resource: "documents", recordId: doc.id },
                                  delete: {
                                    onClick: () => void handleDeleteDoc(doc),
                                    disabled: busy,
                                  },
                                  canUpdate,
                                  canDelete,
                                }),
                              ]}
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {filteredDocuments.length > 0 && (
                <DataTablePagination
                  canNextPage={documentsTable.canNextPage}
                  canPreviousPage={documentsTable.canPreviousPage}
                  entityLabel="documents"
                  from={documentsTable.from}
                  onFirstPage={() => documentsTable.setPageIndex(0)}
                  onLastPage={() => documentsTable.setPageIndex(documentsTable.pageCount - 1)}
                  onNextPage={() => documentsTable.setPageIndex(documentsTable.pageIndex + 1)}
                  onPageChange={documentsTable.setPageIndex}
                  onPageSizeChange={documentsTable.setPageSize}
                  onPreviousPage={() => documentsTable.setPageIndex(documentsTable.pageIndex - 1)}
                  pageCount={documentsTable.pageCount}
                  pageIndex={documentsTable.pageIndex}
                  pageSize={documentsTable.pageSize}
                  testId="documents-pagination"
                  to={documentsTable.to}
                  total={filteredDocuments.length}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
