"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { getAuthErrorMessage, useAuth } from "@/infrastructure/auth/AuthProvider";
import { FormSkeleton } from "@/presentation/components/shared/DataTableSkeleton";

const fieldClass =
  "w-full h-12 bg-surface-container-low border border-outline-variant/25 px-md font-body-md text-body-md text-on-surface outline-none transition-shadow placeholder:text-on-surface-variant/45 focus:bg-white focus:border-primary/35 focus:ring-4 focus:ring-primary/10";

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <form className="flex flex-col gap-lg" onSubmit={handleSubmit}>
      {error && (
        <div className="flex items-start gap-sm bg-error-container text-on-error-container px-md py-sm font-body-sm">
          <span className="material-symbols-outlined text-[18px] shrink-0 mt-px">error</span>
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-col gap-sm">
        <label className="font-label-caps text-label-caps text-on-surface-variant uppercase" htmlFor="email">
          E-mail
        </label>
        <input
          autoComplete="username"
          className={fieldClass}
          id="email"
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@etablissement.ci"
          required
          type="email"
          value={email}
        />
      </div>

      <div className="flex flex-col gap-sm">
        <label className="font-label-caps text-label-caps text-on-surface-variant uppercase" htmlFor="password">
          Mot de passe
        </label>
        <div className="relative">
          <input
            autoComplete="current-password"
            className={`${fieldClass} pr-12`}
            id="password"
            onChange={(e) => setPassword(e.target.value)}
            required
            type={showPassword ? "text" : "password"}
            value={password}
          />
          <button
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 inline-flex items-center justify-center text-on-surface-variant/70 hover:text-on-surface transition-colors"
            onClick={() => setShowPassword((v) => !v)}
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">
              {showPassword ? "visibility_off" : "visibility"}
            </span>
          </button>
        </div>
        <div className="flex justify-end">
          <Link
            className="font-body-sm text-[13px] text-primary hover:underline underline-offset-2"
            href="/forgot-password"
          >
            Mot de passe oublié ?
          </Link>
        </div>
      </div>

      <button
        className="w-full h-12 bg-primary text-on-primary font-title-sm text-[16px] tracking-wide hover:bg-primary-container transition-colors disabled:opacity-60 shadow-[0_8px_24px_rgb(9_20_38/0.22)]"
        disabled={saving}
        type="submit"
      >
        {saving ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}

export function LoginPageContent() {
  return (
    <div className="fixed inset-0 overflow-hidden bg-[#091426]">
      <Image
        alt=""
        className="object-cover object-[18%_center]"
        fill
        priority
        sizes="100vw"
        src="/login-cover.png"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#091426]/55 via-transparent to-[#091426]/15" />

      <div className="absolute inset-0 flex flex-col sm:flex-row">
        <div className="h-[30%] sm:h-auto sm:flex-1 min-h-0 flex flex-col justify-end px-lg sm:px-xl lg:px-2xl pb-xl sm:pb-2xl">
          <div className="hidden sm:block max-w-md">
            <p className="font-label-caps text-[11px] tracking-[0.18em] uppercase text-white/75 mb-sm">
              EduCore · ERP scolaire
            </p>
            <p className="font-display-lg text-[32px] lg:text-[40px] leading-tight tracking-tight text-white drop-shadow-sm">
              Toute l&apos;école,
              <br />
              un seul espace.
            </p>
          </div>
        </div>

        <aside className="flex-1 sm:flex-none h-auto sm:h-full w-full sm:w-[32rem] lg:w-[36rem] shrink-0 flex flex-col bg-white shadow-[-24px_0_64px_rgb(9_20_38/0.22)] overflow-hidden">
          <div className="flex items-center gap-sm px-lg lg:px-2xl pt-lg">
            <div className="w-10 h-10 bg-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-on-primary text-[22px]">school</span>
            </div>
            <span className="font-headline-md text-[20px] tracking-tight text-primary">EduCore</span>
          </div>

          <div className="flex-1 flex flex-col justify-center px-lg lg:px-2xl py-md sm:py-lg min-h-0">
            <div className="w-full max-w-[22rem] mx-auto">
              <div className="mb-lg sm:mb-xl">
                <h1 className="font-headline-md text-[26px] sm:text-[28px] leading-8 tracking-tight text-on-surface">
                  Bonjour
                </h1>
                <p className="font-body-sm text-on-surface-variant mt-sm">
                  Connectez-vous à l&apos;espace établissement.
                </p>
              </div>
              <Suspense fallback={<FormSkeleton fields={3} />}>
                <LoginForm />
              </Suspense>
            </div>
          </div>

          <p className="px-lg lg:px-2xl pb-md sm:pb-lg text-center text-[12px] text-on-surface-variant/70">
            Accès réservé au personnel autorisé
          </p>
        </aside>
      </div>
    </div>
  );
}
