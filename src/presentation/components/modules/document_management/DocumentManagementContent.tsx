"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CrudCreateLink } from "@/presentation/components/forms/CrudLinks";
import {
  crudRowActions,
  DataTableActionsMenu,
} from "@/presentation/components/shared/DataTableActionsMenu";
import { ContentSkeleton } from "@/presentation/components/shared/DataTableSkeleton";
import {
  DataTableRefreshButton,
  DataTableSelectCell,
  DataTableSelectHeader,
} from "@/presentation/components/shared/DataTableControls";
import { DataTablePagination } from "@/presentation/components/shared/DataTablePagination";
import {
  DataTableShell,
  DataTableToolbar,
  DataTableSearch,
  DataTableEmpty,
  DataTableSelectionBar,
  DataTableToolbarActions,
  DATA_TABLE_CREATE_CLASS,
  DATA_TABLE_TH_CLASS,
  DATA_TABLE_TD_CLASS,
  DATA_TABLE_TH_ACTIONS_CLASS,
  DATA_TABLE_TD_ACTIONS_CLASS,
} from "@/presentation/components/shared/DataTable";

import { Select } from "@/presentation/components/shared/Select";
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
import { can, ROLE_LABELS } from "@/shared/lib/permissions";
import {
  canDownloadDocument,
  filterCategories,
  filterDocuments,
  formatFileSize,
  type DocumentCategory,
  type DocumentFileMeta,
  type DocumentRecord,
} from "@/shared/types/documents.types";
import { useConfirm } from "@/presentation/components/providers/ConfirmDialogProvider";

const CARD_CLASS =
  "border border-outline-variant/30 bg-white overflow-hidden shadow-[0_2px_4px_rgb(15_23_42/0.06),0_8px_24px_rgb(15_23_42/0.1),0_20px_48px_rgb(15_23_42/0.12)]";

const INPUT_CLASS = "ui-input w-full bg-white";

type FileKind = "pdf" | "image" | "word" | "excel" | "other";

const FILE_KIND_META: Record<FileKind, { icon: string; label: string; tone: string }> = {
  pdf: { icon: "picture_as_pdf", label: "PDF", tone: "bg-[#FCE8E6] text-[#C5221F]" },
  image: { icon: "image", label: "Image", tone: "bg-[#E8F0FE] text-[#1967D2]" },
  word: { icon: "description", label: "Word", tone: "bg-[#E8F0FE] text-[#185ABC]" },
  excel: { icon: "table_view", label: "Excel", tone: "bg-[#E6F4EA] text-[#137333]" },
  other: { icon: "draft", label: "Fichier", tone: "bg-surface-container-high text-on-surface-variant" },
};

function fileKind(file?: DocumentFileMeta | null, name?: string | null): FileKind {
  const mime = file?.mime_type?.toLowerCase() ?? "";
  const fileName = (name ?? file?.file_name ?? "").toLowerCase();
  if (mime.includes("pdf") || fileName.endsWith(".pdf")) return "pdf";
  if (mime.startsWith("image/") || /\.(jpe?g|png|gif|webp)$/.test(fileName)) return "image";
  if (mime.includes("word") || /\.(docx?)$/.test(fileName)) return "word";
  if (mime.includes("excel") || mime.includes("spreadsheet") || /\.(xlsx?)$/.test(fileName)) {
    return "excel";
  }
  return "other";
}

function formatAccessRolesFr(roles: string[] | null | undefined): string {
  if (!roles?.length) return "Tous les rôles autorisés";
  return roles.map((role) => ROLE_LABELS[role] ?? role).join(" · ");
}

function formatDocDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function FileKindMark({ kind }: { kind: FileKind }) {
  const meta = FILE_KIND_META[kind];
  return (
    <span
      className={`w-9 h-9 shrink-0 inline-flex items-center justify-center ${meta.tone}`}
      title={meta.label}
    >
      <span aria-hidden className="material-symbols-outlined text-[20px]">
        {meta.icon}
      </span>
    </span>
  );
}

