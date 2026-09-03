"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { getAuthErrorMessage, useAuth } from "@/infrastructure/auth/AuthProvider";
import { FormSkeleton } from "@/presentation/components/shared/DataTableSkeleton";

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const home = await login(email.trim(), password);
      const next = searchParams.get("next");
      router.replace(next && next.startsWith("/") ? next : home);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="space-y-md" onSubmit={handleSubmit}>
      {error && (
        <div className="rounded-lg bg-error-container text-on-error-container px-md py-sm font-body-sm text-body-sm">
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
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg bg-surface-container-low border border-outline-variant/40 px-md py-sm font-body-md text-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <div className="space-y-xs">
        <label className="font-label-caps text-label-caps text-on-surface-variant uppercase" htmlFor="password">
          Mot de passe
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg bg-surface-container-low border border-outline-variant/40 px-md py-sm font-body-md text-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <div className="flex justify-end">
        <Link href="/forgot-password" className="font-body-sm text-body-sm text-primary hover:underline">
          Mot de passe oublié ?
        </Link>
      </div>
      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg bg-primary text-on-primary font-title-sm text-title-sm px-lg py-sm hover:opacity-90 transition-opacity disabled:opacity-60"
      >
        {saving ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}

export function LoginPageContent() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-lg py-xl">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/20 p-xl">
        <div className="flex items-center gap-md mb-xl">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary text-[28px]">school</span>
          </div>
          <div>
            <h1 className="font-display-lg text-display-lg text-primary tracking-tight">EduCore</h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Connexion à l&apos;espace établissement</p>
          </div>
        </div>
        <Suspense fallback={<FormSkeleton fields={3} />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
