export type AnnouncementStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type AnnouncementTargetType =
  | "INSTITUTION"
  | "CLASS_GROUP"
  | "LEVEL"
  | "STUDENT"
  | "PARENTS"
  | "TEACHERS";

export type ConversationType = "PRIVATE" | "GROUP";

export interface NamedUserRef {
  id: number;
  name?: string | null;
  email?: string | null;
}

export interface AnnouncementTarget {
  id?: number;
  target_type: AnnouncementTargetType;
  target_id: number | null;
}

export interface Announcement {
  id: number;
  institution_id: number;
  title: string;
  body: string;
  status: AnnouncementStatus;
  published_at: string | null;
  is_pinned: boolean;
  author_id: number | null;
  author?: NamedUserRef | null;
  targets?: AnnouncementTarget[];
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ConversationParticipant {
  id: number;
  user_id: number;
  last_read_at: string | null;
  user?: NamedUserRef | null;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  body: string;
  sender?: NamedUserRef | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Conversation {
  id: number;
  institution_id: number;
  type: ConversationType;
  subject: string | null;
  created_by: number | null;
  creator?: NamedUserRef | null;
  participants?: ConversationParticipant[];
  messages?: Message[];
  latest_message?: Message | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export const ANNOUNCEMENT_STATUS_LABELS: Record<AnnouncementStatus, string> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publiée",
  ARCHIVED: "Archivée",
};

export const ANNOUNCEMENT_TARGET_LABELS: Record<AnnouncementTargetType, string> = {
  INSTITUTION: "Tout l'établissement",
  CLASS_GROUP: "Classe",
  LEVEL: "Niveau",
  STUDENT: "Élève",
  PARENTS: "Parents",
  TEACHERS: "Enseignants",
};

export const CONVERSATION_TYPE_LABELS: Record<ConversationType, string> = {
  PRIVATE: "Privée",
  GROUP: "Groupe",
};

export function targetNeedsId(type: AnnouncementTargetType): boolean {
  return type === "CLASS_GROUP" || type === "LEVEL" || type === "STUDENT";
}

export function canPublishAnnouncement(status: AnnouncementStatus): boolean {
  return status === "DRAFT";
}

export function canEditAnnouncement(status: AnnouncementStatus): boolean {
  return status === "DRAFT";
}

export function formatTargets(targets: AnnouncementTarget[] | undefined): string {
  if (!targets?.length) return "—";
  return targets
    .map((t) => {
      const label = ANNOUNCEMENT_TARGET_LABELS[t.target_type] ?? t.target_type;
      return t.target_id != null ? `${label} #${t.target_id}` : label;
    })
    .join(", ");
}

export function conversationTitle(
  conversation: Conversation,
  currentUserId?: number | null
): string {
  if (conversation.subject?.trim()) return conversation.subject.trim();
  if (conversation.type === "PRIVATE" && conversation.participants?.length) {
    const other = conversation.participants.find((p) => p.user_id !== currentUserId);
    const name = other?.user?.name ?? conversation.participants[0]?.user?.name;
    if (name) return name;
  }
  return conversation.type === "GROUP" ? `Groupe #${conversation.id}` : `Conversation #${conversation.id}`;
}

export function latestMessagePreview(conversation: Conversation): string {
  const msg =
    conversation.latest_message ??
    (conversation.messages && conversation.messages.length > 0
      ? conversation.messages[conversation.messages.length - 1]
      : null);
  if (!msg?.body) return "Aucun message";
  const text = msg.body.trim();
  return text.length > 80 ? `${text.slice(0, 80)}…` : text;
}

export function filterAnnouncements(
  items: Announcement[],
  filters: { search?: string; status?: string }
): Announcement[] {
  const q = filters.search?.trim().toLowerCase() ?? "";
  return items.filter((a) => {
    if (filters.status && a.status !== filters.status) return false;
    if (!q) return true;
    return `${a.title} ${a.body}`.toLowerCase().includes(q);
  });
}

export function filterConversations(
  items: Conversation[],
  filters: { search?: string; type?: string }
): Conversation[] {
  const q = filters.search?.trim().toLowerCase() ?? "";
  return items.filter((c) => {
    if (filters.type && c.type !== filters.type) return false;
    if (!q) return true;
    const title = conversationTitle(c).toLowerCase();
    const preview = latestMessagePreview(c).toLowerCase();
    const participants = (c.participants ?? [])
      .map((p) => p.user?.name ?? "")
      .join(" ")
      .toLowerCase();
    return `${title} ${preview} ${c.subject ?? ""} ${participants}`.includes(q);
  });
}
