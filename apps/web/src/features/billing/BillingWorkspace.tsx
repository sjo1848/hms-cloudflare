import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ApiError, api } from "../../api/client";
import type { ActiveHotelContext, Booking, ExtraCharge, Invoice, Payment } from "../../domain/types";
import { useI18n } from "../../i18n";
import "./billing-workspace.css";

type ChargePayload = { description: string; amount_cents: number; category: string };
type PendingCharge = { hotelId: string; bookingId: string; operationToken: string; payload: ChargePayload };
type ExtraChargeOperation = ExtraCharge & { booking_id: string; operation_token: string };
type ExtraChargeResult = { ok: true; operation_token: string; charge: ExtraChargeOperation; replayed: boolean; invoice: Invoice };

function pendingChargeKey(hotelId: string, bookingId: string) {
  return "hms.billing.pending-extra-charge:" + hotelId + ":" + bookingId;
}

function selectedBookingKey(hotelId: string) {
  return "hms.billing.selected-booking:" + hotelId;
}

function BillingPanel() {
  const { t, statusLabel, paymentMethodLabel, formatCurrency } = useI18n();
  const [items, setItems] = useState<Booking[]>([]);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [hotelId, setHotelId] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<Invoice>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [charges, setCharges] = useState<ExtraCharge[]>([]);
  const [charge, setCharge] = useState({ description: "", amount: "" });
  const [pendingCharge, setPendingCharge] = useState<PendingCharge | null>(null);
  const [chargeRecovery, setChargeRecovery] = useState<"checking" | "retry" | "unknown" | "conflict" | null>(null);
  const [chargeMessage, setChargeMessage] = useState("");
  const [submittingCharge, setSubmittingCharge] = useState(false);
  const [payment, setPayment] = useState({ amount: "", method: "CASH", reference: "", note: "" });
  const [error, setError] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentOperationToken, setPaymentOperationToken] = useState<string | null>(null);

  async function refresh(id?: string) {
    try {
      const next = await api<Booking[]>("/bookings?limit=100");
      setItems(next);
      let savedId: string | null = null;
      if (hotelId) {
        try {
          savedId = window.sessionStorage.getItem(selectedBookingKey(hotelId));
        } catch {
          // Booking selection persistence is best-effort.
        }
      }
      const current = next.find(item => item.id === id)
        ?? next.find(item => item.id === savedId)
        ?? next.find(item => item.id === selected?.id)
        ?? next[0];
      if (!current) {
        setSelected(null); setInvoice(null); setPayments([]); setCharges([]);
        return null;
      }
      setSelected(current);
      const bookingPath = "/bookings/" + encodeURIComponent(current.id);
      const [nextInvoice, nextPayments, nextCharges] = await Promise.all([
        api<Invoice>(bookingPath + "/invoice"),
        api<Payment[]>(bookingPath + "/payments"),
        api<ExtraCharge[]>(bookingPath + "/extra-charges"),
      ]);
      setInvoice(nextInvoice); setPayments(nextPayments); setCharges(nextCharges);
      return { invoice: nextInvoice, charges: nextCharges };
    } catch (e) {
      setError((e as Error).message);
      return null;
    }
  }

  useEffect(() => {
    void api<ActiveHotelContext>("/auth/me")
      .then(context => setHotelId(context.hotel_id))
      .catch(e => setError((e as Error).message));
  }, []);

  useEffect(() => {
    if (hotelId) void refresh();
  }, [hotelId]);

  async function confirmChargeOutcome(pending: PendingCharge, result: ExtraChargeResult) {
    const saved = result.charge;
    if (result.operation_token !== pending.operationToken
      || saved.operation_token !== pending.operationToken
      || saved.booking_id !== pending.bookingId
      || saved.description !== pending.payload.description
      || saved.amount_cents !== pending.payload.amount_cents
      || saved.category !== pending.payload.category) {
      setChargeRecovery("conflict");
      setChargeMessage(t("billing.chargeRecoveryConflict"));
      return;
    }
    const refreshed = await refresh(pending.bookingId);
    if (!refreshed || !refreshed.charges.some(item => item.id === saved.id)) {
      setChargeRecovery("unknown");
      setChargeMessage(t("billing.chargeRecoveryPending"));
      return;
    }
    try {
      window.sessionStorage.removeItem(pendingChargeKey(pending.hotelId, pending.bookingId));
    } catch {
      // Keep the pending identity if storage cannot be updated.
    }
    setPendingCharge(null);
    setChargeRecovery(null);
    setCharge({ description: "", amount: "" });
    setChargeMessage(t("billing.chargeSaved"));
    setError("");
  }

  async function recoverChargeOutcome(pending: PendingCharge, requestError?: unknown) {
    setChargeRecovery("checking");
    setChargeMessage(t("billing.chargeRecoveryPending"));
    try {
      const path = "/bookings/" + encodeURIComponent(pending.bookingId)
        + "/extra-charges/operations/" + encodeURIComponent(pending.operationToken);
      const result = await api<ExtraChargeResult>(path);
      await confirmChargeOutcome(pending, result);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        if (requestError instanceof ApiError && requestError.status >= 400 && requestError.status < 500) {
          try { window.sessionStorage.removeItem(pendingChargeKey(pending.hotelId, pending.bookingId)); } catch { /* visible rejection remains authoritative */ }
          setPendingCharge(null); setChargeRecovery(null); setChargeMessage(""); setError(requestError.message);
        } else {
          setChargeRecovery("retry"); setChargeMessage(t("billing.chargeRetrySame"));
        }
      } else {
        setChargeRecovery("unknown");
        setError(requestError ? `${String((requestError as Error).message)} ${String((e as Error).message)}` : (e as Error).message);
      }
    }
  }

  useEffect(() => {
    if (!hotelId || !selected) return;
    try {
      const raw = window.sessionStorage.getItem(pendingChargeKey(hotelId, selected.id));
      if (!raw) {
        setPendingCharge(null); setChargeRecovery(null); setChargeMessage("");
        return;
      }
      const pending = JSON.parse(raw) as PendingCharge;
      if (pending.hotelId !== hotelId || pending.bookingId !== selected.id || !pending.operationToken || !pending.payload) {
        setChargeRecovery("conflict"); setChargeMessage(t("billing.chargeRecoveryConflict"));
        return;
      }
      setPendingCharge(pending);
      setCharge({ description: pending.payload.description, amount: String(pending.payload.amount_cents) });
      void recoverChargeOutcome(pending);
    } catch {
      setChargeRecovery("conflict");
      setChargeMessage(t("billing.chargeRecoveryConflict"));
    }
  }, [hotelId, selected?.id]);

  async function sendCharge(pending: PendingCharge) {
    if (submittingCharge) return;
    setError(""); setSubmittingCharge(true); setChargeRecovery("checking");
    setChargeMessage(t("billing.chargeRecoveryPending"));
    try {
      const bookingPath = "/bookings/" + encodeURIComponent(pending.bookingId);
      const result = await api<ExtraChargeResult>(bookingPath + "/extra-charges", {
        method: "POST",
        body: JSON.stringify({ ...pending.payload, operation_token: pending.operationToken }),
      });
      await confirmChargeOutcome(pending, result);
    } catch (requestError) {
      await recoverChargeOutcome(pending, requestError);
    } finally {
      setSubmittingCharge(false);
    }
  }

  async function submitCharge(event: FormEvent) {
    event.preventDefault();
    if (!selected || !hotelId || submittingCharge || pendingCharge || chargeRecovery === "conflict") return;
    const payload = { description: charge.description.trim(), amount_cents: Number(charge.amount), category: "OTHER" };
    if (!payload.description || !Number.isSafeInteger(payload.amount_cents) || payload.amount_cents <= 0) return;
    const pending: PendingCharge = {
      hotelId,
      bookingId: selected.id,
      operationToken: crypto.randomUUID(),
      payload,
    };
    try {
      window.sessionStorage.setItem(pendingChargeKey(hotelId, selected.id), JSON.stringify(pending));
    } catch {
      setError(t("billing.chargeRecoveryPending"));
      return;
    }
    setPendingCharge(pending);
    await sendCharge(pending);
  }

  async function submitPayment(event: FormEvent) {
    event.preventDefault();
    if (!selected || submittingPayment) return;
    setError(""); setSubmittingPayment(true);
    const operationToken = paymentOperationToken ?? crypto.randomUUID();
    setPaymentOperationToken(operationToken);
    try {
      await api("/bookings/" + encodeURIComponent(selected.id) + "/payments", {
        method: "POST",
        body: JSON.stringify({
          amount_cents: Number(payment.amount),
          payment_method: payment.method,
          payment_reference: payment.reference || undefined,
          note: payment.note || undefined,
          operation_token: operationToken,
        }),
      });
      setPayment({ ...payment, amount: "", reference: "", note: "" });
      setPaymentOperationToken(null);
      await refresh(selected.id);
    } catch (e) {
      const apiError = e instanceof ApiError ? e : null;
      await refresh(selected.id);
      if (apiError && apiError.status >= 400 && apiError.status < 500) {
        setPaymentOperationToken(null); setError(apiError.message);
      } else {
        setError(String((e as Error).message) + " " + t("billing.retryPaymentHint"));
      }
    } finally {
      setSubmittingPayment(false);
    }
  }

  const chargeLocked = Boolean(pendingCharge) || submittingCharge || chargeRecovery === "conflict";
  return (
    <section className="billing-workspace billing-account-workspace">
      <div className="workspace-heading">
        <div>
          <p className="eyebrow">{t("billing.finance")}</p>
          <h2>{t("billing.title")}</h2>
          <p className="muted">{t("billing.subtitle")}</p>
        </div>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <label>
        {t("billing.booking")}
        <select
          aria-label={t("billing.bookingAria")}
          value={selected?.id ?? ""}
          disabled={chargeLocked}
          onChange={event => {
            if (hotelId) {
              try { window.sessionStorage.setItem(selectedBookingKey(hotelId), event.target.value); } catch { /* selection persistence is best-effort */ }
            }
            void refresh(event.target.value);
          }}
        >
          <option value="">{t("billing.selectBooking")}</option>
          {items.map(item => <option key={item.id} value={item.id}>{item.guest_name} · {item.room_number}</option>)}
        </select>
      </label>
      {selected && (
        <article className="case-panel">
          <h3>{selected.guest_name} · {t("billing.invoice")}</h3>
          <p className="muted">
            {t("billing.total")} {formatCurrency(invoice?.amount_cents ?? selected.total_cents)} ·
            {" "}{t("billing.paid")} {formatCurrency(invoice?.paid_amount_cents ?? 0)} ·
            {" "}{t("billing.remaining")} {formatCurrency(Math.max(0, (invoice?.amount_cents ?? selected.total_cents) - (invoice?.paid_amount_cents ?? 0)))} ·
            {" "}{statusLabel(invoice?.status ?? "PENDING")}
          </p>
          <form className="billing-extra-charge-form" onSubmit={submitCharge} aria-label={t("billing.extraChargeAria")}>
            <input
              required aria-label={t("billing.chargeDescriptionAria")} placeholder={t("billing.description")}
              value={charge.description} disabled={chargeLocked}
              onChange={event => setCharge({ ...charge, description: event.target.value })}
            />
            <input
              required min="1" type="number" aria-label={t("billing.chargeAmountAria")} placeholder={t("billing.amountCents")}
              value={charge.amount} disabled={chargeLocked}
              onChange={event => setCharge({ ...charge, amount: event.target.value })}
            />
            <button type="submit" disabled={chargeLocked}>
              {submittingCharge ? t("billing.registering") : t("billing.addCharge")}
            </button>
          </form>
          {chargeMessage && (
            <div role={chargeRecovery === "conflict" ? "alert" : "status"} className={`billing-charge-recovery ${chargeRecovery === "conflict" ? "error" : "status-badge"}`}>
              {chargeMessage}
              {pendingCharge && chargeRecovery === "retry" && (
                <button type="button" disabled={submittingCharge} onClick={() => void sendCharge(pendingCharge)}>
                  {t("billing.chargeRetryButton")}
                </button>
              )}
              {pendingCharge && chargeRecovery === "unknown" && (
                <button type="button" disabled={submittingCharge} onClick={() => void recoverChargeOutcome(pendingCharge)}>
                  {t("common.retry")}
                </button>
              )}
            </div>
          )}
          <form className="billing-payment-form" onSubmit={submitPayment} aria-label={t("billing.paymentAria")}>
            <input required min="1" type="number" aria-label={t("billing.paymentAmountAria")} placeholder={t("billing.paymentAmount")} value={payment.amount} onChange={event => setPayment({ ...payment, amount: event.target.value })} />
            <select aria-label={t("billing.paymentMethodAria")} value={payment.method} onChange={event => setPayment({ ...payment, method: event.target.value })}>
              <option value="CASH">{paymentMethodLabel("CASH")}</option>
              <option value="CARD">{paymentMethodLabel("CARD")}</option>
              <option value="TRANSFER">{paymentMethodLabel("TRANSFER")}</option>
            </select>
            <input aria-label={t("billing.referenceAria")} placeholder={t("billing.reference")} value={payment.reference} onChange={event => setPayment({ ...payment, reference: event.target.value })} />
            <input aria-label={t("billing.noteAria")} placeholder={t("billing.note")} value={payment.note} onChange={event => setPayment({ ...payment, note: event.target.value })} />
            <button type="submit" disabled={submittingPayment}>{submittingPayment ? t("billing.registering") : t("billing.registerPayment")}</button>
          </form>
          {charges.map(item => <p className="muted" key={item.id}>{t("billing.charge")} · {item.description} · {formatCurrency(item.amount_cents)}</p>)}
          {payments.map(item => <p className="muted" key={item.id}>{t("billing.payment")} · {formatCurrency(item.amount_cents)} · {paymentMethodLabel(item.payment_method)}</p>)}
        </article>
      )}
    </section>
  );
}

