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
  activateAcademicYear,
  attachClassGroupStudent,
  createTimetableSlot,
  listClassGroups,
  listSubjects,
  listTimetableSlots,
  syncClassGroupStudents,
} from "@/infrastructure/api/resources/academic";

describe("academic API resources", () => {
  beforeEach(() => {
    apiGet.mockReset();
    apiPost.mockReset();
    apiPut.mockReset();
    apiDelete.mockReset();
  });

  it("lists classes, subjects and timetable slots", async () => {
    apiGet.mockResolvedValue([]);
    await listClassGroups();
    await listSubjects();
    await listTimetableSlots();
    expect(apiGet).toHaveBeenCalledWith("/class-groups");
    expect(apiGet).toHaveBeenCalledWith("/subjects");
    expect(apiGet).toHaveBeenCalledWith("/timetable-slots");
  });

  it("attaches a class student and creates a slot", async () => {
    apiPost.mockResolvedValue({ id: 1 });
    await attachClassGroupStudent(3, 99);
    await createTimetableSlot({
      academic_year_id: 1,
      class_group_id: 3,
      subject_id: 2,
      day_of_week: "monday",
      start_time: "08:00",
      end_time: "09:00",
    });
    expect(apiPost).toHaveBeenCalledWith("/class-groups/3/students", { student_id: 99 });
    expect(apiPost).toHaveBeenCalledWith(
      "/timetable-slots",
      expect.objectContaining({ day_of_week: "monday" })
    );
  });

  it("activates an academic year and syncs class students", async () => {
    apiPost.mockResolvedValue({ id: 1 });
    await activateAcademicYear(4);
    await syncClassGroupStudents(3, [10, 11]);
    expect(apiPost).toHaveBeenCalledWith("/academic-years/4/activate");
    expect(apiPost).toHaveBeenCalledWith("/class-groups/3/students/sync", {
      student_ids: [10, 11],
    });
  });
});
