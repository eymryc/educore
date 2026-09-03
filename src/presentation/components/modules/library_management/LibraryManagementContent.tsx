"use client";

import { useEffect, useMemo, useState } from "react";
import { CrudCreateLink } from "@/presentation/components/forms/CrudLinks";
import {
  crudRowActions,
  DataTableActionsMenu,
} from "@/presentation/components/shared/DataTableActionsMenu";
import {
  DataTableRefreshButton,
  DataTableSelectCell,
  DataTableSelectHeader,
} from "@/presentation/components/shared/DataTableControls";
import {
  DataTableSkeleton,
  LIBRARY_BOOKS_TABLE_SKELETON_COLUMNS,
  LIBRARY_COPIES_TABLE_SKELETON_COLUMNS,
  LIBRARY_LOANS_TABLE_SKELETON_COLUMNS,
} from "@/presentation/components/shared/DataTableSkeleton";
import { DataTablePagination } from "@/presentation/components/shared/DataTablePagination";
import { StatusBadge } from "@/presentation/components/shared/StatusBadge";
import {
  tableRowClass,
  useClientDataTable,
} from "@/presentation/components/shared/data-table-utils";
import {
  deleteLibraryBook,
  deleteLibraryCopy,
  listLibraryBooks,
  listLibraryCopies,
  listLibraryLoans,
  listOverdueLibraryLoans,
  returnLibraryLoan,
} from "@/infrastructure/api/resources/library";
import { useAuth, getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import { can } from "@/shared/lib/permissions";
import {
  LIBRARY_COPY_STATUS_LABELS,
  LIBRARY_LOAN_STATUS_LABELS,
  canReturnLoan,
  filterLibraryBooks,
  filterLibraryLoans,
  type LibraryBook,
  type LibraryCopy,
  type LibraryCopyStatus,
  type LibraryLoan,
  type LibraryLoanStatus,
} from "@/shared/types/library.types";
import { studentFullName } from "@/shared/types/student.types";
import { useConfirm } from "@/presentation/components/providers/ConfirmDialogProvider";

type Tab = "books" | "copies" | "loans";

const TABS: { id: Tab; label: string }[] = [
  { id: "books", label: "Ouvrages" },
  { id: "copies", label: "Exemplaires" },
  { id: "loans", label: "Emprunts" },
];

function copyTone(status: LibraryCopyStatus): "success" | "warning" | "error" | "neutral" | "info" {
  if (status === "AVAILABLE") return "success";
  if (status === "LOANED") return "info";
  if (status === "LOST" || status === "DAMAGED") return "error";
  return "neutral";
}

function loanTone(status: LibraryLoanStatus): "success" | "warning" | "error" | "info" {
  if (status === "RETURNED") return "success";
  if (status === "OVERDUE") return "error";
  return "warning";
}

export function LibraryManagementContent() {
  const confirmDialog = useConfirm();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("books");
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [copies, setCopies] = useState<LibraryCopy[]>([]);
  const [loans, setLoans] = useState<LibraryLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [copyBookId, setCopyBookId] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [loanStatus, setLoanStatus] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(false);

  const canCreate = can(user, "library.create");
  const canUpdate = can(user, "library.update");
  const canDelete = can(user, "library.delete");

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const [bookList, copyList, loanList] = await Promise.all([
        listLibraryBooks(),
        listLibraryCopies(),
        overdueOnly ? listOverdueLibraryLoans() : listLibraryLoans(),
      ]);
      setBooks(bookList);
      setCopies(copyList);
      setLoans(loanList);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- overdue toggle reloads loans
  }, [overdueOnly]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const b of books) if (b.category) set.add(b.category);
    return Array.from(set).sort();
  }, [books]);

  const filteredBooks = useMemo(
    () => filterLibraryBooks(books, { search: tab === "books" ? search : "", category }),
    [books, search, category, tab]
  );

  const filteredCopies = useMemo(() => {
    return copies.filter((c) => {
      if (copyBookId && String(c.library_book_id) !== copyBookId) return false;
      if (copyStatus && c.status !== copyStatus) return false;
      if (tab === "copies" && search.trim()) {
        const q = search.trim().toLowerCase();
        const title = c.book?.title ?? books.find((b) => b.id === c.library_book_id)?.title ?? "";
        return `${c.copy_code} ${title}`.toLowerCase().includes(q);
      }
      return true;
    });
  }, [copies, copyBookId, copyStatus, search, tab, books]);

  const filteredLoans = useMemo(
    () =>
      filterLibraryLoans(loans, {
        search: tab === "loans" ? search : "",
        status: overdueOnly ? "" : loanStatus,
      }),
    [loans, search, loanStatus, tab, overdueOnly]
  );

  const booksTable = useClientDataTable(filteredBooks, [search, category, tab]);
  const copiesTable = useClientDataTable(filteredCopies, [search, copyBookId, copyStatus, tab]);
  const loansTable = useClientDataTable(filteredLoans, [search, loanStatus, overdueOnly, tab]);

  const hasFilters = Boolean(
    search ||
      (tab === "books" && category) ||
      (tab === "copies" && (copyBookId || copyStatus)) ||
      (tab === "loans" && (loanStatus || overdueOnly))
  );

  function clearFilters() {
    setSearch("");
    setCategory("");
    setCopyBookId("");
    setCopyStatus("");
    setLoanStatus("");
    setOverdueOnly(false);
  }

  async function handleReturn(loan: LibraryLoan) {
    if (!canUpdate || !canReturnLoan(loan)) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await returnLibraryLoan(loan.id);
      setLoans((prev) =>
        prev.map((l) => (l.id === updated.id ? { ...l, ...updated } : l))
      );
      setCopies((prev) =>
        prev.map((c) =>
          c.id === loan.library_copy_id ? { ...c, status: "AVAILABLE" } : c
        )
      );
      setNotice("Exemplaire rendu.");
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteBook(book: LibraryBook) {
    if (!canDelete) return;
    if (!(await confirmDialog(`Supprimer « ${book.title} » ?`, { destructive: true }))) return;
    setBusy(true);
    try {
      await deleteLibraryBook(book.id);
      setBooks((prev) => prev.filter((b) => b.id !== book.id));
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteCopy(copy: LibraryCopy) {
    if (!canDelete || copy.status === "LOANED") return;
    if (!(await confirmDialog(`Supprimer l'exemplaire ${copy.copy_code} ?`, { destructive: true })))
      return;
    setBusy(true);
    try {
      await deleteLibraryCopy(copy.id);
      setCopies((prev) => prev.filter((c) => c.id !== copy.id));
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function bookTitle(bookId: number): string {
    return books.find((b) => b.id === bookId)?.title ?? `Ouvrage #${bookId}`;
  }

  const createLabel =
    tab === "books"
      ? "Nouvel ouvrage"
      : tab === "copies"
        ? "Nouvel exemplaire"
        : "Nouvel emprunt";
  const createResource =
    tab === "books" ? "library" : tab === "copies" ? "library-copies" : "library-loans";

  const searchPlaceholder =
    tab === "books"
      ? "Rechercher par titre, auteur ou ISBN…"
      : tab === "copies"
        ? "Rechercher par code ou titre…"
        : "Rechercher par élève ou exemplaire…";

  const currentRows =
    tab === "books"
      ? filteredBooks.length
      : tab === "copies"
        ? filteredCopies.length
        : filteredLoans.length;

  const emptyIcon = tab === "books" ? "menu_book" : tab === "copies" ? "library_books" : "assignment_return";
  const emptyTitle =
    tab === "books"
      ? "Aucun ouvrage trouvé"
      : tab === "copies"
        ? "Aucun exemplaire trouvé"
        : "Aucun emprunt trouvé";
  const emptyHint =
    tab === "books"
      ? "Aucun résultat pour ces filtres, ou le catalogue est encore vide."
      : tab === "copies"
        ? "Aucun résultat pour ces filtres, ou aucun exemplaire n'est enregistré."
        : "Aucun résultat pour ces filtres, ou aucun emprunt n'est enregistré.";

  return (
    <div className="flex flex-col w-full h-full max-w-[1400px] mx-auto gap-lg pb-xl">
      {error && (
        <div
          role="alert"
          className="rounded-lg bg-error-container text-on-error-container px-md py-sm font-body-sm"
        >
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-lg bg-secondary-container text-on-secondary-container px-md py-sm font-body-sm">
          {notice}
        </div>
      )}

      <div className="ui-table-shell flex-1 flex flex-col">
        <div className="px-lg pt-lg pb-md flex flex-wrap items-center gap-sm border-b border-outline-variant/15">
          <div className="flex flex-wrap gap-xs" data-testid="library-tabs">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`px-md py-sm rounded-lg font-label-caps text-label-caps whitespace-nowrap transition-colors ${
                  tab === t.id
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest"
                }`}
                onClick={() => {
                  setTab(t.id);
                  setSearch("");
                }}
                type="button"
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="ui-search-field flex-1 min-w-[200px] h-10 py-0">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
              search
            </span>
            <input
              aria-label="Rechercher"
              className="ui-search-input ml-sm h-full"
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              type="text"
              value={search}
            />
          </div>
          {tab === "books" && (
            <select
              aria-label="Filtrer par catégorie"
              className="ui-input cursor-pointer h-10 py-0"
              onChange={(e) => setCategory(e.target.value)}
              value={category}
            >
              <option value="">Toutes catégories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
          {tab === "copies" && (
            <>
              <select
                aria-label="Filtrer par ouvrage"
                className="ui-input cursor-pointer h-10 py-0"
                onChange={(e) => setCopyBookId(e.target.value)}
                value={copyBookId}
              >
                <option value="">Tous les ouvrages</option>
                {books.map((b) => (
                  <option key={b.id} value={String(b.id)}>
                    {b.title}
                  </option>
                ))}
              </select>
              <select
                aria-label="Filtrer exemplaires par statut"
                className="ui-input cursor-pointer h-10 py-0"
                onChange={(e) => setCopyStatus(e.target.value)}
                value={copyStatus}
              >
                <option value="">Tous les statuts</option>
                {(Object.keys(LIBRARY_COPY_STATUS_LABELS) as LibraryCopyStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {LIBRARY_COPY_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </>
          )}
          {tab === "loans" && (
            <>
              <select
                aria-label="Filtrer emprunts par statut"
                className="ui-input cursor-pointer h-10 py-0"
                disabled={overdueOnly}
                onChange={(e) => setLoanStatus(e.target.value)}
                value={loanStatus}
              >
                <option value="">Tous les statuts</option>
                {(Object.keys(LIBRARY_LOAN_STATUS_LABELS) as LibraryLoanStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {LIBRARY_LOAN_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
              <label className="inline-flex items-center gap-sm h-10 px-md text-[13px] text-on-surface-variant cursor-pointer select-none">
                <input
                  checked={overdueOnly}
                  className="size-4 rounded border-outline-variant accent-primary"
                  onChange={(e) => setOverdueOnly(e.target.checked)}
                  type="checkbox"
                />
                Retards uniquement
              </label>
            </>
          )}
          {hasFilters && (
            <button
              className="inline-flex items-center gap-xs h-10 px-md text-[13px] text-on-surface-variant hover:text-primary transition-colors"
              onClick={clearFilters}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">filter_alt_off</span>
              Réinitialiser
            </button>
          )}
          <div className="ml-auto shrink-0 flex items-center gap-sm">
            <DataTableRefreshButton loading={loading} onRefresh={() => void reload()} />
            {canCreate && (
              <CrudCreateLink
                className="inline-flex items-center gap-sm h-10 bg-primary hover:bg-primary/90 text-on-primary font-label-caps text-label-caps px-md rounded-lg transition-colors shadow-sm"
                label={createLabel}
                resource={createResource}
              />
            )}
          </div>
        </div>

        <div className="overflow-auto min-h-[320px]">
          {loading ? (
            <DataTableSkeleton
              columns={
                tab === "books"
                  ? LIBRARY_BOOKS_TABLE_SKELETON_COLUMNS
                  : tab === "copies"
                    ? LIBRARY_COPIES_TABLE_SKELETON_COLUMNS
                    : LIBRARY_LOANS_TABLE_SKELETON_COLUMNS
              }
              label={
                tab === "books"
                  ? "Chargement des ouvrages…"
                  : tab === "copies"
                    ? "Chargement des exemplaires…"
                    : "Chargement des emprunts…"
              }
              labels={
                tab === "books"
                  ? ["", "Titre", "Auteur", "Catégorie", "ISBN", ""]
                  : tab === "copies"
                    ? ["", "Code", "Ouvrage", "Statut", ""]
                    : ["", "Élève", "Exemplaire", "Échéance", "Statut", ""]
              }
              rows={10}
              testId="library-loading"
            />
          ) : currentRows === 0 ? (
            <div
              className="flex flex-col items-center justify-center px-lg py-2xl text-center"
              data-testid="library-empty"
            >
              <span className="material-symbols-outlined text-[40px] text-on-surface-variant/50 mb-md">
                {emptyIcon}
              </span>
              <h3 className="font-title-md text-on-surface mb-xs">{emptyTitle}</h3>
              <p className="font-body-sm text-on-surface-variant max-w-sm mb-lg">{emptyHint}</p>
              <div className="flex flex-wrap gap-sm justify-center">
                {hasFilters && (
                  <button className="ui-btn-secondary" onClick={clearFilters} type="button">
                    Effacer les filtres
                  </button>
                )}
                {canCreate && (
                  <CrudCreateLink label={createLabel} resource={createResource} />
                )}
              </div>
            </div>
          ) : tab === "books" ? (
            <table className="w-full text-left border-collapse" data-testid="library-books-table">
              <thead className="bg-surface-container-low/80 sticky top-0 z-10">
                <tr>
                  <DataTableSelectHeader
                    checked={booksTable.allPageSelected}
                    indeterminate={booksTable.somePageSelected && !booksTable.allPageSelected}
                    onChange={booksTable.toggleAllPage}
                  />
                  <th className="px-lg py-sm ui-stat-label whitespace-nowrap">Titre</th>
                  <th className="px-lg py-sm ui-stat-label whitespace-nowrap">Auteur</th>
                  <th className="px-lg py-sm ui-stat-label whitespace-nowrap">Catégorie</th>
                  <th className="px-lg py-sm ui-stat-label whitespace-nowrap">ISBN</th>
                  <th className="px-lg py-sm ui-stat-label whitespace-nowrap text-right sticky right-0 bg-surface-container-low/95 w-16">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="text-body-sm font-body-sm divide-y divide-outline-variant/10">
                {booksTable.pageRows.map((book, index) => {
                  const zebra = index % 2 === 1;
                  return (
                    <tr className={`group ${tableRowClass(index)}`} key={book.id}>
                      <DataTableSelectCell
                        checked={booksTable.selectedIds.has(book.id)}
                        label={book.title}
                        onChange={() => booksTable.toggleOne(book.id)}
                      />
                      <td className="px-lg py-sm align-middle font-semibold text-on-surface truncate">
                        {book.title}
                      </td>
                      <td className="px-lg py-sm align-middle text-on-surface">
                        {book.author || "—"}
                      </td>
                      <td className="px-lg py-sm align-middle text-on-surface-variant">
                        {book.category || "—"}
                      </td>
                      <td className="px-lg py-sm align-middle font-mono-data text-[12px] text-on-surface-variant tracking-wide">
                        {book.isbn || "—"}
                      </td>
                      <td
                        className={`px-lg py-sm align-middle sticky right-0 text-right overflow-visible group-hover:bg-surface-container-low/70 ${
                          zebra
                            ? "bg-surface-container-low/45"
                            : "bg-surface-container-lowest"
                        }`}
                      >
                        <DataTableActionsMenu
                          ariaLabel={`Actions pour ${book.title}`}
                          items={crudRowActions({
                            edit: { resource: "library", recordId: book.id },
                            delete: {
                              onClick: () => void handleDeleteBook(book),
                              disabled: busy,
                            },
                            canUpdate,
                            canDelete,
                          })}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : tab === "copies" ? (
            <table className="w-full text-left border-collapse" data-testid="library-copies-table">
              <thead className="bg-surface-container-low/80 sticky top-0 z-10">
                <tr>
                  <DataTableSelectHeader
                    checked={copiesTable.allPageSelected}
                    indeterminate={copiesTable.somePageSelected && !copiesTable.allPageSelected}
                    onChange={copiesTable.toggleAllPage}
                  />
                  <th className="px-lg py-sm ui-stat-label whitespace-nowrap">Code</th>
                  <th className="px-lg py-sm ui-stat-label whitespace-nowrap">Ouvrage</th>
                  <th className="px-lg py-sm ui-stat-label whitespace-nowrap">Statut</th>
                  <th className="px-lg py-sm ui-stat-label whitespace-nowrap text-right sticky right-0 bg-surface-container-low/95 w-16">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="text-body-sm font-body-sm divide-y divide-outline-variant/10">
                {copiesTable.pageRows.map((copy, index) => {
                  const zebra = index % 2 === 1;
                  return (
                    <tr className={`group ${tableRowClass(index)}`} key={copy.id}>
                      <DataTableSelectCell
                        checked={copiesTable.selectedIds.has(copy.id)}
                        label={copy.copy_code}
                        onChange={() => copiesTable.toggleOne(copy.id)}
                      />
                      <td className="px-lg py-sm align-middle font-mono-data text-[12px] text-on-surface-variant tracking-wide">
                        {copy.copy_code}
                      </td>
                      <td className="px-lg py-sm align-middle font-semibold text-on-surface">
                        {copy.book?.title ?? bookTitle(copy.library_book_id)}
                      </td>
                      <td className="px-lg py-sm align-middle">
                        <StatusBadge
                          label={LIBRARY_COPY_STATUS_LABELS[copy.status]}
                          tone={copyTone(copy.status)}
                          withDot
                        />
                      </td>
                      <td
                        className={`px-lg py-sm align-middle sticky right-0 text-right overflow-visible group-hover:bg-surface-container-low/70 ${
                          zebra
                            ? "bg-surface-container-low/45"
                            : "bg-surface-container-lowest"
                        }`}
                      >
                        <DataTableActionsMenu
                          ariaLabel={`Actions pour ${copy.copy_code}`}
                          items={crudRowActions({
                            edit: { resource: "library-copies", recordId: copy.id },
                            delete:
                              copy.status !== "LOANED"
                                ? {
                                    onClick: () => void handleDeleteCopy(copy),
                                    disabled: busy,
                                  }
                                : undefined,
                            canUpdate,
                            canDelete: canDelete && copy.status !== "LOANED",
                          })}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse" data-testid="library-loans-table">
              <thead className="bg-surface-container-low/80 sticky top-0 z-10">
                <tr>
                  <DataTableSelectHeader
                    checked={loansTable.allPageSelected}
                    indeterminate={loansTable.somePageSelected && !loansTable.allPageSelected}
                    onChange={loansTable.toggleAllPage}
                  />
                  <th className="px-lg py-sm ui-stat-label whitespace-nowrap">Élève</th>
                  <th className="px-lg py-sm ui-stat-label whitespace-nowrap">Exemplaire</th>
                  <th className="px-lg py-sm ui-stat-label whitespace-nowrap">Échéance</th>
                  <th className="px-lg py-sm ui-stat-label whitespace-nowrap">Statut</th>
                  <th className="px-lg py-sm ui-stat-label whitespace-nowrap text-right sticky right-0 bg-surface-container-low/95 w-16">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="text-body-sm font-body-sm divide-y divide-outline-variant/10">
                {loansTable.pageRows.map((loan, index) => {
                  const zebra = index % 2 === 1;
                  const studentLabel = loan.student
                    ? studentFullName(loan.student)
                    : `Élève #${loan.student_id}`;
                  return (
                    <tr className={`group ${tableRowClass(index)}`} key={loan.id}>
                      <DataTableSelectCell
                        checked={loansTable.selectedIds.has(loan.id)}
                        label={studentLabel}
                        onChange={() => loansTable.toggleOne(loan.id)}
                      />
                      <td className="px-lg py-sm align-middle font-semibold text-on-surface">
                        {studentLabel}
                      </td>
                      <td className="px-lg py-sm align-middle font-mono-data text-[12px] text-on-surface-variant tracking-wide">
                        {loan.copy?.copy_code ?? `#${loan.library_copy_id}`}
                      </td>
                      <td className="px-lg py-sm align-middle font-mono-data text-[13px] text-on-surface-variant">
                        {loan.due_date}
                      </td>
                      <td className="px-lg py-sm align-middle">
                        <StatusBadge
                          label={LIBRARY_LOAN_STATUS_LABELS[loan.status]}
                          tone={loanTone(loan.status)}
                          withDot
                        />
                      </td>
                      <td
                        className={`px-lg py-sm align-middle sticky right-0 text-right overflow-visible group-hover:bg-surface-container-low/70 ${
                          zebra
                            ? "bg-surface-container-low/45"
                            : "bg-surface-container-lowest"
                        }`}
                      >
                        <DataTableActionsMenu
                          ariaLabel={`Actions pour l'emprunt #${loan.id}`}
                          items={
                            canReturnLoan(loan) && canUpdate
                              ? [
                                  {
                                    kind: "button",
                                    label: "Retour",
                                    icon: "undo",
                                    onClick: () => void handleReturn(loan),
                                    disabled: busy,
                                  },
                                ]
                              : []
                          }
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {!loading && tab === "books" && filteredBooks.length > 0 && (
          <DataTablePagination
            canNextPage={booksTable.canNextPage}
            canPreviousPage={booksTable.canPreviousPage}
            entityLabel="ouvrages"
            filteredHint={
              filteredBooks.length !== books.length
                ? `filtre sur ${books.length}`
                : undefined
            }
            from={booksTable.from}
            onFirstPage={() => booksTable.setPageIndex(0)}
            onLastPage={() => booksTable.setPageIndex(booksTable.pageCount - 1)}
            onNextPage={() => booksTable.setPageIndex(booksTable.pageIndex + 1)}
            onPageChange={booksTable.setPageIndex}
            onPageSizeChange={booksTable.setPageSize}
            onPreviousPage={() => booksTable.setPageIndex(booksTable.pageIndex - 1)}
            pageCount={booksTable.pageCount}
            pageIndex={booksTable.pageIndex}
            pageSize={booksTable.pageSize}
            testId="library-books-pagination"
            to={booksTable.to}
            total={filteredBooks.length}
          />
        )}
        {!loading && tab === "copies" && filteredCopies.length > 0 && (
          <DataTablePagination
            canNextPage={copiesTable.canNextPage}
            canPreviousPage={copiesTable.canPreviousPage}
            entityLabel="exemplaires"
            filteredHint={
              filteredCopies.length !== copies.length
                ? `filtre sur ${copies.length}`
                : undefined
            }
            from={copiesTable.from}
            onFirstPage={() => copiesTable.setPageIndex(0)}
            onLastPage={() => copiesTable.setPageIndex(copiesTable.pageCount - 1)}
            onNextPage={() => copiesTable.setPageIndex(copiesTable.pageIndex + 1)}
            onPageChange={copiesTable.setPageIndex}
            onPageSizeChange={copiesTable.setPageSize}
            onPreviousPage={() => copiesTable.setPageIndex(copiesTable.pageIndex - 1)}
            pageCount={copiesTable.pageCount}
            pageIndex={copiesTable.pageIndex}
            pageSize={copiesTable.pageSize}
            testId="library-copies-pagination"
            to={copiesTable.to}
            total={filteredCopies.length}
          />
        )}
        {!loading && tab === "loans" && filteredLoans.length > 0 && (
          <DataTablePagination
            canNextPage={loansTable.canNextPage}
            canPreviousPage={loansTable.canPreviousPage}
            entityLabel="emprunts"
            filteredHint={
              filteredLoans.length !== loans.length
                ? `filtre sur ${loans.length}`
                : undefined
            }
            from={loansTable.from}
            onFirstPage={() => loansTable.setPageIndex(0)}
            onLastPage={() => loansTable.setPageIndex(loansTable.pageCount - 1)}
            onNextPage={() => loansTable.setPageIndex(loansTable.pageIndex + 1)}
            onPageChange={loansTable.setPageIndex}
            onPageSizeChange={loansTable.setPageSize}
            onPreviousPage={() => loansTable.setPageIndex(loansTable.pageIndex - 1)}
            pageCount={loansTable.pageCount}
            pageIndex={loansTable.pageIndex}
            pageSize={loansTable.pageSize}
            testId="library-loans-pagination"
            to={loansTable.to}
            total={filteredLoans.length}
          />
        )}
      </div>
    </div>
  );
}
