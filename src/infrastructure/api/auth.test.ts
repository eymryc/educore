import { beforeEach, describe, expect, it, vi } from "vitest";

const apiRequest = vi.fn();
const apiGet = vi.fn();
const apiPost = vi.fn();

vi.mock("@/infrastructure/api/client", () => ({
  apiRequest: (...args: unknown[]) => apiRequest(...args),
  api: {
    get: (...args: unknown[]) => apiGet(...args),
    post: (...args: unknown[]) => apiPost(...args),
  },
}));

import { loginRequest, meRequest, refreshTokenRequest } from "@/infrastructure/api/auth";

describe("auth API resource", () => {
  beforeEach(() => {
    apiRequest.mockReset();
    apiGet.mockReset();
    apiPost.mockReset();
  });

  it("posts login credentials without auth header", async () => {
    apiRequest.mockResolvedValue({
      token: "abc",
      token_type: "Bearer",
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
    });

    const result = await loginRequest("admin@educore.ci", "password");

    expect(apiRequest).toHaveBeenCalledWith("/auth/login", {
      method: "POST",
      body: { email: "admin@educore.ci", password: "password" },
      auth: false,
    });
    expect(result.token).toBe("abc");
  });

  it("fetches the current user via /auth/me", async () => {
    apiGet.mockResolvedValue({
      id: 1,
      name: "Admin",
      email: "admin@educore.ci",
      institution_id: 1,
      roles: ["ADMIN"],
      permissions: ["students.view"],
      email_verified_at: null,
      created_at: null,
    });

    const user = await meRequest();
    expect(apiGet).toHaveBeenCalledWith("/auth/me");
    expect(user.permissions).toContain("students.view");
  });

  it("refreshes the auth token", async () => {
    apiPost.mockResolvedValue({ token: "new-token", token_type: "Bearer" });
    const result = await refreshTokenRequest();
    expect(apiPost).toHaveBeenCalledWith("/auth/refresh");
    expect(result.token).toBe("new-token");
  });
});
