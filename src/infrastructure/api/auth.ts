import { api, apiRequest } from "@/infrastructure/api/client";
import type { AuthUser, LoginResult } from "@/shared/types/api.types";

export async function loginRequest(email: string, password: string): Promise<LoginResult> {
  return apiRequest<LoginResult>("/auth/login", {
    method: "POST",
    body: { email, password },
    auth: false,
  });
}

export async function logoutRequest(): Promise<void> {
  await api.post<null>("/auth/logout");
}

export async function meRequest(): Promise<AuthUser> {
  return api.get<AuthUser>("/auth/me");
}

export async function refreshTokenRequest(): Promise<{
  token: string;
  token_type: string;
}> {
  return api.post<{ token: string; token_type: string }>("/auth/refresh");
}

export async function forgotPasswordRequest(email: string): Promise<void> {
  await apiRequest<null>("/auth/forgot-password", {
    method: "POST",
    body: { email },
    auth: false,
  });
}

export async function resetPasswordRequest(input: {
  email: string;
  password: string;
  password_confirmation: string;
  token: string;
}): Promise<void> {
  await apiRequest<null>("/auth/reset-password", {
    method: "POST",
    body: input,
    auth: false,
  });
}
