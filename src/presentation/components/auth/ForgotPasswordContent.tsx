"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { getAuthErrorMessage, useAuth } from "@/infrastructure/auth/AuthProvider";

export function ForgotPasswordContent() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await forgotPassword(email.trim());
      setMessage("Si un compte existe pour cet e-mail, un lien de réinitialisation a été envoyé.");
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-lg py-xl">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/20 p-xl space-y-lg">
        <div>
          <h1 className="font-display-lg text-display-lg text-primary tracking-tight">Mot de passe oublié</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">
            Saisissez votre e-mail pour recevoir un lien de réinitialisation.
          </p>
        </div>
        <form className="space-y-md" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-lg bg-error-container text-on-error-container px-md py-sm font-body-sm">
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-lg bg-secondary-container text-on-secondary-container px-md py-sm font-body-sm">
              {message}
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
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-primary text-on-primary font-title-sm px-lg py-sm disabled:opacity-60"
          >
            {saving ? "Envoi…" : "Envoyer le lien"}
          </button>
        </form>
        <Link href="/login" className="inline-flex items-center gap-xs font-body-sm text-primary hover:underline">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Retour à la connexion
        </Link>
      </div>
    </div>
  );
}
