import { api } from "@/infrastructure/api/client";
import type {
  Announcement,
  Conversation,
  Message,
} from "@/shared/types/communication.types";

export function listAnnouncements(): Promise<Announcement[]> {
  return api.get<Announcement[]>("/announcements");
}

export function getAnnouncement(id: number | string): Promise<Announcement> {
  return api.get<Announcement>(`/announcements/${id}`);
}

export function createAnnouncement(
  payload: Record<string, unknown>
): Promise<Announcement> {
  return api.post<Announcement>("/announcements", payload);
}

export function updateAnnouncement(
  id: number | string,
  payload: Record<string, unknown>
): Promise<Announcement> {
  return api.put<Announcement>(`/announcements/${id}`, payload);
}

export function deleteAnnouncement(id: number | string): Promise<null> {
  return api.delete<null>(`/announcements/${id}`);
}

export function publishAnnouncement(id: number | string): Promise<Announcement> {
  return api.post<Announcement>(`/announcements/${id}/publish`);
}

export function listConversations(): Promise<Conversation[]> {
  return api.get<Conversation[]>("/conversations");
}

export function getConversation(id: number | string): Promise<Conversation> {
  return api.get<Conversation>(`/conversations/${id}`);
}

export function createConversation(payload: {
  type: "PRIVATE" | "GROUP";
  recipient_user_id?: number;
  subject?: string;
  participant_user_ids?: number[];
}): Promise<Conversation> {
  return api.post<Conversation>("/conversations", payload);
}

export function markConversationRead(id: number | string): Promise<Conversation> {
  return api.post<Conversation>(`/conversations/${id}/read`);
}

export function listMessages(conversationId: number | string): Promise<Message[]> {
  return api.get<Message[]>(`/conversations/${conversationId}/messages`);
}

export function sendMessage(
  conversationId: number | string,
  body: string
): Promise<Message> {
  return api.post<Message>(`/conversations/${conversationId}/messages`, { body });
}
