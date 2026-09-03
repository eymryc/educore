import { describe, expect, it } from "vitest";
import {
  canDownloadReportCard,
  canGenerateReportCard,
  canPublishReportCard,
  filterReportCards,
  summarizeReportCards,
  type ReportCard,
} from "@/shared/types/report-cards.types";

function card(
  partial: Partial<ReportCard> & Pick<ReportCard, "id" | "status">
): ReportCard {
  return {
    institution_id: 1,
    student_id: 7,
    academic_period_id: 1,
    appreciation: null,
    generated_at: null,
    published_at: null,
    published_by: null,
    created_by: 1,
    student: {
      id: 7,
      institution_id: 1,
      user_id: null,
      matricule: "EL-007",
      first_name: "Awa",
      last_name: "Koné",
      birth_date: "2010-01-01",
      gender: "F",
      email: null,
      phone: null,
      address: null,
      level_id: 1,
      class_group_id: 2,
      status: "active",
      enrolled_at: null,
      avatar_url: null,
    },
    academic_period: {
      id: 1,
      institution_id: 1,
      academic_year_id: 1,
      name: "Trimestre 1",
      type: null,
      start_date: null,
      end_date: null,
      sort_order: 1,
      status: "open",
    },
    bulletin: null,
    ...partial,
  };
}

describe("report-cards helpers", () => {
  it("gates generate / publish / download by status", () => {
    expect(canGenerateReportCard("draft")).toBe(true);
    expect(canGenerateReportCard("generated")).toBe(false);
    expect(canPublishReportCard("generated")).toBe(true);
    expect(canPublishReportCard("draft")).toBe(false);
    expect(canDownloadReportCard(card({ id: 1, status: "generated" }))).toBe(true);
    expect(canDownloadReportCard(card({ id: 2, status: "draft" }))).toBe(false);
  });

  it("filters and summarizes", () => {
    const items = [
      card({ id: 1, status: "draft" }),
      card({ id: 2, status: "published", student_id: 8 }),
    ];
    expect(filterReportCards(items, { search: "koné" })).toHaveLength(2);
    expect(filterReportCards(items, { status: "draft" })).toHaveLength(1);
    expect(summarizeReportCards(items)).toEqual({
      total: 2,
      draft: 1,
      generated: 0,
      published: 1,
    });
  });
});
