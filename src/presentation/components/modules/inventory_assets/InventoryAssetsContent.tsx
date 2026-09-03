"use client";

import { useEffect, useMemo, useState } from "react";
import { CrudCreateLink } from "@/presentation/components/forms/CrudLinks";
import {
  crudRowActions,
  DataTableActionsMenu,
  type DataTableMenuItem,
} from "@/presentation/components/shared/DataTableActionsMenu";
import {
  DataTableRefreshButton,
  DataTableSelectCell,
  DataTableSelectHeader,
} from "@/presentation/components/shared/DataTableControls";
import { ContentSkeleton, PanelSkeleton } from "@/presentation/components/shared/DataTableSkeleton";
import { DataTablePagination } from "@/presentation/components/shared/DataTablePagination";
import { StatusBadge } from "@/presentation/components/shared/StatusBadge";
import {
  tableRowClass,
  useClientDataTable,
} from "@/presentation/components/shared/data-table-utils";
import {
  assignInventoryAsset,
  deleteInventoryAsset,
  getInventoryAsset,
  listInventoryAssets,
} from "@/infrastructure/api/resources/inventory";
import { listStaffMembers } from "@/infrastructure/api/resources/hr";
import { listInstitutionRooms } from "@/infrastructure/api/resources/institution";
import { useAuth, getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import { can } from "@/shared/lib/permissions";
import { formatMoneyFcfa } from "@/shared/types/finance.types";
import { staffMemberName } from "@/shared/types/hr.types";
import {
  INVENTORY_ASSET_STATUS_LABELS,
  INVENTORY_HISTORY_EVENT_LABELS,
  type InventoryAsset,
  type InventoryAssetHistory,
  type InventoryAssetStatus,
} from "@/shared/types/inventory.types";
import { useConfirm } from "@/presentation/components/providers/ConfirmDialogProvider";

function tone(status: InventoryAssetStatus): "success" | "warning" | "neutral" {
  if (status === "en_service") return "success";
  if (status === "maintenance") return "warning";
  return "neutral";
}

export function InventoryAssetsContent() {
  const confirmDialog = useConfirm();
  const { user } = useAuth();
  const [rows, setRows] = useState<InventoryAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [assignId, setAssignId] = useState<number | null>(null);
  const [location, setLocation] = useState("");
  const [staffId, setStaffId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [assignNotes, setAssignNotes] = useState("");
  const [staffOptions, setStaffOptions] = useState<
    { id: number; label: string }[]
  >([]);
  const [roomOptions, setRoomOptions] = useState<{ id: number; label: string }[]>(
    []
  );
  const [historyId, setHistoryId] = useState<number | null>(null);
  const [histories, setHistories] = useState<InventoryAssetHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const canView = can(user, "inventory.view");
  const canCreate = can(user, "inventory.create");
  const canUpdate = can(user, "inventory.update");
  const canDelete = can(user, "inventory.delete");

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      setRows(await listInventoryAssets());
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      return;
    }
    void reload();
  }, [canView]);

  useEffect(() => {
    if (!canUpdate) return;
    void (async () => {
      try {
        const [members, rooms] = await Promise.all([
          listStaffMembers(),
          listInstitutionRooms(),
        ]);
        setStaffOptions(
          members.map((m) => ({ id: m.id, label: staffMemberName(m) }))
        );
        setRoomOptions(
          rooms.map((r) => ({
            id: r.id,
            label: r.code ? `${r.name} (${r.code})` : r.name,
          }))
        );
      } catch {
        /* options optional for assign form */
      }
    })();
  }, [canUpdate]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (status && r.status !== status) return false;
      if (!q) return true;
      return `${r.designation} ${r.category} ${r.serial_number ?? ""} ${r.location ?? ""}`
        .toLowerCase()
        .includes(q);
    });
  }, [rows, search, status]);

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
  } = useClientDataTable(filtered, [search, status]);

  async function openHistory(row: InventoryAsset) {
    setHistoryId(row.id);
    setHistoryLoading(true);
    setError(null);
    try {
      const detail = await getInventoryAsset(row.id);
      setHistories(detail.histories ?? []);
      setRows((prev) => prev.map((r) => (r.id === detail.id ? detail : r)));
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setHistoryLoading(false);
    }
  }

  async function handleAssign() {
    if (!canUpdate || assignId == null) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await assignInventoryAsset(assignId, {
        location: location === "" ? null : location,
        assigned_staff_member_id: staffId === "" ? null : Number(staffId),
        assigned_room_id: roomId === "" ? null : Number(roomId),
        notes: assignNotes === "" ? null : assignNotes,
      });
      setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setNotice(`Affectation mise à jour pour « ${updated.designation} ».`);
      setAssignId(null);
      setLocation("");
      setStaffId("");
      setRoomId("");
      setAssignNotes("");
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(row: InventoryAsset) {
    if (!canDelete) return;
    if (!await confirmDialog(`Supprimer « ${row.designation} » ?`)) return;
    setBusy(true);
    try {
      await deleteInventoryAsset(row.id);
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      if (historyId === row.id) {
        setHistoryId(null);
        setHistories([]);
      }
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (!canView) {
    return (
      <p className="p-xl font-body-md text-on-surface-variant">
        Accès réservé (`inventory.view`).
      </p>
    );
  }

  return (
    <div
      className="flex flex-col w-full gap-lg pb-xl max-w-7xl mx-auto"
      data-testid="assets-panel"
    >
{error && (
        <div className="rounded-lg bg-error-container text-on-error-container px-md py-sm" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-lg bg-secondary-container text-on-secondary-container px-md py-sm">
          {notice}
        </div>
      )}
      {assignId != null && (
        <div className="ui-card p-lg flex flex-col gap-md max-w-xl" data-testid="assign-form">
          <h2 className="font-title-sm">Affecter — bien #{assignId}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            <div className="flex flex-col gap-xs md:col-span-2">
              <label className="ui-stat-label" htmlFor="as-loc">
                Localisation
              </label>
              <input
                className="bg-surface-container-low p-md rounded-lg"
                id="as-loc"
                onChange={(e) => setLocation(e.target.value)}
                value={location}
              />
            </div>
            <div className="flex flex-col gap-xs">
              <label className="ui-stat-label" htmlFor="as-staff">
                Personnel
              </label>
              <select
                className="bg-surface-container-low p-md rounded-lg"
                id="as-staff"
                onChange={(e) => setStaffId(e.target.value)}
                value={staffId}
              >
                <option value="">—</option>
                {staffOptions.map((o) => (
                  <option key={o.id} value={String(o.id)}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-xs">
              <label className="ui-stat-label" htmlFor="as-room">
                Salle
              </label>
              <select
                className="bg-surface-container-low p-md rounded-lg"
                id="as-room"
                onChange={(e) => setRoomId(e.target.value)}
                value={roomId}
              >
                <option value="">—</option>
                {roomOptions.map((o) => (
                  <option key={o.id} value={String(o.id)}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-xs md:col-span-2">
              <label className="ui-stat-label" htmlFor="as-notes">
                Notes
              </label>
              <input
                className="bg-surface-container-low p-md rounded-lg"
                id="as-notes"
                onChange={(e) => setAssignNotes(e.target.value)}
                value={assignNotes}
              />
            </div>
          </div>
          <div className="flex gap-sm">
            <button
              className="bg-primary text-on-primary px-lg py-sm rounded-lg font-title-sm disabled:opacity-40"
              disabled={busy}
              onClick={() => void handleAssign()}
              type="button"
            >
              Valider l&apos;affectation
            </button>
            <button
              className="bg-surface-container-high px-lg py-sm rounded-lg font-title-sm"
              onClick={() => setAssignId(null)}
              type="button"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      <div className="ui-table-shell" data-testid="assets-table">
        <div className="px-lg pt-lg pb-md flex flex-wrap items-center gap-sm border-b border-outline-variant/15">
          <div className="ui-search-field flex-1 min-w-[200px] h-10 py-0">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
              search
            </span>
            <input
              aria-label="Rechercher"
              className="ui-search-input ml-sm h-full"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Désignation, série, lieu…"
              type="text"
              value={search}
            />
          </div>
          <select
            aria-label="Statut"
            className="ui-input cursor-pointer h-10 py-0"
            onChange={(e) => setStatus(e.target.value)}
            value={status}
          >
            <option value="">Tous les statuts</option>
            {Object.entries(INVENTORY_ASSET_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <div className="ml-auto shrink-0 flex items-center gap-sm">
            <DataTableRefreshButton loading={loading} onRefresh={() => void reload()} />
            {canCreate && (
              <CrudCreateLink
                className="inline-flex items-center gap-sm h-10 bg-primary hover:bg-primary/90 text-on-primary font-label-caps text-label-caps px-md rounded-lg transition-colors shadow-sm"
                label="AJOUTER UNE IMMOBILISATION"
                resource="assets"
              />
            )}
          </div>
        </div>

        <div className="overflow-x-auto min-h-[320px]">
          {loading ? (
            <ContentSkeleton testId="assets-loading" variant="table" />
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low/80 sticky top-0 z-10">
                <tr className="ui-table-head-row">
                  <DataTableSelectHeader
                    checked={allPageSelected}
                    indeterminate={somePageSelected && !allPageSelected}
                    onChange={toggleAllPage}
                  />
                  <th className="py-sm px-md">Bien</th>
                  <th className="py-sm px-md">Lieu / assignation</th>
                  <th className="py-sm px-md text-right">Valeur</th>
                  <th className="py-sm px-md">Statut</th>
                  <th className="py-sm px-md text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-body-sm">
                {filtered.length === 0 ? (
                  <tr>
                    <td className="py-xl px-lg text-on-surface-variant" colSpan={6}>
                      Aucun bien.
                    </td>
                  </tr>
                ) : (
                  pageRows.map((row, index) => (
                    <tr className={tableRowClass(index)} key={row.id}>
                      <DataTableSelectCell
                        checked={selectedIds.has(row.id)}
                        label={row.designation}
                        onChange={() => toggleOne(row.id)}
                      />
                      <td className="py-sm px-md">
                        <div className="font-semibold">{row.designation}</div>
                        <div className="text-[12px] text-on-surface-variant">
                          {row.category}
                          {row.serial_number ? ` · ${row.serial_number}` : ""}
                        </div>
                      </td>
                      <td className="py-sm px-md">
                        {row.location ?? "—"}
                        {row.assigned_staff_member
                          ? ` · ${staffMemberName(row.assigned_staff_member)}`
                          : ""}
                        {row.assigned_room ? ` · ${row.assigned_room.name}` : ""}
                      </td>
                      <td className="py-sm px-md text-right font-mono-data">
                        {row.value != null ? formatMoneyFcfa(row.value) : "—"}
                      </td>
                      <td className="py-sm px-md">
                        <StatusBadge
                          label={INVENTORY_ASSET_STATUS_LABELS[row.status]}
                          tone={tone(row.status)}
                        />
                      </td>
                      <td className="py-sm px-md text-right">
                        <DataTableActionsMenu
                          ariaLabel={`Actions pour ${row.designation}`}
                          items={[
                            ...(canUpdate
                              ? [
                                  {
                                    kind: "button" as const,
                                    label: "Affecter",
                                    icon: "assignment_ind",
                                    onClick: () => {
                                      setAssignId(row.id);
                                      setLocation(row.location ?? "");
                                      setStaffId(
                                        row.assigned_staff_member_id != null
                                          ? String(row.assigned_staff_member_id)
                                          : ""
                                      );
                                      setRoomId(
                                        row.assigned_room_id != null
                                          ? String(row.assigned_room_id)
                                          : ""
                                      );
                                      setError(null);
                                      setNotice(null);
                                    },
                                  },
                                ]
                              : []),
                            {
                              kind: "button",
                              label: "Historique",
                              icon: "history",
                              onClick: () => void openHistory(row),
                            },
                            ...crudRowActions({
                              edit: { resource: "assets", recordId: row.id },
                              delete: {
                                onClick: () => void handleDelete(row),
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
          )}
        </div>

        {!loading && filtered.length > 0 && (
          <DataTablePagination
            canNextPage={canNextPage}
            canPreviousPage={canPreviousPage}
            entityLabel="biens"
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
            testId="assets-pagination"
            to={to}
            total={filtered.length}
          />
        )}
      </div>

      {historyId != null && (
        <div className="ui-card p-lg flex flex-col gap-md" data-testid="asset-history">
          <div className="flex justify-between items-center gap-md">
            <h2 className="font-title-sm">Historique — bien #{historyId}</h2>
            <button
              className="px-sm py-xs rounded bg-surface-container-high text-[11px] font-label-caps"
              onClick={() => {
                setHistoryId(null);
                setHistories([]);
              }}
              type="button"
            >
              Fermer
            </button>
          </div>
          {historyLoading ? (
            <PanelSkeleton />
          ) : histories.length === 0 ? (
            <p className="font-body-sm text-on-surface-variant">Aucun événement.</p>
          ) : (
            <ul className="flex flex-col gap-sm">
              {histories.map((h) => (
                <li
                  key={h.id}
                  className="bg-surface-container-low rounded-lg px-md py-sm font-body-sm"
                >
                  <span className="font-semibold">
                    {INVENTORY_HISTORY_EVENT_LABELS[h.event_type] ?? h.event_type}
                  </span>
                  {h.description ? ` — ${h.description}` : ""}
                  <div className="text-[12px] text-on-surface-variant mt-xs">
                    {h.created_at?.slice(0, 19).replace("T", " ") ?? ""}
                    {h.new_location ? ` · ${h.new_location}` : ""}
                    {h.new_status ? ` · ${h.new_status}` : ""}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
