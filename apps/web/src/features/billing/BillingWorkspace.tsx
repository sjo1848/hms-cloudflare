import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { ApiError, api } from "../../api/client";
import type { ActiveHotelContext, Booking, ExtraCharge, Invoice, Payment } from "../../domain/types";
import { useI18n } from "../../i18n";
import { AppLink, useAppRouter } from "../../app/router";
import "./billing-workspace.css";

type ChargePayload = { description: string; amount_cents: number; category: string };
type PendingCharge = { hotelId: string; bookingId: string; operationToken: string; payload: ChargePayload };
type ExtraChargeOperation = ExtraCharge & { booking_id: string; operation_token: string };
type ExtraChargeResult = { ok: true; operation_token: string; charge: ExtraChargeOperation; replayed: boolean; invoice: Invoice };
type BookingAccount = { invoice: Invoice; payments: Payment[]; charges: ExtraCharge[] };
type PaymentPayload = { amount_cents: number; payment_method: string; payment_reference: string | null; note: string | null };
type PendingPayment = { hotelId: string; bookingId: string; operationToken: string; payload: PaymentPayload };
const emptyBookingAccount: BookingAccount = { invoice: null, payments: [], charges: [] };

function pendingChargeKey(hotelId: string, bookingId: string) {
  return "hms.billing.pending-extra-charge:" + hotelId + ":" + bookingId;
}

function selectedBookingKey(hotelId: string) {
  return "hms.billing.selected-booking:" + hotelId;
}

function pendingPaymentKey(hotelId: string, bookingId: string) {
  return "hms.billing.pending-payment:" + hotelId + ":" + bookingId;
}

function receptionReturnPath(value: string | null) {
  if (!value) return "/bookings";
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin || url.pathname !== "/bookings") return "/bookings";
    return url.pathname + url.search + url.hash;
  } catch {
    return "/bookings";
  }
}

