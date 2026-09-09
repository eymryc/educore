import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminHeader } from "@/presentation/components/layout/AdminHeader";

const listAcademicYears = vi.fn();
const activateAcademicYear = vi.fn();
const getUnreadNotificationCount = vi.fn();

vi.mock("@/infrastructure/api/resources/academic", () => ({
  listAcademicYears: (...args: unknown[]) => listAcademicYears(...args),
  activateAcademicYear: (...args: unknown[]) => activateAcademicYear(...args),
}));

vi.mock("@/infrastructure/api/resources/notifications", () => ({
  getUnreadNotificationCount: (...args: unknown[]) => getUnreadNotificationCount(...args),
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
    logout: vi.fn(),
  }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/students",
}));

vi.mock("@/presentation/components/providers/ConfirmDialogProvider", () => ({
  useConfirm: () => vi.fn().mockResolvedValue(true),
}));
describe("AdminHeader", () => {
  beforeEach(() => {
    listAcademicYears.mockReset();
    activateAcademicYear.mockReset();
    getUnreadNotificationCount.mockReset();
  });

  it("loads academic years from the API and selects the active one", async () => {
    listAcademicYears.mockResolvedValue([
      { id: 1, name: "2024-2025", is_active: false },
      { id: 2, name: "2025-2026", is_active: true },
    ]);
    getUnreadNotificationCount.mockResolvedValue({ count: 0 });

    render(<AdminHeader />);

    await waitFor(() => {
      expect(screen.getByTestId("admin-header-year")).toHaveTextContent("2025-2026");
    });
    expect(screen.queryByTestId("admin-header-unread-dot")).not.toBeInTheDocument();
    expect(screen.getByTestId("admin-page-chrome")).toHaveTextContent("Élèves");
  });

  it("shows unread notification dot when count > 0", async () => {
    listAcademicYears.mockResolvedValue([{ id: 1, name: "2025-2026", is_active: true }]);
    getUnreadNotificationCount.mockResolvedValue({ count: 3 });

    render(<AdminHeader />);

    await waitFor(() => {
      expect(screen.getByTestId("admin-header-unread-dot")).toBeInTheDocument();
    });
  });

  it("actually activates the selected year server-side and reloads", async () => {
    const user = userEvent.setup();
    const reload = vi.fn();
    vi.spyOn(window, "location", "get").mockReturnValue({
      ...window.location,
      reload,
    } as Location);

    listAcademicYears.mockResolvedValue([
      { id: 1, name: "2024-2025", is_active: false },
      { id: 2, name: "2025-2026", is_active: true },
    ]);
    activateAcademicYear.mockResolvedValue({ id: 1, name: "2024-2025", is_active: true });
    getUnreadNotificationCount.mockResolvedValue({ count: 0 });

    render(<AdminHeader />);
    await waitFor(() => {
      expect(screen.getByTestId("admin-header-year")).toHaveTextContent("2025-2026");
    });

    await user.click(screen.getByLabelText("Année scolaire active"));
    await user.click(await screen.findByRole("option", { name: /2024-2025/i }));

    await waitFor(() => expect(activateAcademicYear).toHaveBeenCalledWith("1"));
    await waitFor(() => expect(reload).toHaveBeenCalled());
  });

  it("shows a read-only indicator when the selected year is closed", async () => {
    listAcademicYears.mockResolvedValue([
      { id: 1, name: "2023-2024", is_active: true, status: "closed" },
      { id: 2, name: "2025-2026", is_active: false, status: "active" },
    ]);
    getUnreadNotificationCount.mockResolvedValue({ count: 0 });

    render(<AdminHeader />);

    await waitFor(() => {
      expect(screen.getByTestId("admin-header-year-readonly")).toHaveTextContent("Lecture seule");
    });
  });
});
