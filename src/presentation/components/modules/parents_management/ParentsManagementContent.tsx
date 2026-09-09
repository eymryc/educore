"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
import {
  DATA_TABLE_CREATE_CLASS,
  DataTableSearch,
  DataTableShell,
  DataTableToolbar,
  DataTableToolbarActions,
} from "@/presentation/components/shared/DataTable";
import { DataTablePagination } from "@/presentation/components/shared/DataTablePagination";
import {
  DEFAULT_TABLE_PAGE_SIZE,
  tableRowClass,
} from "@/presentation/components/shared/data-table-utils";
import { deleteGuardian, listGuardiansPage } from "@/infrastructure/api/resources/guardians";
import { emptyPaginationMeta, type PaginationMeta } from "@/shared/types/api.types";
import { useAuth, getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import { can } from "@/shared/lib/permissions";
import { guardianFullName, type Guardian } from "@/shared/types/guardian.types";
import { useConfirm } from "@/presentation/components/providers/ConfirmDialogProvider";

export function ParentsManagementContent() {
  const confirmDialog = useConfirm();
  const { user } = useAuth();
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(emptyPaginationMeta());
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_TABLE_PAGE_SIZE);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
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
      const result = await listGuardiansPage({
        ...(search ? { search } : {}),
        ...(portal !== "all" ? { portal } : {}),
        page,
        per_page: perPage,
      });
      setGuardians(result.data);
      setMeta(result.meta);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- search/portal/page/perPage drive API filters
  }, [search, portal, page, perPage]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [search, portal, page, perPage]);

  const allPageSelected =
    guardians.length > 0 && guardians.every((g) => selectedIds.has(g.id));
  const somePageSelected = guardians.some((g) => selectedIds.has(g.id));

  function toggleAllPage() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        guardians.forEach((g) => next.delete(g.id));
      } else {
        guardians.forEach((g) => next.add(g.id));
      }
      return next;
    });
  }

  function toggleOne(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const from = meta.total === 0 ? 0 : (meta.current_page - 1) * meta.per_page + 1;
  const to = Math.min(meta.current_page * meta.per_page, meta.total);

  async function handleDelete(guardian: Guardian) {
    if (!canDelete) return;
    if (!await confirmDialog(`Supprimer ${guardianFullName(guardian)} ?`)) return;
    setDeletingId(guardian.id);
    try {
      await deleteGuardian(guardian.id);
      if (guardians.length <= 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        await reload();
      }
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

      <DataTableShell>
        <DataTableToolbar>
          <DataTableSearch
            ariaLabel="Rechercher un parent"
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Rechercher par nom, e-mail ou téléphone…"
            value={search}
          />
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
                onClick={() => {
                  setPortal(value);
                  setPage(1);
                }}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
          <DataTableToolbarActions>
            <DataTableRefreshButton loading={loading} onRefresh={() => void reload()} />
            {canCreate && (
              <CrudCreateLink
                className={DATA_TABLE_CREATE_CLASS}
                label="AJOUTER UN PARENT"
                resource="parents"
              />
            )}
          </DataTableToolbarActions>
        </DataTableToolbar>

        <div className="overflow-x-auto">
          {loading ? (
            <DataTableSkeleton
              columns={PARENTS_TABLE_SKELETON_COLUMNS}
              label="Chargement des parents…"
              labels={["", "Nom", "Prénom", "E-mail", "Téléphone", "Élèves liés", "Portail", ""]}
              rows={10}
              testId="parents-loading"
            />
          ) : meta.total === 0 ? (
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
                {guardians.map((guardian, index) => (
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

        {!loading && meta.total > 0 && (
          <DataTablePagination
            canNextPage={meta.current_page < meta.last_page}
            canPreviousPage={meta.current_page > 1}
            entityLabel="parents"
            from={from}
            onFirstPage={() => setPage(1)}
            onLastPage={() => setPage(meta.last_page)}
            onNextPage={() => setPage((p) => p + 1)}
            onPageChange={(index) => setPage(index + 1)}
            onPageSizeChange={(size) => {
              setPerPage(size);
              setPage(1);
            }}
            onPreviousPage={() => setPage((p) => Math.max(1, p - 1))}
            pageCount={meta.last_page}
            pageIndex={meta.current_page - 1}
            pageSize={perPage}
            testId="parents-pagination"
            to={to}
            total={meta.total}
          />
        )}
      </DataTableShell>
    </div>
  );
}
