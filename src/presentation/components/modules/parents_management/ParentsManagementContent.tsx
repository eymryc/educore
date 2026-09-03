"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CrudCreateLink } from "@/presentation/components/forms/CrudLinks";
import {
  crudRowActions,
  DataTableActionsMenu,
} from "@/presentation/components/shared/DataTableActionsMenu";
import { StatusBadge } from "@/presentation/components/shared/StatusBadge";
import {
  DataTableRefreshButton,
  DataTableSelectCell,
  DataTableSelectHeader,
} from "@/presentation/components/shared/DataTableControls";
import {
  DataTableSkeleton,
  PARENTS_TABLE_SKELETON_COLUMNS,
} from "@/presentation/components/shared/DataTableSkeleton";
import { DataTablePagination } from "@/presentation/components/shared/DataTablePagination";
import {
  tableRowClass,
  useClientDataTable,
} from "@/presentation/components/shared/data-table-utils";
import { deleteGuardian, listGuardians } from "@/infrastructure/api/resources/guardians";
import { useAuth, getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import { can } from "@/shared/lib/permissions";
import {
  filterGuardians,
  guardianFullName,
  type Guardian,
} from "@/shared/types/guardian.types";
import { useConfirm } from "@/presentation/components/providers/ConfirmDialogProvider";

export function ParentsManagementContent() {
  const confirmDialog = useConfirm();
  const { user } = useAuth();
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [portal, setPortal] = useState<"all" | "with" | "without">("all");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const canCreate = can(user, "guardians.create");
  const canUpdate = can(user, "guardians.update");
  const canDelete = can(user, "guardians.delete");

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      setGuardians(await listGuardians());
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  const filtered = useMemo(
    () => filterGuardians(guardians, { search, portal }),
    [guardians, search, portal]
  );

  const {
    pageIndex,
    pageSize,
    pageCount,
    pageRows,
    from,
    to,
    selectedIds,
    allPageSelected,
    somePageSelected,
    setPageIndex,
    setPageSize,
    toggleAllPage,
    toggleOne,
    canPreviousPage,
    canNextPage,
  } = useClientDataTable(filtered, [search, portal]);

  async function handleDelete(guardian: Guardian) {
    if (!canDelete) return;
    if (!await confirmDialog(`Supprimer ${guardianFullName(guardian)} ?`)) return;
    setDeletingId(guardian.id);
    try {
      await deleteGuardian(guardian.id);
      setGuardians((prev) => prev.filter((g) => g.id !== guardian.id));
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

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

      <div className="ui-table-shell flex flex-col">
        <div className="px-lg pt-lg pb-md flex flex-wrap items-center gap-sm border-b border-outline-variant/15">
          <div className="ui-search-field flex-1 min-w-[200px] h-10 py-0">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
              search
            </span>
            <input
              aria-label="Rechercher un parent"
              className="ui-search-input ml-sm h-full"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, e-mail ou téléphone…"
              type="text"
              value={search}
            />
          </div>
          <div className="flex items-center gap-xs bg-surface-container rounded-lg p-xs">
            {(
              [
                ["all", "Tous"],
                ["with", "Portail"],
                ["without", "Sans portail"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                className={`px-md py-xs rounded font-title-sm text-title-sm transition-colors ${
                  portal === value
                    ? "bg-surface-container-lowest text-on-surface shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
                onClick={() => setPortal(value)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
          <div className="ml-auto shrink-0 flex items-center gap-sm">
            <DataTableRefreshButton loading={loading} onRefresh={() => void reload()} />
            {canCreate && (
              <CrudCreateLink
                className="inline-flex items-center gap-sm h-10 bg-primary hover:bg-primary/90 text-on-primary font-label-caps text-label-caps px-md rounded-lg transition-colors shadow-sm"
                label="AJOUTER UN PARENT"
                resource="parents"
              />
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <DataTableSkeleton
              columns={PARENTS_TABLE_SKELETON_COLUMNS}
              label="Chargement des parents…"
              labels={["", "Nom", "Prénom", "E-mail", "Téléphone", "Élèves liés", "Portail", ""]}
              rows={10}
              testId="parents-loading"
            />
          ) : filtered.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center p-2xl text-center"
              data-testid="parents-empty"
            >
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-md">
                family_restroom
              </span>
              <h3 className="font-headline-md text-headline-md mb-xs">Aucun parent trouvé</h3>
              <p className="font-body-md text-on-surface-variant mb-lg max-w-md">
                Aucun parent ne correspond à vos filtres, ou l&apos;annuaire est vide.
              </p>
              {canCreate && <CrudCreateLink resource="parents" label="AJOUTER UN PARENT" />}
            </div>
          ) : (
            <table className="w-full text-left border-collapse" data-testid="parents-table">
              <thead className="bg-surface-container-low/80 sticky top-0 z-10">
                <tr className="ui-table-head-row">
                  <DataTableSelectHeader
                    checked={allPageSelected}
                    indeterminate={somePageSelected && !allPageSelected}
                    onChange={toggleAllPage}
                  />
                  <th className="py-md px-lg font-semibold">Nom</th>
                  <th className="py-md px-lg font-semibold">Prénom</th>
                  <th className="py-md px-lg font-semibold">E-mail</th>
                  <th className="py-md px-lg font-semibold">Téléphone</th>
                  <th className="py-md px-lg font-semibold">Élèves liés</th>
                  <th className="py-md px-lg font-semibold">Portail</th>
                  <th className="py-md px-lg font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-body-sm text-on-surface">
                {pageRows.map((guardian, index) => (
                  <tr className={tableRowClass(index)} key={guardian.id}>
                    <DataTableSelectCell
                      checked={selectedIds.has(guardian.id)}
                      label={guardianFullName(guardian)}
                      onChange={() => toggleOne(guardian.id)}
                    />
                    <td className="py-md px-lg">
                      <Link
                        className="font-semibold text-on-surface hover:text-primary transition-colors"
                        href={`/parents/${guardian.id}`}
                      >
                        {guardian.last_name}
                      </Link>
                    </td>
                    <td className="py-md px-lg">
                      <Link
                        className="hover:text-primary"
                        href={`/parents/${guardian.id}`}
                      >
                        {guardian.first_name}
                      </Link>
                    </td>
                    <td className="py-md px-lg font-mono-data text-[13px]">
                      {guardian.email || "—"}
                    </td>
                    <td className="py-md px-lg text-on-surface-variant">
                      {guardian.phone || "—"}
                    </td>
                    <td className="py-md px-lg">{guardian.students_count ?? 0}</td>
                    <td className="py-md px-lg">
                      <StatusBadge
                        label={guardian.user_id ? "Actif" : "Sans compte"}
                        tone={guardian.user_id ? "success" : "neutral"}
                        withDot
                      />
                    </td>
                    <td className="py-md px-lg text-right">
                      <DataTableActionsMenu
                        ariaLabel={`Actions pour ${guardianFullName(guardian)}`}
                        items={crudRowActions({
                          view: {
                            href: `/parents/${guardian.id}`,
                            label: "Voir la fiche",
                            icon: "link",
                          },
                          edit: { resource: "parents", recordId: guardian.id },
                          delete: {
                            onClick: () => void handleDelete(guardian),
                            disabled: deletingId === guardian.id,
                          },
                          canUpdate,
                          canDelete,
                        })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!loading && filtered.length > 0 && (
          <DataTablePagination
            canNextPage={canNextPage}
            canPreviousPage={canPreviousPage}
            entityLabel="parents"
            filteredHint={
              filtered.length !== guardians.length
                ? `filtre sur ${guardians.length}`
                : undefined
            }
            from={from}
            onFirstPage={() => setPageIndex(0)}
            onLastPage={() => setPageIndex(pageCount - 1)}
            onNextPage={() => setPageIndex(pageIndex + 1)}
            onPageChange={setPageIndex}
            onPageSizeChange={setPageSize}
            onPreviousPage={() => setPageIndex(pageIndex - 1)}
            pageCount={pageCount}
            pageIndex={pageIndex}
            pageSize={pageSize}
            testId="parents-pagination"
            to={to}
            total={filtered.length}
          />
        )}
      </div>
    </div>
  );
}
