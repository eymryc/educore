import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationsContent } from "@/presentation/components/modules/notifications/NotificationsContent";

const listNotifications = vi.fn();
const markNotificationRead = vi.fn();
const markAllNotificationsRead = vi.fn();

vi.mock("@/infrastructure/api/resources/notifications", () => ({
  listNotifications: (...a: unknown[]) => listNotifications(...a),
  markNotificationRead: (...a: unknown[]) => markNotificationRead(...a),
  markAllNotificationsRead: (...a: unknown[]) => markAllNotificationsRead(...a),
}));

vi.mock("@/infrastructure/auth/AuthProvider", () => ({
  getAuthErrorMessage: (e: unknown) => (e instanceof Error ? e.message : "Erreur"),
}));

describe("NotificationsContent", () => {
  beforeEach(() => {
    listNotifications.mockReset();
    markNotificationRead.mockReset();
    markAllNotificationsRead.mockReset();
  });

  it("lists notifications and marks one as read", async () => {
    const user = userEvent.setup();
    listNotifications.mockResolvedValue([
      {
        id: "n1",
        type: "grade",
        title: "Nouvelle note",
        body: "Maths",
        data: {},
        read_at: null,
        created_at: "2026-09-01T10:00:00Z",
      },
    ]);
    markNotificationRead.mockResolvedValue({
      id: "n1",
      type: "grade",
      title: "Nouvelle note",
      body: "Maths",
      data: {},
      read_at: "2026-09-01T11:00:00Z",
      created_at: "2026-09-01T10:00:00Z",
    });

    render(<NotificationsContent />);

    await waitFor(() => {
      expect(screen.getByTestId("notifications-list")).toHaveTextContent("Nouvelle note");
    });

    await user.click(screen.getByRole("button", { name: /Nouvelle note/i }));
    expect(markNotificationRead).toHaveBeenCalledWith("n1");
  });

  it("shows empty state", async () => {
    listNotifications.mockResolvedValue([]);
    render(<NotificationsContent />);
    await waitFor(() => {
      expect(screen.getByTestId("notifications-empty")).toBeInTheDocument();
    });
  });
});