function BillingPanel() {
  const { t, statusLabel, paymentMethodLabel, formatCurrency } = useI18n();
  const router = useAppRouter();
  const routeParams = new URLSearchParams(router.search);
  const contextBookingId = routeParams.get("booking_id");
  const returnTo = routeParams.get("return_to");
  const validReturnTo = receptionReturnPath(returnTo);
  const [items, setItems] = useState<Booking[]>([]);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [hotelId, setHotelId] = useState<string | null>(null);
  const [account, setAccount] = useState<BookingAccount>(emptyBookingAccount);
  const [charge, setCharge] = useState({ description: "", amount: "" });
  const [pendingCharge, setPendingCharge] = useState<PendingCharge | null>(null);
  const [chargeRecovery, setChargeRecovery] = useState<"checking" | "retry" | "unknown" | "conflict" | null>(null);
  const [chargeMessage, setChargeMessage] = useState("");
  const [submittingCharge, setSubmittingCharge] = useState(false);
  const [payment, setPayment] = useState({ amount: "", method: "CASH", reference: "", note: "" });
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(null);
  const [paymentRecovery, setPaymentRecovery] = useState<"retry" | null>(null);
  const [error, setError] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const accountRequestIdRef = useRef(0);
  const [accountLoading, setAccountLoading] = useState(false);

  async function refresh(id?: string) {
    const requestId = ++accountRequestIdRef.current;
    setAccountLoading(true);
    setError("");
    try {
      const next = await api<Booking[]>("/bookings?limit=100");
      if (requestId !== accountRequestIdRef.current) return null;
      setItems(next);
      let savedId: string | null = null;
      if (hotelId) {
        try {
          savedId = window.sessionStorage.getItem(selectedBookingKey(hotelId));
        } catch {
          // Booking selection persistence is best-effort.
        }
      }
      const requestedId = id ?? contextBookingId;
      let current = requestedId ? next.find(item => item.id === requestedId) : undefined;
      if (requestedId && !current) {
        try {
          current = await api<Booking>("/bookings/" + encodeURIComponent(requestedId));
          if (requestId !== accountRequestIdRef.current) return null;
        } catch (e) {
          if (requestId === accountRequestIdRef.current) {
            setSelected(null);
            setAccount(emptyBookingAccount);
            setError((e as Error).message);
          }
          return null;
        }
      }
      current = current
        ?? next.find(item => item.id === savedId)
        ?? next.find(item => item.id === selected?.id)
        ?? next[0];
      if (!current) {
        setSelected(null); setAccount(emptyBookingAccount);
        return null;
      }
      setSelected(current);
      if (selected?.id !== current.id) {
        setAccount(emptyBookingAccount);
      }
      const bookingPath = "/bookings/" + encodeURIComponent(current.id);
      const [nextInvoice, nextPayments, nextCharges] = await Promise.all([
        api<Invoice>(bookingPath + "/invoice"),
        api<Payment[]>(bookingPath + "/payments"),
        api<ExtraCharge[]>(bookingPath + "/extra-charges"),
      ]);
      if (requestId !== accountRequestIdRef.current) return null;
      setAccount({ invoice: nextInvoice, payments: nextPayments, charges: nextCharges });
      return { invoice: nextInvoice, charges: nextCharges };
    } catch (e) {
      if (requestId === accountRequestIdRef.current) {
        setAccount(emptyBookingAccount);
        setError((e as Error).message);
      }
      return null;
    } finally {
      if (requestId === accountRequestIdRef.current) setAccountLoading(false);
    }
  }

  useEffect(() => {
    void api<ActiveHotelContext>("/auth/me")
      .then(context => setHotelId(context.hotel_id))
      .catch(e => setError((e as Error).message));
  }, []);

  useEffect(() => {
    if (hotelId) void refresh(contextBookingId ?? undefined);
  }, [hotelId, contextBookingId]);

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

  useEffect(() => {
    if (!hotelId || !selected) return;
    try {
      const raw = window.sessionStorage.getItem(pendingPaymentKey(hotelId, selected.id));
      if (!raw) {
        setPendingPayment(null);
        setPaymentRecovery(null);
        return;
      }
      const pending = JSON.parse(raw) as PendingPayment;
      if (pending.hotelId !== hotelId || pending.bookingId !== selected.id || !pending.operationToken
        || !Number.isSafeInteger(pending.payload?.amount_cents) || pending.payload.amount_cents <= 0
        || !["CASH", "CARD", "TRANSFER"].includes(pending.payload.payment_method)
        || (pending.payload.payment_reference !== null && typeof pending.payload.payment_reference !== "string")
        || (pending.payload.note !== null && typeof pending.payload.note !== "string")) {
        setPendingPayment(null);
        setPaymentRecovery(null);
        setError(t("billing.paymentRecoveryConflict"));
        return;
      }
      setPendingPayment(pending);
      setPayment({ amount: String(pending.payload.amount_cents), method: pending.payload.payment_method, reference: pending.payload.payment_reference ?? "", note: pending.payload.note ?? "" });
      setPaymentRecovery("retry");
      setError(t("billing.paymentRecoveryPending"));
    } catch {
      setPendingPayment(null);
      setPaymentRecovery(null);
      setError(t("billing.paymentRecoveryConflict"));
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

  async function sendPayment(pending: PendingPayment) {
    if (submittingPayment || selected?.id !== pending.bookingId || hotelId !== pending.hotelId) return;
    setError(""); setSubmittingPayment(true); setPaymentRecovery(null);
    try {
      const result = await api<{ ok: true; amount_cents: number; invoice: Invoice }>("/bookings/" + encodeURIComponent(pending.bookingId) + "/payments", {
        method: "POST",
        body: JSON.stringify({ ...pending.payload, operation_token: pending.operationToken }),
      });
      if (result.amount_cents !== pending.payload.amount_cents) throw new Error(t("billing.paymentRecoveryConflict"));
      const refreshed = await refresh(pending.bookingId);
      if (!refreshed) {
        setPendingPayment(pending);
        setPaymentRecovery("retry");
        setError(t("billing.paymentRecoveryPending"));
        return;
      }
      try { window.sessionStorage.removeItem(pendingPaymentKey(pending.hotelId, pending.bookingId)); } catch { /* Durable replay identity remains; operator can retry if reload is needed. */ }
      setPendingPayment(null);
      setPayment({ amount: "", method: "CASH", reference: "", note: "" });
      setError("");
    } catch (e) {
      const apiError = e instanceof ApiError ? e : null;
      if (apiError && apiError.status >= 400 && apiError.status < 500) {
        try { window.sessionStorage.removeItem(pendingPaymentKey(pending.hotelId, pending.bookingId)); } catch { /* Business rejection is authoritative. */ }
        setPendingPayment(null);
        setPaymentRecovery(null);
        setError(apiError.message);
      } else {
        setPendingPayment(pending);
        setPaymentRecovery("retry");
        setError(t("billing.paymentRecoveryPending"));
      }
    } finally {
      setSubmittingPayment(false);
    }
  }

  async function submitPayment(event: FormEvent) {
    event.preventDefault();
    if (!selected || !hotelId || submittingPayment || pendingPayment) return;
    const amount = Number(payment.amount);
    if (!Number.isSafeInteger(amount) || amount <= 0) return;
    const pending: PendingPayment = {
      hotelId,
      bookingId: selected.id,
      operationToken: crypto.randomUUID(),
      payload: { amount_cents: amount, payment_method: payment.method, payment_reference: payment.reference || null, note: payment.note || null },
    };
    try {
      window.sessionStorage.setItem(pendingPaymentKey(hotelId, selected.id), JSON.stringify(pending));
    } catch {
      setError(t("billing.paymentRecoveryStorageError"));
      return;
    }
    setPendingPayment(pending);
    await sendPayment(pending);
  }

  const pendingPaymentForSelected = pendingPayment?.hotelId === hotelId && pendingPayment?.bookingId === selected?.id;
  const paymentLocked = Boolean(pendingPaymentForSelected) || submittingPayment || Boolean(pendingCharge) || submittingCharge;
  const chargeLocked = Boolean(pendingCharge) || submittingCharge || chargeRecovery === "conflict" || Boolean(pendingPaymentForSelected);
  return (
    <section className="billing-workspace billing-account-workspace">
      <div className="workspace-heading">
        <div>
          <p className="eyebrow">{t("billing.finance")}</p>
          <h2>{t("billing.title")}</h2>
          <p className="muted">{t("billing.subtitle")}</p>
        </div>
        {contextBookingId && <AppLink className="billing-return-reception" to={validReturnTo} historyState={{ __hmsReceptionFocusTarget: "case", __hmsReceptionFocusBookingId: contextBookingId }}>{t("shell.returnReception")}</AppLink>}
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      {!contextBookingId && <label>
        {t("billing.booking")}
        <select
          aria-label={t("billing.bookingAria")}
          value={selected?.id ?? ""}
          disabled={chargeLocked}
          onChange={event => {
            const next = items.find(item => item.id === event.target.value) ?? null;
            setSelected(next);
            setAccount(emptyBookingAccount);
            if (hotelId) {
              try { window.sessionStorage.setItem(selectedBookingKey(hotelId), event.target.value); } catch { /* selection persistence is best-effort */ }
            }
            void refresh(event.target.value);
          }}
        >
          <option value="">{t("billing.selectBooking")}</option>
          {items.map(item => <option key={item.id} value={item.id}>{item.guest_name} · {item.room_number}</option>)}
        </select>
      </label>}
      {selected && (
        <article className="case-panel">
          <h3>{selected.guest_name} · {t("billing.invoice")}</h3>
          {accountLoading && <p className="muted" role="status">{t("common.loading")}</p>}
          {pendingPaymentForSelected && paymentRecovery === "retry" && !submittingPayment && <div className="billing-charge-recovery status-badge" role="status">{t("billing.paymentRecoveryPending")}<button type="button" onClick={() => void sendPayment(pendingPayment!)}>{t("billing.paymentRetryButton")}</button></div>}
          {!accountLoading && !error && <>
          <dl className="billing-account-totals">
            <div><dt>{t("billing.total")}</dt><dd>{formatCurrency(account.invoice?.amount_cents ?? selected.total_cents)}</dd></div>
            <div><dt>{t("billing.paid")}</dt><dd>{formatCurrency(account.invoice?.paid_amount_cents ?? 0)}</dd></div>
            <div><dt>{t("billing.remaining")}</dt><dd>{formatCurrency(Math.max(0, (account.invoice?.amount_cents ?? selected.total_cents) - (account.invoice?.paid_amount_cents ?? 0)))}</dd></div>
            <div><dt>{t("billing.credit")}</dt><dd>{formatCurrency(Math.max(0, (account.invoice?.paid_amount_cents ?? 0) - (account.invoice?.amount_cents ?? selected.total_cents)))}</dd></div>
            <div><dt>{t("billing.invoice")}</dt><dd>{statusLabel(account.invoice?.status ?? "PENDING")}</dd></div>
          </dl>
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
            <input required min="1" type="number" aria-label={t("billing.paymentAmountAria")} placeholder={t("billing.paymentAmount")} value={payment.amount} disabled={paymentLocked} onChange={event => setPayment({ ...payment, amount: event.target.value })} />
            <select aria-label={t("billing.paymentMethodAria")} value={payment.method} disabled={paymentLocked} onChange={event => setPayment({ ...payment, method: event.target.value })}>
              <option value="CASH">{paymentMethodLabel("CASH")}</option>
              <option value="CARD">{paymentMethodLabel("CARD")}</option>
              <option value="TRANSFER">{paymentMethodLabel("TRANSFER")}</option>
            </select>
            <input aria-label={t("billing.referenceAria")} placeholder={t("billing.reference")} value={payment.reference} disabled={paymentLocked} onChange={event => setPayment({ ...payment, reference: event.target.value })} />
            <input aria-label={t("billing.noteAria")} placeholder={t("billing.note")} value={payment.note} disabled={paymentLocked} onChange={event => setPayment({ ...payment, note: event.target.value })} />
            <button type="submit" disabled={paymentLocked}>{submittingPayment ? t("billing.registering") : t("billing.registerPayment")}</button>
          </form>
          {account.charges.map(item => <p className="muted" key={item.id}>{t("billing.charge")} · {item.description} · {formatCurrency(item.amount_cents)}</p>)}
          {account.payments.map(item => <p className="muted" key={item.id}>{t("billing.payment")} · {formatCurrency(item.amount_cents)} · {paymentMethodLabel(item.payment_method)}</p>)}
          </>}
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
  const { search } = useAppRouter();
  const contextualBooking = new URLSearchParams(search).get("booking_id");
  return <><BillingPanel />{!contextualBooking && <CashBalancePanel />}</>;
}
