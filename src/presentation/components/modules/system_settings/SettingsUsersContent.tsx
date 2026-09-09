"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DataTableActionsMenu } from "@/presentation/components/shared/DataTableActionsMenu";
import { DataTableRefreshButton } from "@/presentation/components/shared/DataTableControls";
import { DataTableSkeleton } from "@/presentation/components/shared/DataTableSkeleton";
import { DataTablePagination } from "@/presentation/components/shared/DataTablePagination";
import {
  DataTableShell,
  DataTableToolbar,
  DataTableSearch,
  DataTableFilterSelect,
  DataTableEmpty,
  DATA_TABLE_CREATE_CLASS,
  DATA_TABLE_TH_CLASS,
  DATA_TABLE_TD_CLASS,
  DATA_TABLE_TH_ACTIONS_CLASS,
  DATA_TABLE_TD_ACTIONS_CLASS,
} from "@/presentation/components/shared/DataTable";
import { Checkbox } from "@/presentation/components/shared/Checkbox";
import { StatusBadge } from "@/presentation/components/shared/StatusBadge";
import {
  DEFAULT_TABLE_PAGE_SIZE,
  tableRowClass,
} from "@/presentation/components/shared/data-table-utils";
import {
  createUser,
  deleteUser,
  listUsers,
  updateUser,
} from "@/infrastructure/api/resources/identity";
import { useAuth, getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import { can, hasRole, ROLE_LABELS, roleLabel } from "@/shared/lib/permissions";
import type { AuthUser, PaginationMeta } from "@/shared/types/api.types";
import { emptyUserListMeta } from "@/shared/types/identity.types";
import { useConfirm } from "@/presentation/components/providers/ConfirmDialogProvider";

const INPUT_CLASS = "ui-input w-full";

function assignableRoles(actor: AuthUser | null): string[] {
  return Object.keys(ROLE_LABELS).filter(
    (name) => name !== "SUPER_ADMIN" || hasRole(actor, "SUPER_ADMIN")
  );
}

export function SettingsUsersContent() {
  const { user } = useAuth();
  const confirmDialog = useConfirm();
  const canView = can(user, "settings.view");
  const canUpdate = can(user, "settings.update");
  const canDelete = can(user, "settings.delete");

  const [rows, setRows] = useState<AuthUser[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(emptyUserListMeta());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_TABLE_PAGE_SIZE);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AuthUser | null>(null);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRoles, setFormRoles] = useState<string[]>([]);

  const roleOptions = useMemo(
    () => Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label })),
    []
  );
  const availableRoles = useMemo(() => assignableRoles(user), [user]);
  const editingSelf = editing != null && user?.id === editing.id;

  const reload = useCallback(async () => {
    if (!canView) {
      setLoading(false);
      setError("Accès réservé — vous n'avez pas la permission de gérer les utilisateurs.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await listUsers({
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(role ? { role } : {}),
        page,
        per_page: perPage,
      });
      setRows(result.data);
      setMeta(result.meta);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [canView, search, role, page, perPage]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const from = meta.total === 0 ? 0 : (meta.current_page - 1) * meta.per_page + 1;
  const to = Math.min(meta.current_page * meta.per_page, meta.total);

  function openCreate() {
    setEditing(null);
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormRoles(["SECRETARY"]);
    setFormOpen(true);
    setNotice(null);
    setError(null);
  }

  function openEdit(row: AuthUser) {
    setEditing(row);
    setFormName(row.name);
    setFormEmail(row.email);
    setFormPassword("");
    setFormRoles(row.roles?.length ? [...row.roles] : []);
    setFormOpen(true);
    setNotice(null);
    setError(null);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    setFormPassword("");
  }

  function toggleFormRole(name: string) {
    if (editingSelf) return;
    setFormRoles((prev) =>
      prev.includes(name) ? prev.filter((r) => r !== name) : [...prev, name]
    );
  }

  async function submitForm() {
    if (!canUpdate) return;
    if (!formName.trim() || !formEmail.trim()) {
      setError("Le nom et l'e-mail sont obligatoires.");
      return;
    }
    if (!editing && formPassword.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (editing && formPassword && formPassword.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (!editingSelf && formRoles.length === 0) {
      setError("Attribuez au moins un rôle.");
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (editing) {
        const payload: Parameters<typeof updateUser>[1] = {
          name: formName.trim(),
          email: formEmail.trim(),
        };
        if (formPassword) payload.password = formPassword;
        if (!editingSelf) payload.roles = formRoles;
        const updated = await updateUser(editing.id, payload);
        setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        setNotice(`Compte « ${updated.name} » mis à jour.`);
      } else {
        const created = await createUser({
          name: formName.trim(),
          email: formEmail.trim(),
          password: formPassword,
          roles: formRoles,
        });
        setNotice(`Compte « ${created.name} » créé.`);
        await reload();
      }
      closeForm();
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(row: AuthUser) {
    if (!canDelete || row.id === user?.id) return;
    if (
      !(await confirmDialog(`Supprimer le compte de ${row.name} (${row.email}) ?`, {
        destructive: true,
      }))
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await deleteUser(row.id);
      if (rows.length <= 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        await reload();
      }
      setNotice(`Compte « ${row.name} » supprimé.`);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (!canView && error) {
    return (
      <div
        className="bg-error-container text-on-error-container px-md py-sm rounded-xl font-body-sm"
        data-testid="users-forbidden"
        role="alert"
      >
        {error}
      </div>
    );
  }

  return (
    <DataTableShell testId="users-table">
      {error && !loading && (
        <div
          className="flex items-start gap-sm bg-error-container text-on-error-container px-md py-sm font-body-sm"
          data-testid="users-error"
          role="alert"
        >
          <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
          <span>{error}</span>
        </div>
      )}
      {notice && (
        <div
          className="flex items-start gap-sm bg-secondary-container text-on-secondary-container px-md py-sm font-body-sm"
          data-testid="users-notice"
        >
          <span className="material-symbols-outlined text-[18px] shrink-0">check_circle</span>
          <span>{notice}</span>
        </div>
      )}

      <DataTableToolbar>
        <div className="flex flex-col sm:flex-row sm:items-center gap-sm flex-wrap">
          <DataTableSearch
            ariaLabel="Rechercher un utilisateur"
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Nom ou e-mail"
            value={search}
          />
          <DataTableFilterSelect
            ariaLabel="Filtrer par rôle"
            onChange={(value) => {
              setRole(value);
              setPage(1);
            }}
            options={roleOptions}
            placeholder="Tous les rôles"
            value={role}
          />
          <DataTableRefreshButton loading={loading} onRefresh={() => void reload()} />
        </div>
        {canUpdate && (
          <button className={DATA_TABLE_CREATE_CLASS} onClick={openCreate} type="button">
            <span aria-hidden className="material-symbols-outlined text-[18px]">
              person_add
            </span>
            Nouvel utilisateur
          </button>
        )}
      </DataTableToolbar>

      {formOpen && (
        <div
          className="border-b border-outline-variant/20 bg-surface-container-low/40 px-md sm:px-lg py-md"
          data-testid="user-form"
        >
          <h3 className="font-title-sm text-[15px] mb-md">
            {editing ? `Modifier ${editing.name}` : "Nouveau compte"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md max-w-3xl">
            <div className="flex flex-col gap-xs">
              <label className="ui-stat-label" htmlFor="user-name">
                Nom complet
              </label>
              <input
                className={INPUT_CLASS}
                id="user-name"
                onChange={(e) => setFormName(e.target.value)}
                value={formName}
              />
            </div>
            <div className="flex flex-col gap-xs">
              <label className="ui-stat-label" htmlFor="user-email">
                E-mail
              </label>
              <input
                autoComplete="off"
                className={INPUT_CLASS}
                id="user-email"
                onChange={(e) => setFormEmail(e.target.value)}
                type="email"
                value={formEmail}
              />
            </div>
            <div className="flex flex-col gap-xs sm:col-span-2">
              <label className="ui-stat-label" htmlFor="user-password">
                Mot de passe
              </label>
              <input
                autoComplete="new-password"
                className={INPUT_CLASS}
                id="user-password"
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder={editing ? "Laisser vide pour conserver" : "8 caractères minimum"}
                type="password"
                value={formPassword}
              />
            </div>
          </div>
          <div className="mt-md">
            <p className="ui-stat-label mb-sm">Rôles</p>
            {editingSelf && (
              <p className="text-[12px] text-on-surface-variant mb-sm">
                Vous ne pouvez pas modifier vos propres rôles.
              </p>
            )}
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-xs max-w-3xl">
              {availableRoles.map((name) => (
                <li className="flex items-center gap-sm" key={name}>
                  <Checkbox
                    ariaLabel={roleLabel(name)}
                    checked={formRoles.includes(name)}
                    disabled={busy || editingSelf}
                    onChange={() => toggleFormRole(name)}
                  />
                  <span className="text-[13px]">{roleLabel(name)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap gap-sm mt-md">
            <button
              className="ui-btn-primary h-10 px-md"
              disabled={busy}
              onClick={() => void submitForm()}
              type="button"
            >
              {busy ? "Enregistrement…" : "Enregistrer"}
            </button>
            <button className="ui-btn-secondary h-10 px-md" onClick={closeForm} type="button">
              Annuler
            </button>
          </div>
        </div>
      )}

      <div className="overflow-auto min-h-[280px]">
        {loading ? (
          <DataTableSkeleton
            label="Chargement des utilisateurs…"
            labels={["Nom", "E-mail", "Rôles", ""]}
            rows={8}
            testId="users-loading"
          />
        ) : meta.total === 0 ? (
          <DataTableEmpty
            description="Aucun compte ne correspond à ces filtres, ou aucun utilisateur n'est encore créé."
            icon="group_off"
            testId="users-empty"
            title="Aucun utilisateur"
          >
            {canUpdate && (
              <button className={DATA_TABLE_CREATE_CLASS} onClick={openCreate} type="button">
                Nouvel utilisateur
              </button>
            )}
          </DataTableEmpty>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-low/80 sticky top-0 z-10">
              <tr>
                <th className={DATA_TABLE_TH_CLASS}>Nom</th>
                <th className={DATA_TABLE_TH_CLASS}>E-mail</th>
                <th className={DATA_TABLE_TH_CLASS}>Rôles</th>
                <th className={DATA_TABLE_TH_ACTIONS_CLASS}>Actions</th>
              </tr>
            </thead>
            <tbody className="text-body-sm font-body-sm divide-y divide-outline-variant/10">
              {rows.map((row, index) => (
                <tr className={`group ${tableRowClass(index)}`} key={row.id}>
                  <td className={DATA_TABLE_TD_CLASS}>
                    <div className="font-semibold text-on-surface">{row.name}</div>
                    {row.id === user?.id && (
                      <div className="text-[12px] text-on-surface-variant">Votre compte</div>
                    )}
                  </td>
                  <td className={`${DATA_TABLE_TD_CLASS} text-on-surface-variant`}>{row.email}</td>
                  <td className={DATA_TABLE_TD_CLASS}>
                    <div className="flex flex-wrap gap-xs">
                      {(row.roles ?? []).map((r) => (
                        <StatusBadge key={r} label={roleLabel(r)} tone="info" />
                      ))}
                    </div>
                  </td>
                  <td className={DATA_TABLE_TD_ACTIONS_CLASS}>
                    <DataTableActionsMenu
                      ariaLabel={`Actions pour ${row.name}`}
                      items={[
                        ...(canUpdate
                          ? [
                              {
                                kind: "button" as const,
                                label: "Modifier",
                                icon: "edit",
                                onClick: () => openEdit(row),
                                disabled: busy,
                              },
                            ]
                          : []),
                        ...(canDelete && row.id !== user?.id
                          ? [
                              {
                                kind: "button" as const,
                                label: "Supprimer",
                                icon: "delete",
                                onClick: () => void handleDelete(row),
                                disabled: busy,
                                destructive: true,
                              },
                            ]
                          : []),
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {meta.total > 0 && (
        <DataTablePagination
          canNextPage={meta.current_page < meta.last_page}
          canPreviousPage={meta.current_page > 1}
          entityLabel="utilisateurs"
          from={from}
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
          testId="users-pagination"
          to={to}
          total={meta.total}
        />
      )}
    </DataTableShell>
  );
}
