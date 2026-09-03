import { describe, expect, it } from "vitest";
import {
  auditActorLabel,
  formatAuditTimestamp,
  prettyJson,
  type AuditLog,
} from "@/shared/types/audit.types";

describe("audit helpers", () => {
  it("labels actors and formats JSON", () => {
    const log: AuditLog = {
      id: 1,
      institution_id: 1,
      user_id: 3,
      action: "update",
      resource: "students",
      resource_id: 7,
      old_values: { status: "active" },
      new_values: { status: "inactive" },
      ip_address: "127.0.0.1",
      user_agent: "test",
      user: { id: 3, name: "Admin Demo", roles: ["ADMIN"] },
      created_at: "2026-09-02T10:00:00.000Z",
    };
    expect(auditActorLabel(log)).toBe("Admin Demo");
    expect(prettyJson(log.new_values)).toContain("inactive");
    expect(formatAuditTimestamp(log.created_at)).not.toBe("—");
    expect(auditActorLabel({ ...log, user: null, user_id: null })).toBe("Système");
  });
});
