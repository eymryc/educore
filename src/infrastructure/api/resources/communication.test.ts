import { beforeEach, describe, expect, it, vi } from "vitest";

const apiGet = vi.fn();
const apiPost = vi.fn();
const apiPut = vi.fn();
const apiDelete = vi.fn();

vi.mock("@/infrastructure/api/client", () => ({
  api: {
    get: (...args: unknown[]) => apiGet(...args),
    post: (...args: unknown[]) => apiPost(...args),
    put: (...args: unknown[]) => apiPut(...args),
    delete: (...args: unknown[]) => apiDelete(...args),
  },
}));

import {
  createAnnouncement,
  createConversation,
  listAnnouncements,
  listConversations,
  listMessages,
  markConversationRead,
  publishAnnouncement,
  sendMessage,
} from "@/infrastructure/api/resources/communication";

describe("communication API resource", () => {
  beforeEach(() => {
    apiGet.mockReset();
    apiPost.mockReset();
    apiPut.mockReset();
    apiDelete.mockReset();
  });

  it("lists and publishes announcements", async () => {
    apiGet.mockResolvedValue([]);
    apiPost.mockResolvedValue({ id: 1, status: "PUBLISHED" });

    await listAnnouncements();
    expect(apiGet).toHaveBeenCalledWith("/announcements");

    await createAnnouncement({
      title: "Info",
      body: "Texte",
      targets: [{ target_type: "INSTITUTION" }],
      publish: true,
    });
    expect(apiPost).toHaveBeenCalledWith(
      "/announcements",
      expect.objectContaining({ title: "Info" })
    );

    await publishAnnouncement(1);
    expect(apiPost).toHaveBeenCalledWith("/announcements/1/publish");
  });

  it("manages conversations and messages", async () => {
    apiGet.mockResolvedValue([]);
    apiPost.mockResolvedValue({ id: 9 });

    await listConversations();
    expect(apiGet).toHaveBeenCalledWith("/conversations");

    await createConversation({ type: "PRIVATE", recipient_user_id: 42 });
    expect(apiPost).toHaveBeenCalledWith("/conversations", {
      type: "PRIVATE",
      recipient_user_id: 42,
    });

    await listMessages(9);
    expect(apiGet).toHaveBeenCalledWith("/conversations/9/messages");

    await sendMessage(9, "Salut");
    expect(apiPost).toHaveBeenCalledWith("/conversations/9/messages", { body: "Salut" });

    await markConversationRead(9);
    expect(apiPost).toHaveBeenCalledWith("/conversations/9/read");
  });
});
