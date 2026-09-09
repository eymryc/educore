"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FormField } from "@/presentation/components/forms/FormField";
import { getCrudAdapter } from "@/infrastructure/api/crud-adapters";
import { getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import { firstFieldError } from "@/shared/lib/form-mapper";
import { ApiError } from "@/shared/types/api.types";
import type {
  CrudField,
  CrudFieldOption,
  CrudResourceConfig,
  CrudSection,
} from "@/shared/types/crud-form.types";
import { useConfirm } from "@/presentation/components/providers/ConfirmDialogProvider";
import { FormSkeleton } from "@/presentation/components/shared/DataTableSkeleton";

interface CrudFormProps {
  config: CrudResourceConfig;
  mode: "create" | "edit";
  recordId?: string;
  initialValues?: Record<string, string | boolean>;
}

const CARD_CLASS =
  "border border-outline-variant/30 bg-white overflow-hidden shadow-[0_2px_4px_rgb(15_23_42/0.06),0_8px_24px_rgb(15_23_42/0.1),0_20px_48px_rgb(15_23_42/0.12)]";

const PRIMARY_BTN =
  "inline-flex items-center justify-center gap-sm h-10 bg-primary hover:bg-primary/90 text-on-primary font-label-caps text-label-caps px-lg transition-colors shadow-sm disabled:opacity-60";

const SECONDARY_BTN =
  "inline-flex items-center justify-center gap-sm h-10 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-caps text-label-caps px-lg transition-colors disabled:opacity-60";

const SECTION_ICONS: Record<string, string> = {
  Identité: "badge",
  Scolarité: "school",
  Contact: "call",
  Candidature: "how_to_reg",
  Affectation: "work",
  "Informations personnelles": "person",
};

function buildEmptyValues(config: CrudResourceConfig): Record<string, string | boolean> {
  const values: Record<string, string | boolean> = {};
  for (const section of config.sections) {
    for (const field of section.fields) {
      values[field.name] = field.type === "checkbox" ? false : "";
    }
  }
  return values;
}

function sectionIcon(section: CrudSection): string {
  return section.icon ?? SECTION_ICONS[section.title] ?? "edit_note";
}

function visibleFields(section: CrudSection, mode: "create" | "edit"): CrudField[] {
  return section.fields.filter(
    (field) => !(mode === "edit" && field.name === "create_portal_account")
  );
}

function isEmptyValue(field: CrudField, value: string | boolean | undefined): boolean {
  if (field.type === "checkbox") return false;
  return String(value ?? "").trim() === "";
}

function missingRequired(
  section: CrudSection,
  values: Record<string, string | boolean>,
  mode: "create" | "edit"
): CrudField[] {
  return visibleFields(section, mode).filter(
    (field) => field.required && isEmptyValue(field, values[field.name])
  );
}

export function CrudForm({ config, mode, recordId, initialValues }: CrudFormProps) {
  const confirmDialog = useConfirm();
  const router = useRouter();
  const adapter = useMemo(() => getCrudAdapter(config.key), [config.key]);
  const useStepper = config.sections.length >= 2;
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Record<string, string | boolean>>(() => {
    const base = initialValues ?? buildEmptyValues(config);
    if (mode === "create" && base.status === "") {
      base.status = "active";
    }
    if (mode === "create" && (config.key === "parents" || config.key === "teachers")) {
      base.create_portal_account = true;
    }
    if (mode === "create" && config.key === "enrollment" && base.origin === "") {
      base.origin = "NOUVELLE_INSCRIPTION";
    }
    return base;
  });
  const [fieldOptions, setFieldOptions] = useState<Record<string, CrudFieldOption[]>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(Boolean(adapter && mode === "edit"));
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const allFields = useMemo(
    () => config.sections.flatMap((s) => s.fields),
    [config.sections]
  );
  const lastStep = config.sections.length - 1;
  const currentSection = config.sections[step] ?? config.sections[0]!;
  const progress = ((step + 1) / config.sections.length) * 100;

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (!adapter) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const options = adapter.loadFieldOptions ? await adapter.loadFieldOptions() : {};
        if (cancelled) return;
        setFieldOptions(options);

        if (mode === "edit" && recordId) {
          const record = await adapter.loadRecord(recordId);
          if (!cancelled) setValues(record);
        }
      } catch (err) {
        if (!cancelled) setError(getAuthErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [adapter, mode, recordId]);

  const handleChange = (name: string, value: string | boolean) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  function markMissing(fields: CrudField[]) {
    const next: Record<string, string[]> = {};
    for (const field of fields) {
      next[field.name] = ["Ce champ est obligatoire."];
    }
    setFieldErrors((prev) => ({ ...prev, ...next }));
  }

  function goToStep(index: number) {
    if (index < 0 || index > lastStep) return;
    if (index > step) {
      const missing = missingRequired(currentSection, values, mode);
      if (missing.length) {
        markMissing(missing);
        setError("Complétez les champs obligatoires avant de continuer.");
        return;
      }
    }
    setError(null);
    setStep(index);
  }

  function goNext() {
    goToStep(step + 1);
  }

  const saveRecord = async () => {
    if (useStepper) {
      for (let i = 0; i < config.sections.length; i++) {
        const missing = missingRequired(config.sections[i]!, values, mode);
        if (missing.length) {
          markMissing(missing);
          setStep(i);
          setError("Complétez les champs obligatoires avant d'enregistrer.");
          return;
        }
      }
    }

    setSaving(true);
    setError(null);
    setFieldErrors({});

    try {
      if (adapter) {
        if (mode === "create") {
          await adapter.create(values);
        } else if (recordId) {
          await adapter.update(recordId, values);
        }
      } else {
        await new Promise((r) => setTimeout(r, 400));
      }
      router.push(config.listPath);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        const errors = err.errors ?? {};
        setFieldErrors(errors);
        setError(getAuthErrorMessage(err));
        const idx = config.sections.findIndex((section) =>
          section.fields.some((field) => errors[field.name]?.length)
        );
        if (idx >= 0) setStep(idx);
      } else {
        setError(getAuthErrorMessage(err));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (useStepper && step < lastStep) {
      goNext();
      return;
    }
    await saveRecord();
  };

  const handleDelete = async () => {
    if (!recordId || !await confirmDialog("Confirmer la suppression de cet enregistrement ?")) return;
    setSaving(true);
    setError(null);
    try {
      if (adapter) {
        await adapter.remove(recordId);
      } else {
        await new Promise((r) => setTimeout(r, 300));
      }
      router.push(config.listPath);
      router.refresh();
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto w-full py-2xl">
        <FormSkeleton />
      </div>
    );
  }

  const title =
    mode === "create"
      ? `Nouveau ${config.labelSingular}`
      : `Modifier ${config.labelSingular}`;

  return (
    <div className="max-w-3xl mx-auto w-full pb-xl">
      <section className={CARD_CLASS}>
        <div className="flex items-start gap-md px-md sm:px-lg py-md border-b border-outline-variant/15 bg-[#f7f9fb]">
          <span className="w-10 h-10 bg-primary-container text-on-primary-container inline-flex items-center justify-center shrink-0">
            <span aria-hidden className="material-symbols-outlined text-[22px]">
              {mode === "create" ? "person_add" : "edit"}
            </span>
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-title-sm text-[16px] text-on-surface">{title}</h2>
            <p className="text-[13px] text-on-surface-variant mt-0.5">
              {useStepper
                ? `${currentSection.title} · étape ${step + 1} sur ${config.sections.length}`
                : currentSection.description ?? `Renseignez les informations du ${config.labelSingular}.`}
            </p>
            {mode === "edit" && recordId && (
              <p className="text-[12px] text-on-surface-variant mt-xs">Référence : {recordId}</p>
            )}
          </div>
        </div>

        {useStepper && (
          <div className="px-md sm:px-lg pt-md pb-sm">
            <div
              aria-hidden
              className="h-1 bg-surface-container-high mb-md overflow-hidden"
            >
              <div
                className="h-full bg-primary transition-[width] duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <ol
              className="flex items-center gap-xs sm:gap-sm"
              data-testid="crud-stepper"
            >
              {config.sections.map((section, index) => {
                const done = index < step;
                const current = index === step;
                return (
                  <li className="flex items-center min-w-0 flex-1 last:flex-none" key={section.title}>
                    <button
                      aria-current={current ? "step" : undefined}
                      className="flex items-center gap-sm min-w-0 text-left"
                      onClick={() => goToStep(index)}
                      type="button"
                    >
                      <span
                        className={`w-8 h-8 rounded-[50%] shrink-0 inline-flex items-center justify-center text-[13px] font-semibold ${
                          done || current
                            ? "bg-primary text-on-primary"
                            : "bg-surface-container-high text-on-surface-variant"
                        }`}
                      >
                        {done ? (
                          <span aria-hidden className="material-symbols-outlined text-[18px]">
                            check
                          </span>
                        ) : (
                          index + 1
                        )}
                      </span>
                      <span className="hidden sm:block min-w-0">
                        <span
                          className={`block text-[13px] truncate ${
                            current ? "font-semibold text-on-surface" : "text-on-surface-variant"
                          }`}
                        >
                          {section.title}
                        </span>
                      </span>
                    </button>
                    {index < lastStep && (
                      <span
                        aria-hidden
                        className={`mx-sm h-px flex-1 ${
                          index < step ? "bg-primary" : "bg-outline-variant/40"
                        }`}
                      />
                    )}
                  </li>
                );
              })}
            </ol>
            <p className="sm:hidden mt-sm text-[13px] font-semibold text-on-surface">
              {currentSection.title}
            </p>
          </div>
        )}

        {error && (
          <div
            className="mx-md sm:mx-lg mb-md flex items-start gap-sm bg-error-container text-on-error-container px-md py-sm font-body-sm"
            role="alert"
          >
            <span aria-hidden className="material-symbols-outlined text-[18px] shrink-0">
              error
            </span>
            <span>{error}</span>
          </div>
        )}

        <form noValidate={useStepper} onSubmit={(e) => void handleSubmit(e)}>
          {(useStepper ? [currentSection] : config.sections).map((section) => (
            <section className="px-md sm:px-lg py-md" key={section.title}>
              <div className="flex items-start gap-sm mb-md">
                <span className="w-9 h-9 bg-primary-container/80 text-on-primary-container inline-flex items-center justify-center shrink-0">
                  <span aria-hidden className="material-symbols-outlined text-[20px]">
                    {sectionIcon(section)}
                  </span>
                </span>
                <div className="min-w-0">
                  <h3 className="font-title-sm text-[15px]">{section.title}</h3>
                  {section.description && (
                    <p className="text-[13px] text-on-surface-variant mt-0.5">
                      {section.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                {visibleFields(section, mode).map((field) => {
                  const options = fieldOptions[field.name] ?? field.options;
                  return (
                    <FormField
                      error={firstFieldError(fieldErrors, field.name)}
                      field={{ ...field, options }}
                      key={field.name}
                      onChange={handleChange}
                      value={values[field.name] ?? (field.type === "checkbox" ? false : "")}
                    />
                  );
                })}
              </div>
            </section>
          ))}

          <div className="px-md sm:px-lg py-md border-t border-outline-variant/15 bg-[#f7f9fb] flex flex-wrap items-center gap-sm">
            {useStepper && step > 0 && (
              <button className={SECONDARY_BTN} onClick={() => setStep(step - 1)} type="button">
                <span aria-hidden className="material-symbols-outlined text-[18px]">
                  arrow_back
                </span>
                Retour
              </button>
            )}
            <Link className={`${SECONDARY_BTN} ${useStepper && step > 0 ? "" : ""}`} href={config.listPath}>
              Annuler
            </Link>
            <div className="flex-1" />
            {mode === "edit" && (
              <button
                className="inline-flex items-center gap-sm h-10 px-md text-error hover:bg-error-container/40 font-label-caps text-label-caps disabled:opacity-60"
                disabled={saving}
                onClick={() => void handleDelete()}
                type="button"
              >
                <span aria-hidden className="material-symbols-outlined text-[18px]">
                  delete
                </span>
                Supprimer
              </button>
            )}
            {useStepper && step < lastStep ? (
              <button className={PRIMARY_BTN} type="submit">
                Continuer
                <span aria-hidden className="material-symbols-outlined text-[18px]">
                  arrow_forward
                </span>
              </button>
            ) : (
              <button className={PRIMARY_BTN} disabled={saving} type="submit">
                <span aria-hidden className="material-symbols-outlined text-[18px]">
                  save
                </span>
                {saving ? "Enregistrement..." : mode === "create" ? "Créer" : "Enregistrer"}
              </button>
            )}
          </div>
        </form>
      </section>

      <p className="mt-md text-[12px] text-on-surface-variant text-center">
        {allFields.filter((f) => f.required).length} champ(s) obligatoire(s)
        {adapter ? " — enregistrement via API." : " — données enregistrées localement (API à connecter)."}
      </p>
    </div>
  );
}
