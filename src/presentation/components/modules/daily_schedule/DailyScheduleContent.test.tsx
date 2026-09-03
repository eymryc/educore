import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DailyScheduleContent } from "@/presentation/components/modules/daily_schedule/DailyScheduleContent";
import { ApiError } from "@/shared/types/api.types";

const listTimetableSlots = vi.fn();

vi.mock("@/infrastructure/api/resources/academic", () => ({
  listTimetableSlots: (...a: unknown[]) => listTimetableSlots(...a),
}));

vi.mock("@/infrastructure/auth/AuthProvider", () => ({
  getAuthErrorMessage: (e: unknown) => (e instanceof Error ? e.message : "Erreur"),
}));

describe("DailyScheduleContent", () => {
  beforeEach(() => {
    listTimetableSlots.mockReset();
  });

  it("shows forbidden message on 403", async () => {
    listTimetableSlots.mockRejectedValue(new ApiError("Forbidden", 403));
    render(<DailyScheduleContent />);
    await waitFor(() => {
      expect(screen.getByTestId("schedule-forbidden")).toBeInTheDocument();
    });
  });

  it("lists slots for the selected day", async () => {
    listTimetableSlots.mockResolvedValue([
      {
        id: 1,
        institution_id: 1,
        academic_year_id: 1,
        class_group_id: 1,
        subject_id: 1,
        teacher_id: 1,
        room_id: 1,
        day_of_week: "monday",
        start_time: "08:00:00",
        end_time: "09:00:00",
        subject: { id: 1, name: "Maths" },
        teacher: { id: 1, name: "M. Diabaté" },
        room: { id: 1, name: "S1" },
      },
    ]);

    render(<DailyScheduleContent />);

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: "Lundi" })).toBeInTheDocument();
    });
    await userClickMondayIfNeeded();
    await waitFor(() => {
      expect(screen.getByTestId("schedule-list")).toHaveTextContent("Maths");
    });
  });
});

async function userClickMondayIfNeeded() {
  const monday = screen.getByRole("tab", { name: "Lundi" });
  if (monday.getAttribute("aria-selected") !== "true") {
    const { default: userEvent } = await import("@testing-library/user-event");
    await userEvent.setup().click(monday);
  }
}
