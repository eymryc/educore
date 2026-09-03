import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SecurityAuditLogsContent } from "@/presentation/components/modules/security_audit_logs/SecurityAuditLogsContent";

const listAuditLogs = vi.fn();
const getAuditLog = vi.fn();

vi.mock("@/infrastructure/api/resources/audit", () => ({
  listAuditLogs: (...args: unknown[]) => listAuditLogs(...args),
  getAuditLog: (...args: unknown[]) => getAuditLog(...args),
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

const sampleLog = {
  id: 5,
  institution_id: 1,
  user_id: 1,
  action: "login",
  resource: "users",
  resource_id: null,
  old_values: null,
  new_values: { via: "web" },
  ip_address: "10.0.0.1",
  user_agent: "Vitest",
  user: { id: 1, name: "Admin Demo", roles: ["ADMIN"] },
  created_at: "2026-09-02T12:00:00.000Z",
};

vi.mock("@/presentation/components/providers/ConfirmDialogProvider", () => ({
  useConfirm: () => vi.fn().mockResolvedValue(true),
}));
describe("SecurityAuditLogsContent", () => {
  beforeEach(() => {
    listAuditLogs.mockReset();
    getAuditLog.mockReset();
  });

  it("lists logs, opens detail, and paginates", async () => {
    listAuditLogs.mockResolvedValue({
      data: [sampleLog],
      meta: { current_page: 1, per_page: 10, total: 40, last_page: 4 },
    });
    getAuditLog.mockResolvedValue({
      ...sampleLog,
      new_values: { via: "web", detail: true },
    });

    const user = userEvent.setup();
    render(<SecurityAuditLogsContent />);
    expect(screen.getByTestId("audit-loading")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("audit-table")).toHaveTextContent("login");
      expect(screen.getByTestId("audit-pagination")).toHaveTextContent("40");
    });

    await user.click(screen.getByText("Admin Demo"));
    await waitFor(() => {
      expect(getAuditLog).toHaveBeenCalledWith(5);
      expect(screen.getByTestId("audit-detail")).toHaveTextContent("detail");
    });

    listAuditLogs.mockResolvedValue({
      data: [{ ...sampleLog, id: 6, action: "logout" }],
      meta: { current_page: 2, per_page: 10, total: 40, last_page: 4 },
    });
    await user.click(screen.getByRole("button", { name: /suivant/i }));
    await waitFor(() => {
      expect(listAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2, per_page: 10 })
      );
    });
  });

  it("filters by action", async () => {
    listAuditLogs.mockResolvedValue({
      data: [],
      meta: { current_page: 1, per_page: 10, total: 0, last_page: 1 },
    });
    const user = userEvent.setup();
    render(<SecurityAuditLogsContent />);
    await waitFor(() => expect(screen.getByTestId("audit-filters")).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/filtrer par action/i), {
      target: { value: "update" },
    });
    await waitFor(() => {
      expect(listAuditLogs).toHaveBeenLastCalledWith(
        expect.objectContaining({ action: "update", page: 1 })
      );
    });
  });

  it("shows error state", async () => {
    listAuditLogs.mockRejectedValue(new Error("Audit KO"));
    render(<SecurityAuditLogsContent />);
    await waitFor(() => {
      expect(screen.getByTestId("audit-error")).toHaveTextContent("Audit KO");
    });
  });
});