export function DocumentManagementContent() {
  const confirmDialog = useConfirm();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  const [dragOver, setDragOver] = useState(false);

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

  const selectedCategory = filteredCategories.find(
    (c) => String(c.id) === selectedCategoryId
  );
  const totalDocs = documents.length;
  const sensitiveCount = categories.filter((c) => c.is_sensitive).length;

  function assignUploadFile(file: File | null) {
    setUploadFile(file);
    if (file && !uploadTitle.trim()) {
      setUploadTitle(file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "));
    }
  }

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

  const emptyTitle = search
    ? "Aucun résultat"
    : selectedCategoryId
      ? "Catégorie vide"
      : "Aucun document";
  const emptyDescription = search
    ? "Aucun document ne correspond à cette recherche."
    : selectedCategoryId
      ? "Aucun document dans cette catégorie pour l'instant."
      : canCreate
        ? "Aucun document pour l'instant. Cliquez sur « Téléverser » pour ajouter le premier."
        : "Aucun document pour l'instant.";

  return (
    <div className="flex flex-col w-full gap-md min-w-0 pb-xl">
      <section className={CARD_CLASS} data-testid="documents-intro">
        <div className="flex items-start gap-md px-md sm:px-lg py-md bg-[#f7f9fb]">
          <span className="w-10 h-10 bg-primary-container text-on-primary-container inline-flex items-center justify-center shrink-0">
            <span aria-hidden className="material-symbols-outlined text-[22px]">
              folder_open
            </span>
          </span>
          <div className="min-w-0">
            <h2 className="font-title-sm text-[16px] text-on-surface">
              Dépôt central des documents officiels de l&apos;établissement
            </h2>
            <p className="text-[13px] text-on-surface-variant mt-0.5">
              Règlements, circulaires et formulaires, classés par catégorie et droits
              d&apos;accès. Les pièces d&apos;un élève se gèrent depuis sa fiche.
            </p>
          </div>
        </div>
      </section>

      {!loading && (
        <section
          className="grid grid-cols-1 sm:grid-cols-3 gap-md"
          data-testid="documents-summary"
        >
          {[
            {
              key: "docs",
              icon: "description",
              label: "Documents",
              value: totalDocs,
            },
            {
              key: "cats",
              icon: "folder",
              label: "Catégories",
              value: categories.length,
            },
            {
              key: "sensitive",
              icon: "lock",
              label: "Catégories sensibles",
              value: sensitiveCount,
            },
          ].map((kpi, index) => (
            <div
              className={`min-w-0 p-md sm:p-lg flex items-center gap-md min-h-[5.5rem] ${
                index === 0
                  ? "bg-primary text-on-primary shadow-md"
                  : "bg-white border border-outline-variant/20 shadow-sm"
              }`}
              key={kpi.key}
            >
              <span
                className={`w-10 h-10 inline-flex items-center justify-center shrink-0 ${
                  index === 0 ? "bg-white/15" : "bg-surface-container-low text-on-surface-variant"
                }`}
              >
                <span aria-hidden className="material-symbols-outlined text-[22px]">
                  {kpi.icon}
                </span>
              </span>
              <div className="min-w-0">
                <p
                  className={`ui-stat-label ${index === 0 ? "text-on-primary/80" : ""}`}
                >
                  {kpi.label}
                </p>
                <p className="font-headline-md text-[28px] leading-none mt-1 tabular-nums">
                  {kpi.value}
                </p>
              </div>
            </div>
          ))}
        </section>
      )}

      {notice && (
        <div
          className="flex items-start gap-sm bg-secondary-container text-on-secondary-container px-md py-sm font-body-sm"
          role="status"
        >
          <span aria-hidden className="material-symbols-outlined text-[18px] shrink-0">
            check_circle
          </span>
          <span>{notice}</span>
        </div>
      )}
      {error && (
        <div
          className="flex items-start gap-sm bg-error-container text-on-error-container px-md py-sm font-body-sm"
          data-testid="documents-error"
          role="alert"
        >
          <span aria-hidden className="material-symbols-outlined text-[18px] shrink-0">
            error
          </span>
          <span>{error}</span>
        </div>
      )}
      {loading && <ContentSkeleton testId="documents-loading" variant="table" />}

      {showUpload && canCreate && (
        <form
          className={CARD_CLASS}
          data-testid="document-upload-form"
          onSubmit={(e) => void handleUpload(e)}
        >
          <div className="flex items-start justify-between gap-md px-md sm:px-lg py-md border-b border-outline-variant/15 bg-[#f7f9fb]">
            <div className="flex items-start gap-md min-w-0">
              <span className="w-10 h-10 bg-primary-container text-on-primary-container inline-flex items-center justify-center shrink-0">
                <span aria-hidden className="material-symbols-outlined text-[22px]">
                  upload_file
                </span>
              </span>
              <div className="min-w-0">
                <h2 className="font-title-sm text-[16px]">Téléverser un document</h2>
                <p className="text-[13px] text-on-surface-variant mt-0.5">
                  PDF, images ou fichiers Office — 10 Mo maximum.
                </p>
              </div>
            </div>
            <button
              className="h-9 px-md text-[12px] font-semibold text-on-surface-variant hover:text-on-surface"
              onClick={() => setShowUpload(false)}
              type="button"
            >
              Fermer
            </button>
          </div>

          <div className="px-md sm:px-lg py-md grid grid-cols-1 md:grid-cols-2 gap-md">
            <label className="flex flex-col gap-xs font-body-sm">
              <span className="ui-stat-label">Catégorie</span>
              <Select
                ariaLabel="Catégorie document"
                className={INPUT_CLASS}
                onChange={setUploadCategoryId}
                options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
                placeholder="Choisir…"
                searchable
                value={uploadCategoryId}
              />
            </label>
            <label className="flex flex-col gap-xs font-body-sm">
              <span className="ui-stat-label">Titre</span>
              <input
                aria-label="Titre document"
                className={INPUT_CLASS}
                onChange={(e) => setUploadTitle(e.target.value)}
                required
                value={uploadTitle}
              />
            </label>
            <label className="flex flex-col gap-xs font-body-sm md:col-span-2">
              <span className="ui-stat-label">Description</span>
              <textarea
                aria-label="Description document"
                className={`${INPUT_CLASS} min-h-[72px] py-sm`}
                onChange={(e) => setUploadDescription(e.target.value)}
                value={uploadDescription}
              />
            </label>

            <div
              className={`md:col-span-2 border border-dashed px-md py-lg text-center transition-colors ${
                dragOver
                  ? "border-primary bg-primary-container/30"
                  : "border-outline-variant/50 bg-surface-container-low/40"
              }`}
              onDragLeave={() => setDragOver(false)}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                assignUploadFile(e.dataTransfer.files?.[0] ?? null);
              }}
            >
              <input
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                aria-label="Fichier document"
                className="sr-only"
                onChange={(e) => assignUploadFile(e.target.files?.[0] ?? null)}
                ref={fileInputRef}
                type="file"
              />
              {uploadFile ? (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-md">
                  <FileKindMark kind={fileKind(null, uploadFile.name)} />
                  <div className="min-w-0 text-left">
                    <p className="font-semibold text-[14px] truncate">{uploadFile.name}</p>
                    <p className="text-[12px] text-on-surface-variant">
                      {formatFileSize(uploadFile.size)}
                    </p>
                  </div>
                  <button
                    className="h-9 px-md bg-white border border-outline-variant/25 font-label-caps text-label-caps"
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                  >
                    Remplacer
                  </button>
                </div>
              ) : (
                <button
                  className="inline-flex flex-col items-center gap-xs"
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                >
                  <span className="w-12 h-12 bg-white border border-outline-variant/20 inline-flex items-center justify-center">
                    <span aria-hidden className="material-symbols-outlined text-[24px] text-on-surface-variant">
                      cloud_upload
                    </span>
                  </span>
                  <span className="font-semibold text-[14px]">Déposer un fichier ici</span>
                  <span className="text-[12px] text-on-surface-variant">
                    ou cliquer pour parcourir
                  </span>
                </button>
              )}
            </div>
          </div>

          <div className="px-md sm:px-lg py-md border-t border-outline-variant/15 flex flex-wrap items-center justify-end gap-sm">
            <button
              className="h-9 px-md bg-surface-container-high font-label-caps text-label-caps"
              onClick={() => setShowUpload(false)}
              type="button"
            >
              Annuler
            </button>
            <button
              className={DATA_TABLE_CREATE_CLASS}
              disabled={busy}
              type="submit"
            >
              <span aria-hidden className="material-symbols-outlined text-[18px]">
                send
              </span>
              Envoyer
            </button>
          </div>
        </form>
      )}

      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-md items-start">
          <aside className="lg:col-span-4 min-w-0 lg:sticky lg:top-24" data-testid="categories-list">
            <div className={`${CARD_CLASS} flex flex-col`}>
              <div className="px-md py-md border-b border-outline-variant/15 bg-[#f7f9fb]">
                <h2 className="font-title-sm text-[15px]">Catégories</h2>
                <p className="text-[12px] text-on-surface-variant mt-0.5">
                  Chaque dossier définit qui peut consulter.
                </p>
              </div>

              <nav className="flex lg:flex-col gap-xs p-sm overflow-x-auto lg:overflow-visible">
                <button
                  className={`shrink-0 lg:w-full text-left px-md py-sm flex items-center gap-sm ${
                    !selectedCategoryId
                      ? "bg-primary text-on-primary"
                      : "hover:bg-surface-container-low"
                  }`}
                  onClick={() => setSelectedCategoryId("")}
                  type="button"
                >
                  <span
                    className={`w-8 h-8 inline-flex items-center justify-center shrink-0 ${
                      !selectedCategoryId ? "bg-white/15" : "bg-surface-container-high"
                    }`}
                  >
                    <span aria-hidden className="material-symbols-outlined text-[18px]">
                      inventory_2
                    </span>
                  </span>
                  <span className="font-semibold text-sm flex-1">Toutes</span>
                  <span
                    className={`text-[11px] tabular-nums px-2 py-0.5 ${
                      !selectedCategoryId
                        ? "bg-white/15"
                        : "bg-surface-container-high text-on-surface-variant"
                    }`}
                  >
                    {totalDocs}
                  </span>
                </button>

                {filteredCategories.map((c) => {
                  const active = selectedCategoryId === String(c.id);
                  const count = c.documents_count ?? 0;
                  return (
                    <div
                      className={`shrink-0 lg:w-full min-w-[16rem] lg:min-w-0 group relative ${
                        active ? "bg-secondary-container/60" : "hover:bg-surface-container-low"
                      }`}
                      key={c.id}
                    >
                      <button
                        className="w-full text-left px-md py-sm pr-12"
                        onClick={() => setSelectedCategoryId(String(c.id))}
                        type="button"
                      >
                        <div className="flex items-center gap-sm">
                          <span
                            className={`w-8 h-8 inline-flex items-center justify-center shrink-0 ${
                              c.is_sensitive
                                ? "bg-[#FFF3CD] text-[#856404]"
                                : "bg-surface-container-high text-on-surface-variant"
                            }`}
                          >
                            <span aria-hidden className="material-symbols-outlined text-[18px]">
                              {c.is_sensitive ? "lock" : "folder"}
                            </span>
                          </span>
                          <span className="font-semibold text-sm truncate flex-1">{c.name}</span>
                          <span className="text-[11px] tabular-nums text-on-surface-variant shrink-0">
                            {count}
                          </span>
                        </div>
                        {c.description && (
                          <p className="font-body-sm text-[12px] text-on-surface-variant mt-1 line-clamp-2 pl-10">
                            {c.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-xs mt-1 items-center pl-10">
                          {!c.is_active && <StatusBadge label="Inactive" tone="neutral" />}
                          {c.is_sensitive && <StatusBadge label="Sensible" tone="warning" />}
                          <span className="font-body-sm text-[11px] text-on-surface-variant">
                            {formatAccessRolesFr(c.access_roles)}
                          </span>
                        </div>
                      </button>
                      <div className="absolute top-2 right-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100">
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
                  );
                })}
              </nav>

              {filteredCategories.length === 0 && (
                <div className="px-md pb-md">
                  <DataTableEmpty
                    description={
                      canCreate
                        ? "Créez-en une pour commencer à classer vos documents."
                        : "Aucune catégorie n'est encore définie."
                    }
                    icon="folder_off"
                    title="Aucune catégorie pour l'instant."
                  >
                    {canCreate && (
                      <CrudCreateLink
                        label="NOUVELLE CATÉGORIE"
                        resource="document-categories"
                      />
                    )}
                  </DataTableEmpty>
                </div>
              )}
            </div>
          </aside>

          <div className="lg:col-span-8 min-w-0 flex flex-col gap-md">
            <DataTableShell className="mt-0" testId="documents-table">
              <DataTableToolbar>
                <div className="min-w-0 hidden sm:block">
                  <p className="font-title-sm text-[14px] truncate">
                    {selectedCategory ? selectedCategory.name : "Tous les documents"}
                  </p>
                  <p className="text-[11px] text-on-surface-variant">
                    {filteredDocuments.length} fichier
                    {filteredDocuments.length > 1 ? "s" : ""}
                  </p>
                </div>
                <DataTableSearch
                  ariaLabel={"Rechercher documents"}
                  onChange={setSearch}
                  placeholder={"Rechercher titre ou fichier…"}
                  value={search}
                />
                <DataTableToolbarActions>
                  <DataTableRefreshButton
                    loading={loading}
                    onRefresh={() => void reload()}
                  />
                  {canCreate && (
                    <>
                      <CrudCreateLink
                        className="inline-flex items-center gap-sm h-9 bg-white border border-outline-variant/25 font-label-caps text-label-caps px-md whitespace-nowrap hover:bg-surface-container-low"
                        label="NOUVELLE CATÉGORIE"
                        resource="document-categories"
                      />
                      <button
                        className={DATA_TABLE_CREATE_CLASS}
                        onClick={() => setShowUpload((v) => !v)}
                        type="button"
                      >
                        <span aria-hidden className="material-symbols-outlined text-[18px]">
                          upload
                        </span>
                        Téléverser
                      </button>
                    </>
                  )}
                </DataTableToolbarActions>
              </DataTableToolbar>

              <DataTableSelectionBar
                count={documentsTable.selectedIds.size}
                entityLabel="document"
                onClear={() => documentsTable.clearSelection()}
              />

              {filteredDocuments.length === 0 ? (
                <DataTableEmpty
                  description={emptyDescription}
                  icon="folder_off"
                  title={emptyTitle}
                >
                  {canCreate && !search && (
                    <button
                      className={DATA_TABLE_CREATE_CLASS}
                      onClick={() => setShowUpload(true)}
                      type="button"
                    >
                      <span aria-hidden className="material-symbols-outlined text-[18px]">
                        upload
                      </span>
                      Téléverser
                    </button>
                  )}
                </DataTableEmpty>
              ) : (
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
                        <th className={DATA_TABLE_TH_CLASS}>Document</th>
                        <th className={DATA_TABLE_TH_CLASS}>Fichier</th>
                        <th className={DATA_TABLE_TH_CLASS}>Taille</th>
                        <th className={DATA_TABLE_TH_CLASS}>Ajouté le</th>
                        <th className={DATA_TABLE_TH_ACTIONS_CLASS}>Actions</th>
                      </tr>
                    </thead>
                    <tbody className="font-body-sm text-body-sm">
                      {documentsTable.pageRows.map((doc, index) => {
                        const kind = fileKind(doc.file);
                        return (
                          <tr className={tableRowClass(index)} key={doc.id}>
                            <DataTableSelectCell
                              checked={documentsTable.selectedIds.has(doc.id)}
                              label={doc.title}
                              onChange={() => documentsTable.toggleOne(doc.id)}
                            />
                            <td className={DATA_TABLE_TD_CLASS}>
                              <div className="flex items-center gap-sm min-w-0">
                                <FileKindMark kind={kind} />
                                <div className="min-w-0">
                                  <div className="font-semibold truncate">{doc.title}</div>
                                  <div className="text-on-surface-variant text-[12px] truncate">
                                    {doc.category?.name ??
                                      `Catégorie #${doc.document_category_id}`}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className={`${DATA_TABLE_TD_CLASS} font-mono-data text-sm`}>
                              <span className="truncate block max-w-[14rem]" title={doc.file?.file_name ?? undefined}>
                                {doc.file?.file_name ?? "—"}
                              </span>
                            </td>
                            <td className={`${DATA_TABLE_TD_CLASS} whitespace-nowrap`}>
                              {formatFileSize(doc.file?.size)}
                            </td>
                            <td className={`${DATA_TABLE_TD_CLASS} whitespace-nowrap text-on-surface-variant`}>
                              {formatDocDate(doc.created_at)}
                            </td>
                            <td className={DATA_TABLE_TD_ACTIONS_CLASS}>
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
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

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
            </DataTableShell>
          </div>
        </div>
      )}
    </div>
  );
}
