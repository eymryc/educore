import { describe, expect, it } from "vitest";
import {
  canPublishAnnouncement,
  conversationTitle,
  filterAnnouncements,
  filterConversations,
  formatTargets,
  latestMessagePreview,
  targetNeedsId,
  type Announcement,
  type Conversation,
} from "@/shared/types/communication.types";

describe("communication helpers", () => {
  it("gates publish and formats targets", () => {
    expect(canPublishAnnouncement("DRAFT")).toBe(true);
    expect(canPublishAnnouncement("PUBLISHED")).toBe(false);
    expect(targetNeedsId("CLASS_GROUP")).toBe(true);
    expect(targetNeedsId("PARENTS")).toBe(false);
    expect(
      formatTargets([
        { target_type: "PARENTS", target_id: null },
        { target_type: "CLASS_GROUP", target_id: 12 },
      ])
    ).toContain("Parents");
  });

  it("filters announcements and conversations", () => {
    const announcements: Announcement[] = [
      {
        id: 1,
        institution_id: 1,
        title: "Réunion parents",
        body: "Vendredi 18h",
        status: "PUBLISHED",
        published_at: "2026-09-01T00:00:00Z",
        is_pinned: false,
        author_id: 1,
      },
      {
        id: 2,
        institution_id: 1,
        title: "Brouillon interne",
        body: "todo",
        status: "DRAFT",
        published_at: null,
        is_pinned: true,
        author_id: 1,
      },
    ];
    expect(filterAnnouncements(announcements, { search: "réunion" })).toHaveLength(1);
    expect(filterAnnouncements(announcements, { status: "DRAFT" })).toHaveLength(1);

    const conversations: Conversation[] = [
      {
        id: 9,
        institution_id: 1,
        type: "PRIVATE",
        subject: null,
        created_by: 1,
        participants: [
          { id: 1, user_id: 1, last_read_at: null, user: { id: 1, name: "Admin" } },
          { id: 2, user_id: 42, last_read_at: null, user: { id: 42, name: "Mme Diallo" } },
        ],
        latest_message: {
          id: 1,
          conversation_id: 9,
          sender_id: 42,
          body: "Bonjour, confirmez-vous ?",
        },
      },
    ];
    expect(conversationTitle(conversations[0]!, 1)).toBe("Mme Diallo");
    expect(latestMessagePreview(conversations[0]!)).toContain("Bonjour");
    expect(filterConversations(conversations, { search: "diallo" })).toHaveLength(1);
  });
});
