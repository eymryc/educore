"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { getAuthErrorMessage, useAuth } from "@/infrastructure/auth/AuthProvider";
import { FormSkeleton } from "@/presentation/components/shared/DataTableSkeleton";

function ResetPasswordForm() {
  const { resetPassword } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const token = searchParams.get("token") ?? "";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await resetPassword({
        email: email.trim(),
        password,
        password_confirmation: passwordConfirmation,
        token,
      });
      router.replace("/login");
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="space-y-md" onSubmit={handleSubmit}>
      {!token && (
        <div className="rounded-lg bg-error-container text-on-error-container px-md py-sm font-body-sm">
          Lien invalide : jeton de réinitialisation manquant.
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-error-container text-on-error-container px-md py-sm font-body-sm">
          {error}
        </div>
      )}
      <div className="space-y-xs">
        <label className="font-label-caps text-label-caps text-on-surface-variant uppercase" htmlFor="email">
          E-mail
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg bg-surface-container-low border border-outline-variant/40 px-md py-sm outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <div className="space-y-xs">
        <label className="font-label-caps text-label-caps text-on-surface-variant uppercase" htmlFor="password">
          Nouveau mot de passe
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg bg-surface-container-low border border-outline-variant/40 px-md py-sm outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <div className="space-y-xs">
        <label
          className="font-label-caps text-label-caps text-on-surface-variant uppercase"
          htmlFor="password_confirmation"
        >
          Confirmation
        </label>
        <input
          id="password_confirmation"
          type="password"
          required
          value={passwordConfirmation}
          onChange={(e) => setPasswordConfirmation(e.target.value)}
          className="w-full rounded-lg bg-surface-container-low border border-outline-variant/40 px-md py-sm outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <button
        type="submit"
        disabled={saving || !token}
        className="w-full rounded-lg bg-primary text-on-primary font-title-sm px-lg py-sm disabled:opacity-60"
      >
        {saving ? "Enregistrement…" : "Réinitialiser le mot de passe"}
      </button>
    </form>
  );
}

export function ResetPasswordContent() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-lg py-xl">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/20 p-xl space-y-lg">
        <div>
          <h1 className="font-display-lg text-display-lg text-primary tracking-tight">Nouveau mot de passe</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">
            Choisissez un mot de passe sécurisé pour votre compte.
          </p>
        </div>
        <Suspense fallback={<FormSkeleton fields={4} />}>
          <ResetPasswordForm />
        </Suspense>
        <Link href="/login" className="inline-flex items-center gap-xs font-body-sm text-primary hover:underline">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Retour à la connexion
        </Link>
      </div>
    </div>
  );
}
