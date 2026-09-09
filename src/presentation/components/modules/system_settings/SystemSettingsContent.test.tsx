import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SystemSettingsContent } from "@/presentation/components/modules/system_settings/SystemSettingsContent";

const getGradingSettings = vi.fn();
const updateGradingSettings = vi.fn();
const getInstitution = vi.fn();
const updateInstitution = vi.fn();
const listCampuses = vi.fn();
const listBuildings = vi.fn();
const listInstitutionRooms = vi.fn();
const deleteCampus = vi.fn();
const deleteBuilding = vi.fn();
const deleteInstitutionRoom = vi.fn();
const listAcademicYears = vi.fn();
const listAcademicPeriods = vi.fn();
const listAcademicHolidays = vi.fn();
const listLevels = vi.fn();
const listSeries = vi.fn();
const listClassSubjects = vi.fn();
const listAuditLogs = vi.fn();
const listUsers = vi.fn();
const listRoles = vi.fn();
const listPermissions = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/infrastructure/api/resources/grades", () => ({
  getGradingSettings: (...args: unknown[]) => getGradingSettings(...args),
  updateGradingSettings: (...args: unknown[]) => updateGradingSettings(...args),
}));

vi.mock("@/infrastructure/api/resources/institution", () => ({
  getInstitution: (...args: unknown[]) => getInstitution(...args),
  updateInstitution: (...args: unknown[]) => updateInstitution(...args),
  listCampuses: (...args: unknown[]) => listCampuses(...args),
  listBuildings: (...args: unknown[]) => listBuildings(...args),
  listInstitutionRooms: (...args: unknown[]) => listInstitutionRooms(...args),
  deleteCampus: (...args: unknown[]) => deleteCampus(...args),
  deleteBuilding: (...args: unknown[]) => deleteBuilding(...args),
  deleteInstitutionRoom: (...args: unknown[]) => deleteInstitutionRoom(...args),
}));

vi.mock("@/infrastructure/api/resources/academic", () => ({
  listAcademicYears: (...args: unknown[]) => listAcademicYears(...args),
  listAcademicPeriods: (...args: unknown[]) => listAcademicPeriods(...args),
  listAcademicHolidays: (...args: unknown[]) => listAcademicHolidays(...args),
  listLevels: (...args: unknown[]) => listLevels(...args),
  listSeries: (...args: unknown[]) => listSeries(...args),
  listClassSubjects: (...args: unknown[]) => listClassSubjects(...args),
  activateAcademicYear: vi.fn(),
  closeAcademicYear: vi.fn(),
  deleteAcademicYear: vi.fn(),
  deleteAcademicPeriod: vi.fn(),
  deleteAcademicHoliday: vi.fn(),
  deleteLevel: vi.fn(),
  deleteSeries: vi.fn(),
  deleteClassSubject: vi.fn(),
}));

vi.mock("@/infrastructure/api/resources/audit", () => ({
  listAuditLogs: (...args: unknown[]) => listAuditLogs(...args),
  getAuditLog: vi.fn(),
}));

