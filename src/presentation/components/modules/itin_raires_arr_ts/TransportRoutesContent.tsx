"use client";

import { useEffect, useState } from "react";
import { CrudCreateLink } from "@/presentation/components/forms/CrudLinks";
import {
  crudRowActions,
  DataTableActionsMenu,
  type DataTableMenuItem,
} from "@/presentation/components/shared/DataTableActionsMenu";
import { StatusBadge } from "@/presentation/components/shared/StatusBadge";
import { ContentSkeleton } from "@/presentation/components/shared/DataTableSkeleton";
import {
  deleteTransportRoute,
  listTransportRoutes,
} from "@/infrastructure/api/resources/transport";
import { useAuth, getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import { can } from "@/shared/lib/permissions";
import {
  transportDriverName,
  type TransportRoute,
} from "@/shared/types/transport.types";
import { useConfirm } from "@/presentation/components/providers/ConfirmDialogProvider";

export function TransportRoutesContent() {
  const confirmDialog = useConfirm();
  const { user } = useAuth();
  const [rows, setRows] = useState<TransportRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const canView = can(user, "transport.view");
  const canCreate = can(user, "transport.create");
  const canUpdate = can(user, "transport.update");
  const canDelete = can(user, "transport.delete");

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      setRows(await listTransportRoutes());
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (canView) void reload();
    else setLoading(false);
  }, [canView]);

  async function handleDelete(row: TransportRoute) {
    if (!canDelete) return;
    if (!await confirmDialog(`Supprimer l'itinéraire « ${row.name} » ?`)) return;
    setBusy(true);
    try {
      await deleteTransportRoute(row.id);
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (!canView) {
    return (
      <p className="p-xl font-body-md text-on-surface-variant">
        Accès réservé (`transport.view`).
      </p>
    );
  }

  return (
    <div className="flex flex-col w-full gap-lg pb-xl max-w-7xl mx-auto" data-testid="routes-panel">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-md">
{canCreate && (
          <CrudCreateLink resource="transport-routes" label="NOUVEL ITINÉRAIRE" />
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-error-container text-on-error-container px-md py-sm" role="alert">
          {error}
        </div>
      )}
      {loading && <ContentSkeleton testId="routes-loading" variant="cards" />}

      {!loading && (
        <div className="flex flex-col gap-md" data-testid="routes-list">
          {rows.length === 0 ? (
            <p className="font-body-sm text-on-surface-variant">Aucun itinéraire.</p>
          ) : (
            rows.map((row) => {
              const open = expandedId === row.id;
              const stops = [...(row.stops ?? [])].sort(
                (a, b) => a.stop_order - b.stop_order
              );
              return (
                <article key={row.id} className="ui-card p-lg flex flex-col gap-md">
                  <div className="flex flex-wrap items-start justify-between gap-md">
                    <div>
                      <h2 className="font-title-sm">
                        {row.name}
                        {row.code ? (
                          <span className="font-mono-data text-sm text-on-surface-variant ml-sm">
                            ({row.code})
                          </span>
                        ) : null}
                      </h2>
                      <p className="font-body-sm text-on-surface-variant mt-xs">
                        {row.vehicle
                          ? `${row.vehicle.label} · ${row.vehicle.plate_number}`
                          : "Sans véhicule"}
                        {" · "}
                        {transportDriverName(row.driver)}
                        {row.subscriptions_count != null
                          ? ` · ${row.subscriptions_count} abo.`
                          : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-sm flex-wrap">
                      <StatusBadge
                        label={row.is_active ? "Actif" : "Inactif"}
                        tone={row.is_active ? "success" : "neutral"}
                      />
                      <button
                        className="px-sm py-xs rounded bg-surface-container-high text-[11px] font-label-caps"
                        onClick={() => setExpandedId(open ? null : row.id)}
                        type="button"
                      >
                        {open ? "Masquer arrêts" : `Arrêts (${stops.length})`}
                      </button>
                      <DataTableActionsMenu
                        ariaLabel={`Actions pour ${row.name}`}
                        items={crudRowActions({
                          edit: { resource: "transport-routes", recordId: row.id },
                          delete: {
                            onClick: () => void handleDelete(row),
                            disabled: busy,
                          },
                          canUpdate,
                          canDelete,
                        })}
                      />
                    </div>
                  </div>
                  {open && (
                    <ul
                      className="flex flex-col gap-sm border-t border-surface-variant/30 pt-md"
                      data-testid={`route-stops-${row.id}`}
                    >
                      {stops.length === 0 ? (
                        <li className="font-body-sm text-on-surface-variant">
                          Aucun arrêt.
                        </li>
                      ) : (
                        stops.map((s) => (
                          <li
                            key={s.id}
                            className="flex justify-between gap-md bg-surface-container-low rounded-lg px-md py-sm font-body-sm"
                          >
                            <span>
                              <span className="font-mono-data text-[11px] mr-sm">
                                #{s.stop_order}
                              </span>
                              {s.name}
                              {s.address ? (
                                <span className="text-on-surface-variant">
                                  {" "}
                                  — {s.address}
                                </span>
                              ) : null}
                            </span>
                            <span className="font-mono-data text-on-surface-variant">
                              {s.pickup_time ?? "—"}
                            </span>
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                </article>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
