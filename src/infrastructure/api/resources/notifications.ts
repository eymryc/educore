import { api } from "@/infrastructure/api/client";
import type { AppNotification } from "@/shared/types/notifications.types";

export function listNotifications(query?: {
  per_page?: number;
  page?: number;
}): Promise<AppNotification[]> {
  return api.get<AppNotification[]>("/notifications", query);
}

export function getUnreadNotificationCount(): Promise<{ count: number }> {
  return api.get<{ count: number }>("/notifications/unread-count");
}

export function markNotificationRead(
  id: string
): Promise<AppNotification> {
  return api.post<AppNotification>(`/notifications/${id}/read`);
}

export function markAllNotificationsRead(): Promise<null> {
  return api.post<null>("/notifications/read-all");
}
