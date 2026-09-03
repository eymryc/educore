import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RecruitmentContent } from "@/presentation/components/modules/recruitement_candidatures/RecruitmentContent";

const listHrJobPostings = vi.fn();
const listHrApplications = vi.fn();
const advanceHrApplication = vi.fn();
const rejectHrApplication = vi.fn();
const deleteHrJobPosting = vi.fn();

vi.mock("@/infrastructure/api/resources/hr", () => ({
  listHrJobPostings: (...args: unknown[]) => listHrJobPostings(...args),
  listHrApplications: (...args: unknown[]) => listHrApplications(...args),
  advanceHrApplication: (...args: unknown[]) => advanceHrApplication(...args),
  rejectHrApplication: (...args: unknown[]) => rejectHrApplication(...args),
  deleteHrJobPosting: (...args: unknown[]) => deleteHrJobPosting(...args),
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

describe("RecruitmentContent", () => {
  beforeEach(() => {
    listHrJobPostings.mockReset();
    listHrApplications.mockReset();
    advanceHrApplication.mockReset();
    rejectHrApplication.mockReset();
    deleteHrJobPosting.mockReset();

    listHrJobPostings.mockResolvedValue([
      {
        id: 12,
        institution_id: 1,
        department_id: 1,
        title: "Professeur de mathématiques",
        description: "Temps plein",
        application_deadline: "2026-10-31",
        status: "ouvert",
        department: { id: 1, name: "Sciences" },
        applications_count: 1,
      },
    ]);

    listHrApplications.mockResolvedValue([
      {
        id: 45,
        institution_id: 1,
        hr_job_posting_id: 12,
        first_name: "Sarah",
        last_name: "Jenkins",
        email: "sarah@example.com",
        phone: null,
        applied_position: "Professeur de mathématiques",
        status: "applied",
        applied_at: "2026-09-01",
        notes: null,
        job_posting: { id: 12, title: "Professeur de mathématiques" },
      },
    ]);

    advanceHrApplication.mockResolvedValue({
      id: 45,
      institution_id: 1,
      hr_job_posting_id: 12,
      first_name: "Sarah",
      last_name: "Jenkins",
      email: "sarah@example.com",
      phone: null,
      applied_position: "Professeur de mathématiques",
      status: "screening",
      applied_at: "2026-09-01",
      notes: null,
    });

    rejectHrApplication.mockResolvedValue({
      id: 45,
      institution_id: 1,
      hr_job_posting_id: 12,
      first_name: "Sarah",
      last_name: "Jenkins",
      email: "sarah@example.com",
      phone: null,
      applied_position: "Professeur de mathématiques",
      status: "rejected",
      applied_at: "2026-09-01",
      notes: null,
    });
  });

  it("lists postings and applications on tabs", async () => {
    const user = userEvent.setup();
    render(<RecruitmentContent />);

    await waitFor(() => expect(listHrJobPostings).toHaveBeenCalled());
    expect(listHrApplications).toHaveBeenCalled();
    expect(await screen.findByText("Professeur de mathématiques")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Nouvelle offre/i })).toHaveAttribute(
      "href",
      "/crud/recruitment/nouveau"
    );

    await user.click(screen.getByRole("tab", { name: /Candidatures/i }));
    expect(await screen.findByTestId("application-card-45")).toBeInTheDocument();
    expect(screen.getByText("Sarah Jenkins")).toBeInTheDocument();
    expect(screen.getByTestId("column-applied")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Nouvelle candidature/i })).toHaveAttribute(
      "href",
      "/crud/hr-applications/nouveau"
    );
  });

  it("advances an application in the pipeline", async () => {
    const user = userEvent.setup();
    render(<RecruitmentContent />);

    await user.click(await screen.findByRole("tab", { name: /Candidatures/i }));
    await screen.findByText("Sarah Jenkins");
    await user.click(screen.getByRole("button", { name: /Actions pour Sarah Jenkins/i }));
    await user.click(screen.getByRole("menuitem", { name: "Avancer" }));

    await waitFor(() => expect(advanceHrApplication).toHaveBeenCalledWith(45));
    expect(await screen.findByText(/Sarah Jenkins → Présélection/i)).toBeInTheDocument();
  });

  it("rejects an application after confirm", async () => {
    const user = userEvent.setup();
    render(<RecruitmentContent />);

    await user.click(await screen.findByRole("tab", { name: /Candidatures/i }));
    await screen.findByText("Sarah Jenkins");
    await user.click(screen.getByRole("button", { name: /Actions pour Sarah Jenkins/i }));
    await user.click(screen.getByRole("menuitem", { name: "Rejeter" }));

    await waitFor(() => expect(rejectHrApplication).toHaveBeenCalledWith(45));
    expect(await screen.findByText(/Sarah Jenkins rejetée/i)).toBeInTheDocument();
  });
});
