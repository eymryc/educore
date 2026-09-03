import { describe, expect, it } from "vitest";
import {
  filterAssignments,
  formatDueAt,
  isAssignmentPastDue,
} from "@/shared/types/assignments.types";
import {
  formatNotificationWhen,
  isNotificationUnread,
} from "@/shared/types/notifications.types";

describe("portal helpers", () => {
  it("formats assignment due dates and detects past due", () => {
    expect(formatDueAt(null)).toBe("—");
    expect(isAssignmentPastDue({ due_at: "2000-01-01T00:00:00Z" })).toBe(true);
    expect(isAssignmentPastDue({ due_at: "2099-01-01T00:00:00Z" })).toBe(false);
  });

  it("filters assignments by class and search", () => {
    const rows = [
      {
        id: 1,
        institution_id: 1,
        academic_year_id: 1,
        subject_id: 1,
        class_group_id: 2,
        title: "DM Maths",
        description: null,
        instructions: null,
        due_at: null,
        max_score: 20,
        status: "PUBLISHED",
        created_by: 1,
        subject: { id: 1, name: "Maths" },
        class_group: { id: 2, name: "2nde A" },
      },
      {
        id: 2,
        institution_id: 1,
        academic_year_id: 1,
        subject_id: 3,
        class_group_id: 4,
        title: "Essai Français",
        description: null,
        instructions: null,
        due_at: null,
        max_score: 20,
        status: "DRAFT",
        created_by: 1,
        subject: { id: 3, name: "Français" },
        class_group: { id: 4, name: "1ère C" },
      },
    ];

    expect(filterAssignments(rows, { classGroupId: "2" })).toHaveLength(1);
    expect(filterAssignments(rows, { search: "français" })[0]?.id).toBe(2);
    expect(filterAssignments(rows, { status: "DRAFT" })).toHaveLength(1);
  });

  it("detects unread notifications", () => {
    expect(isNotificationUnread({ read_at: null })).toBe(true);
    expect(isNotificationUnread({ read_at: "2026-01-01" })).toBe(false);
    expect(formatNotificationWhen(null)).toBe("");
  });
});
