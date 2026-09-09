"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchStudentDashboard } from "@/infrastructure/api/resources/dashboard";
import { listInvoices } from "@/infrastructure/api/resources/finance";
import { initiatePayment } from "@/infrastructure/api/resources/payments";
import { getAuthErrorMessage, useAuth } from "@/infrastructure/auth/AuthProvider";
import { ContentSkeleton } from "@/presentation/components/shared/DataTableSkeleton";
import { can, isParentUser, isStudentUser } from "@/shared/lib/permissions";
import {
  canOpenPaystackCheckout,
  canPayInvoice,
  formatMoneyFcfa,
  INVOICE_STATUS_LABELS,
  toMoneyNumber,
  type Invoice,
} from "@/shared/types/finance.types";
import { studentFullName } from "@/shared/types/student.types";

export function FeesPaymentsContent() {
  const { user } = useAuth();
  const isParent = isParentUser(user);
  const isStudent = isStudentUser(user);
  const canPay = can(user, "payments.create");

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [studentUnpaid, setStudentUnpaid] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      if (isStudent) {
        const dash = await fetchStudentDashboard();
        setStudentUnpaid(dash.unpaid_invoices ?? 0);
        setInvoices([]);
        return;
      }
      if (isParent) {
        // Un parent n'a jamais des dizaines de factures (borné par son
        // nombre d'enfants) — un per_page généreux évite d'avoir besoin
        // d'une pagination sur cette vue "mes frais" volontairement simple.
        const result = await listInvoices({ per_page: 100 });
        setInvoices(result.data);
        setStudentUnpaid(null);
      } else {
        // Portail élève/parent uniquement : un membre du personnel qui
        // prévisualise cette page (ex. admin) n'a pas de "mes frais" à
        // afficher — ne pas appeler /invoices sans filtre élève (ça
        // ramènerait une page de factures de toute l'école, sans rapport).
        setInvoices([]);
      }
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload on role change
  }, [isParent, isStudent, user?.id]);

  const unpaidTotal = useMemo(
    () =>
      invoices
        .filter((inv) => canPayInvoice(inv.status))
        .reduce((sum, inv) => sum + toMoneyNumber(inv.balance_due), 0),
    [invoices]
  );

  async function handlePay(invoice: Invoice) {
    if (!canPay) return;
    setBusyId(invoice.id);
    setError(null);
    setNotice(null);
    try {
      const payment = await initiatePayment({
        invoice_id: invoice.id,
        email: user?.email,
      });
      if (canOpenPaystackCheckout(payment) && payment.authorization_url) {
        setNotice("Redirection vers Paystack… La confirmation arrivera via webhook.");
        window.location.assign(payment.authorization_url);
        return;
      }
      setNotice(
        "Paiement initié. Statut en cours — confirmation via webhook uniquement."
      );
      await reload();
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col w-full gap-lg pb-xl max-w-5xl mx-auto px-md">
      <div>
        <h1 className="ui-page-title">Frais & paiements</h1>
        <p className="font-body-md text-on-surface-variant mt-sm">
          {isStudent
            ? "Les règlements sont gérés par un parent (Paystack)."
            : "Factures de vos enfants — paiement sécurisé Paystack."}
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-lg bg-error-container text-on-error-container px-md py-sm font-body-sm">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-lg bg-secondary-container text-on-secondary-container px-md py-sm font-body-sm">
          {notice}
        </div>
      )}

      {loading && <ContentSkeleton variant="list" />}

      {!loading && isStudent && (
        <div className="ui-card ui-card-pad" data-testid="student-fees-info">
          <span className="ui-stat-label">Factures en attente (indicatif)</span>
          <div className="ui-page-title mt-sm">{studentUnpaid ?? 0}</div>
          <p className="font-body-sm text-on-surface-variant mt-sm">
            Demandez à un parent de régler depuis son portail. Aucune confirmation
            de paiement n&apos;est faite côté application.
          </p>
        </div>
      )}

      {!loading && !isStudent && (
        <>
          <div className="ui-card ui-card-pad" data-testid="fees-unpaid-total">
            <span className="ui-stat-label">Solde impayé</span>
            <div className="ui-page-title mt-sm">{formatMoneyFcfa(unpaidTotal)}</div>
          </div>

          {invoices.length === 0 ? (
            <p className="font-body-md text-on-surface-variant" data-testid="fees-empty">
              Aucune facture.
            </p>
          ) : (
            <ul className="flex flex-col gap-sm" data-testid="fees-list">
              {invoices.map((inv) => (
                <li key={inv.id} className="ui-card ui-card-pad flex justify-between gap-md flex-wrap items-start">
                  <div>
                    <div className="font-title-sm text-on-surface">
                      {inv.invoice_number ?? `Facture #${inv.id}`}
                    </div>
                    <p className="font-body-sm text-on-surface-variant mt-xs">
                      {inv.student ? studentFullName(inv.student) : `Élève #${inv.student_id}`}
                      {" · "}
                      {INVOICE_STATUS_LABELS[inv.status] ?? inv.status}
                    </p>
                    <p className="font-body-sm text-on-surface-variant">
                      Échéance {inv.due_date} · reste {formatMoneyFcfa(inv.balance_due)}
                    </p>
                  </div>
                  {canPay && canPayInvoice(inv.status) && (
                    <button
                      type="button"
                      className="ui-btn-primary"
                      disabled={busyId === inv.id}
                      onClick={() => void handlePay(inv)}
                    >
                      {busyId === inv.id ? "Ouverture…" : "Payer (Paystack)"}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
