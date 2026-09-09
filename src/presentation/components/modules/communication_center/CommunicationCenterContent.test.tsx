import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CommunicationCenterContent } from "@/presentation/components/modules/communication_center/CommunicationCenterContent";

const listAnnouncements = vi.fn();
const listConversations = vi.fn();
const publishAnnouncement = vi.fn();
const deleteAnnouncement = vi.fn();
const getConversation = vi.fn();
const listMessages = vi.fn();
const markConversationRead = vi.fn();
const sendMessage = vi.fn();

vi.mock("@/infrastructure/api/resources/communication", () => ({
  listAnnouncements: (...args: unknown[]) => listAnnouncements(...args),
  listConversations: (...args: unknown[]) => listConversations(...args),
  publishAnnouncement: (...args: unknown[]) => publishAnnouncement(...args),
  deleteAnnouncement: (...args: unknown[]) => deleteAnnouncement(...args),
  getConversation: (...args: unknown[]) => getConversation(...args),
  listMessages: (...args: unknown[]) => listMessages(...args),
  markConversationRead: (...args: unknown[]) => markConversationRead(...args),
  sendMessage: (...args: unknown[]) => sendMessage(...args),
}));

vi.mock("@/infrastructure/auth/AuthProvider", () => ({
  useAuth: () => ({
    user: {
      id: 1,
      name: "Admin",
      email: "admin@educore.ci",
      institution_id: 1,
      roles: ["ADMIN"],
      permissions: [],
      email_verified_at: null,
      created_at: null,
    },
  }),
  getAuthErrorMessage: (err: unknown) =>
    err instanceof Error ? err.message : "Une erreur est survenue.",
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/presentation/components/providers/ConfirmDialogProvider", () => ({
  useConfirm: () => vi.fn().mockResolvedValue(true),
}));
describe("CommunicationCenterContent", () => {
  beforeEach(() => {
    listAnnouncements.mockReset();
    listConversations.mockReset();
    publishAnnouncement.mockReset();
    getConversation.mockReset();
    listMessages.mockReset();
    markConversationRead.mockReset();
    sendMessage.mockReset();
  });

  it("lists announcements and publishes a draft", async () => {
    listAnnouncements.mockResolvedValue([
      {
        id: 1,
        institution_id: 1,
        title: "Réunion parents",
        body: "Vendredi",
        status: "DRAFT",
        published_at: null,
        is_pinned: false,
        author_id: 1,
        targets: [{ target_type: "PARENTS", target_id: null }],
      },
    ]);
    listConversations.mockResolvedValue([]);
    publishAnnouncement.mockResolvedValue({
      id: 1,
      status: "PUBLISHED",
      title: "Réunion parents",
      body: "Vendredi",
      published_at: "2026-09-02T00:00:00Z",
      is_pinned: false,
      author_id: 1,
      institution_id: 1,
      targets: [{ target_type: "PARENTS", target_id: null }],
    });

    render(<CommunicationCenterContent />);

    await waitFor(() => {
      expect(screen.getByTestId("announcements-table")).toHaveTextContent("Réunion parents");
    });

    await userEvent.click(screen.getByRole("button", { name: /Actions pour Réunion parents/i }));
    await userEvent.click(screen.getByRole("menuitem", { name: /publier/i }));
    await waitFor(() => {
      expect(publishAnnouncement).toHaveBeenCalledWith(1);
    });
  });

  it("opens a conversation and sends a message", async () => {
    listAnnouncements.mockResolvedValue([]);
    listConversations.mockResolvedValue([
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
          body: "Bonjour",
        },
      },
    ]);
    getConversation.mockResolvedValue({
      id: 9,
      institution_id: 1,
      type: "PRIVATE",
      subject: null,
      created_by: 1,
      participants: [
        { id: 1, user_id: 1, last_read_at: null, user: { id: 1, name: "Admin" } },
        { id: 2, user_id: 42, last_read_at: null, user: { id: 42, name: "Mme Diallo" } },
      ],
    });
    listMessages.mockResolvedValue([
      {
        id: 1,
        conversation_id: 9,
        sender_id: 42,
        body: "Bonjour",
        sender: { id: 42, name: "Mme Diallo" },
      },
    ]);
    markConversationRead.mockResolvedValue({});
    sendMessage.mockResolvedValue({
      id: 2,
      conversation_id: 9,
      sender_id: 1,
      body: "Oui, confirmé",
    });

    render(<CommunicationCenterContent />);
    await waitFor(() => {
      expect(screen.getByTestId("conversations-list")).toHaveTextContent("Mme Diallo");
    });


    await userEvent.click(screen.getByRole("button", { name: /mme diallo/i }));
    await waitFor(() => {
      expect(listMessages).toHaveBeenCalledWith(9);
      expect(markConversationRead).toHaveBeenCalledWith(9);
    });

    await userEvent.type(screen.getByLabelText(/nouveau message/i), "Oui, confirmé");
    await userEvent.click(screen.getByRole("button", { name: /envoyer/i }));
    await waitFor(() => {
      expect(sendMessage).toHaveBeenCalledWith(9, "Oui, confirmé");
    });
  });

  it("shows error state", async () => {
    listAnnouncements.mockRejectedValue(new Error("Comm KO"));
    listConversations.mockResolvedValue([]);
    render(<CommunicationCenterContent />);
    await waitFor(() => {
      expect(screen.getByTestId("communication-error")).toHaveTextContent("Comm KO");
    });
  });
});