vi.mock("@/infrastructure/api/resources/identity", () => ({
  listUsers: (...args: unknown[]) => listUsers(...args),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  listRoles: (...args: unknown[]) => listRoles(...args),
  listPermissions: (...args: unknown[]) => listPermissions(...args),
  updateRolePermissions: vi.fn(),
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

vi.mock("next/image", () => ({
  default: (props: { alt: string }) => <img alt={props.alt} />,
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("@/presentation/components/providers/ConfirmDialogProvider", () => ({
  useConfirm: () => vi.fn().mockResolvedValue(true),
}));
describe("SystemSettingsContent", () => {
  beforeEach(() => {
    getGradingSettings.mockReset();
    updateGradingSettings.mockReset();
    getInstitution.mockReset();
    updateInstitution.mockReset();
    listCampuses.mockReset();
    listBuildings.mockReset();
    listInstitutionRooms.mockReset();
    deleteCampus.mockReset();
    deleteBuilding.mockReset();
    deleteInstitutionRoom.mockReset();
    listAcademicYears.mockReset();
    listAcademicPeriods.mockReset();
    listAcademicHolidays.mockReset();
    listLevels.mockReset();
    listSeries.mockReset();
    listClassSubjects.mockReset();
    listAuditLogs.mockReset();
    listUsers.mockReset();
    listRoles.mockReset();
    listPermissions.mockReset();

    listAcademicYears.mockResolvedValue([
      { id: 1, institution_id: 1, name: "2025-2026", start_date: "2025-09-01", end_date: "2026-07-31", is_active: true },
    ]);
    listAcademicPeriods.mockResolvedValue([]);
    listAcademicHolidays.mockResolvedValue([]);
    listLevels.mockResolvedValue([]);
    listSeries.mockResolvedValue([]);
    listClassSubjects.mockResolvedValue([]);
    listAuditLogs.mockResolvedValue({
      data: [],
      meta: { current_page: 1, last_page: 1, per_page: 25, total: 0 },
    });
    listUsers.mockResolvedValue({
      data: [],
      meta: { current_page: 1, last_page: 1, per_page: 10, total: 0 },
    });
    listRoles.mockResolvedValue([
      { id: 1, name: "TEACHER", permissions: ["students.view"] },
    ]);
    listPermissions.mockResolvedValue([
      { name: "students.view", domain: "students", action: "view" },
    ]);

    getInstitution.mockResolvedValue({
      id: 1,
      name: "Lycée Demo",
      slug: "lycee-demo",
      registration_code: "REG-001",
      establishment_year: 1998,
      address: "Abidjan",
      phone: "+22501020304",
      email: "contact@lycee.ci",
      logo: "https://example.com/logo.png",
    });
    updateInstitution.mockResolvedValue({
      id: 1,
      name: "Lycée Demo CI",
      slug: "lycee-demo",
      registration_code: "REG-001",
      establishment_year: 1998,
      address: "Abidjan",
      phone: "+22501020304",
      email: "contact@lycee.ci",
      logo: "https://example.com/logo.png",
    });

    listCampuses.mockResolvedValue([
      { id: 1, institution_id: 1, name: "Campus Nord", address: "Cocody" },
    ]);
    listBuildings.mockResolvedValue([
      {
        id: 10,
        institution_id: 1,
        campus_id: 1,
        name: "Bloc A",
        code: "A",
        floors: 2,
      },
    ]);
    listInstitutionRooms.mockResolvedValue([
      {
        id: 100,
        institution_id: 1,
        building_id: 10,
        name: "Salle 101",
        code: "101",
        capacity: 40,
        type: "classroom",
      },
    ]);

    getGradingSettings.mockResolvedValue({
      id: 1,
      institution_id: 1,
      scale_max: "20.00",
      passing_score: "10.00",
      decimal_places: 2,
      weighted_average: true,
      ranking_method: "weighted_average_desc",
    });
    updateGradingSettings.mockResolvedValue({
      id: 1,
      institution_id: 1,
      scale_max: "20.00",
      passing_score: "12.00",
      decimal_places: 2,
      weighted_average: true,
      ranking_method: "weighted_average_desc",
    });
  });

  it("loads and saves institution profile", async () => {
    const user = userEvent.setup();
    render(<SystemSettingsContent />);

    await waitFor(() => expect(getInstitution).toHaveBeenCalled());
    expect(screen.getByTestId("institution-profile-panel")).toBeInTheDocument();
    expect(screen.getByLabelText(/Nom de l'établissement/i)).toHaveValue("Lycée Demo");

    await user.clear(screen.getByLabelText(/Nom de l'établissement/i));
    await user.type(screen.getByLabelText(/Nom de l'établissement/i), "Lycée Demo CI");
    await user.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(updateInstitution).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Lycée Demo CI",
          registration_code: "REG-001",
          establishment_year: 1998,
        })
      );
    });
    expect(await screen.findByText(/Profil établissement enregistré/i)).toBeInTheDocument();
  });

  it("lists campuses, buildings and rooms", async () => {
    const user = userEvent.setup();
    render(<SystemSettingsContent />);

    await user.click(screen.getByRole("button", { name: /Campus & salles/i }));
    await waitFor(() => expect(screen.getByTestId("sites-panel")).toBeInTheDocument());
    await waitFor(() => expect(listCampuses).toHaveBeenCalled());
    expect(listBuildings).toHaveBeenCalled();
    expect(listInstitutionRooms).toHaveBeenCalled();

    expect(screen.getByText("Campus Nord")).toBeInTheDocument();
    expect(screen.getByText(/Bloc A \(A\)/)).toBeInTheDocument();
    expect(screen.getByText(/Salle 101 \(101\)/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /NOUVEAU CAMPUS/i })).toHaveAttribute(
      "href",
      "/crud/campuses/nouveau"
    );
  });

  it("loads and saves grading settings", async () => {
    const user = userEvent.setup();
    render(<SystemSettingsContent />);

    await user.click(screen.getByRole("button", { name: /Règles de notation/i }));
    await waitFor(() => expect(screen.getByTestId("grading-settings-panel")).toBeInTheDocument());
    await waitFor(() => expect(getGradingSettings).toHaveBeenCalled());
    expect(screen.getByLabelText("Barème max")).toHaveValue(20);

    await user.clear(screen.getByLabelText("Seuil de réussite"));
    await user.type(screen.getByLabelText("Seuil de réussite"), "12");
    await user.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(updateGradingSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          passing_score: 12,
          scale_max: 20,
          ranking_method: "weighted_average_desc",
        })
      );
    });
  });

  it("hosts the academic structure screen as a settings tab", async () => {
    const user = userEvent.setup();
    render(<SystemSettingsContent />);

    await user.click(screen.getByRole("button", { name: /Année académique/i }));
    await waitFor(() => expect(listAcademicYears).toHaveBeenCalled());
    expect(await screen.findByTestId("academic-years-table")).toBeInTheDocument();
    expect(screen.getByText(/2025-2026/)).toBeInTheDocument();
  });

  it("hosts the security audit log as a settings tab", async () => {
    const user = userEvent.setup();
    render(<SystemSettingsContent />);

    await user.click(screen.getByRole("button", { name: /Journal d'audit/i }));
    await waitFor(() => expect(listAuditLogs).toHaveBeenCalled());
    expect(await screen.findByTestId("audit-table")).toBeInTheDocument();
  });

  it("hosts users and roles as settings tabs", async () => {
    const user = userEvent.setup();
    render(<SystemSettingsContent />);

    await user.click(screen.getByRole("button", { name: /Utilisateurs/i }));
    await waitFor(() => expect(listUsers).toHaveBeenCalled());
    expect(await screen.findByTestId("users-table")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Rôles & permissions/i }));
    await waitFor(() => expect(listRoles).toHaveBeenCalled());
    expect(await screen.findByTestId("roles-panel")).toBeInTheDocument();
  });
});
