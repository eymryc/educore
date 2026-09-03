"use client";

import { useEffect, useState } from "react";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/infrastructure/api/resources/notifications";
import { getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import {
  formatNotificationWhen,
  isNotificationUnread,
  type AppNotification,
} from "@/shared/types/notifications.types";
import { ContentSkeleton } from "@/presentation/components/shared/DataTableSkeleton";

export function NotificationsContent() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      setItems(await listNotifications({ per_page: 10 }));
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  async function handleRead(n: AppNotification) {
    if (!isNotificationUnread(n)) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await markNotificationRead(n.id);
      setItems((prev) => prev.map((x) => (x.id === n.id ? updated : x)));
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleReadAll() {
    setBusy(true);
    setError(null);
    try {
      await markAllNotificationsRead();
      setItems((prev) =>
        prev.map((n) =>
          n.read_at ? n : { ...n, read_at: new Date().toISOString() }
        )
      );
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const unread = items.filter(isNotificationUnread).length;

  return (
    <div className="flex flex-col w-full gap-lg pb-xl max-w-5xl mx-auto px-md">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-md">
        <div>
          <h1 className="ui-page-title">Notifications</h1>
          <p className="font-body-md text-on-surface-variant mt-sm">
            {unread} non lue(s)
          </p>
        </div>
        {unread > 0 && (
          <button
            type="button"
            className="ui-btn-secondary"
            disabled={busy}
            onClick={() => void handleReadAll()}
          >
            Tout marquer comme lu
          </button>
        )}
      </div>

      {error && (
        <div role="alert" className="rounded-lg bg-error-container text-on-error-container px-md py-sm font-body-sm">
          {error}
        </div>
      )}

      {loading && <ContentSkeleton variant="list" />}

      {!loading && items.length === 0 && (
        <p className="font-body-md text-on-surface-variant" data-testid="notifications-empty">
          Aucune notification.
        </p>
      )}

      {!loading && items.length > 0 && (
        <ul className="flex flex-col gap-sm" data-testid="notifications-list">
          {items.map((n) => {
            const unreadItem = isNotificationUnread(n);
            return (
              <li key={n.id}>
                <button
                  type="button"
                  disabled={busy || !unreadItem}
                  onClick={() => void handleRead(n)}
                  className={`w-full text-left ui-card ui-card-pad flex gap-md items-start ${
                    unreadItem ? "border-l-4 border-primary" : "opacity-80"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-sm flex-wrap">
                      <span className="font-label-caps text-[10px] text-on-surface-variant uppercase">
                        {n.type}
                      </span>
                      <span className="font-body-sm text-on-surface-variant text-[12px]">
                        {formatNotificationWhen(n.created_at)}
                      </span>
                    </div>
                    <h2 className="font-title-sm text-on-surface mt-xs">
                      {n.title ?? "Notification"}
                    </h2>
                    {n.body && (
                      <p className="font-body-sm text-on-surface-variant mt-xs line-clamp-3">
                        {n.body}
                      </p>
                    )}
                  </div>
                  {unreadItem && (
                    <span className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0 mt-1" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
