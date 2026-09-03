export interface AppNotification {
  id: string;
  type: string;
  title: string | null;
  body: string | null;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string | null;
}

export function isNotificationUnread(n: Pick<AppNotification, "read_at">): boolean {
  return n.read_at == null;
}

export function formatNotificationWhen(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}