type CashBalance = { total_amount_cents: number; cash_amount_cents: number; card_amount_cents: number; non_cash_amount_cents: number; payment_count: number; pending_amount_cents: number; opening_time: string };
function CashBalancePanel() {
  const { t, formatCurrency, formatTime } = useI18n();
  const [balance, setBalance] = useState<CashBalance | null>(null); const [counted, setCounted] = useState(""); const [handoff, setHandoff] = useState(""); const [notes, setNotes] = useState(""); const [error, setError] = useState(""); const [message, setMessage] = useState("");
  async function refresh() { try { setBalance(await api<CashBalance>("/billing/balance")); } catch (e) { setError((e as Error).message); } }
  useEffect(() => { void refresh(); }, []);
  async function closeShift(event: FormEvent) { event.preventDefault(); if (!balance) return; setError(""); setMessage(""); try { const result = await api<{ cash_difference_cents: number }>("/billing/close-cash", { method: "POST", body: JSON.stringify({ expected_cash_amount_cents: balance.cash_amount_cents, expected_total_amount_cents: balance.total_amount_cents, expected_non_cash_amount_cents: balance.non_cash_amount_cents, expected_payment_count: balance.payment_count, counted_cash_amount_cents: Number(counted), handoff_to: handoff, notes: notes || undefined }) }); setMessage(t("billing.shiftClosed", { amount: formatCurrency(result.cash_difference_cents) })); setCounted(""); setHandoff(""); setNotes(""); await refresh(); } catch (e) { setError((e as Error).message); await refresh(); } }
  return <section className="billing-workspace billing-cash-workspace" aria-label={t("billing.cashBalanceAria")}><div className="workspace-heading"><div><p className="eyebrow">{t("billing.cashOperations")}</p><h2>{t("billing.shiftBalance")}</h2><p className="muted">{t("billing.shiftSubtitle")}</p></div><button type="button" onClick={() => void refresh()}>{t("billing.refreshBalance")}</button></div>{error && <p className="error" role="alert">{error}</p>}{message && <p className="status-badge" role="status">{message}</p>}{balance && <><div className="cards"><article><strong>{t("billing.total")} {formatCurrency(balance.total_amount_cents)}</strong><span>{t("billing.cash")} {formatCurrency(balance.cash_amount_cents)}</span><span>{t("billing.nonCash")} {formatCurrency(balance.non_cash_amount_cents)}</span><span>{balance.payment_count} {t("billing.payments")}</span></article><article><span>{t("billing.pendingInvoices")} {formatCurrency(balance.pending_amount_cents)}</span><span>{t("billing.opening")} {formatTime(balance.opening_time)}</span></article></div><form className="billing-close-cash-form" onSubmit={closeShift} aria-label={t("billing.closeShiftAria")}><label>{t("billing.expectedCash")} <input aria-label={t("billing.expectedCashAria")} type="number" value={balance.cash_amount_cents} readOnly /></label><label>{t("billing.countedCash")} <input required min="0" aria-label={t("billing.countedCashAria")} type="number" value={counted} onChange={e => setCounted(e.target.value)} /></label><label>{t("billing.handoffTo")} <input required minLength={1} aria-label={t("billing.handoffTo")} value={handoff} onChange={e => setHandoff(e.target.value)} /></label><label>{t("common.notes")} <input aria-label={t("billing.closeNotesAria")} value={notes} onChange={e => setNotes(e.target.value)} /></label><button>{t("billing.closeShift")}</button></form></>}</section>;
}

export function BillingWorkspace() {
  return <><BillingPanel /><CashBalancePanel /></>;
}
