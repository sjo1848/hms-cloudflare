# 08 — Stay extension and Billing consistency

Status: `BINDING CONSISTENCY`; extension price basis remains `HG-FIN-001`.

## Price delta

The extension must have one explicit `extension_delta_cents`, but how that delta is priced is a Human Gate documented in `13-financial-policy-gates.md`. BUILD must not infer current room rate, original rate or operator-entered rate until that gate is approved.

Existing booked nights are never silently repriced as a side effect of extension.

## Atomic financial consistency

Once the approved price delta is known, inventory/date and financial total changes form one logical operation.

If an invoice exists:

- `PENDING`: increase invoice amount by the approved delta; preserve paid amount;
- `PAID`: increase amount, reopen to `PENDING` when new amount exceeds paid amount, and stop presenting it as fully settled;
- `VOIDED`: reject extension pending explicit Billing recovery; never silently resurrect it.

If no invoice exists, booking total changes and normal Billing may create the invoice later.

## Audit

Successful extension records lifecycle old/new dates plus the approved delta, and money-affecting evidence required by `INV-MONEY-001`. Failed/stale extension writes no success event.

## UI consequence

Preview must display the proposed new checkout and approved price delta before confirmation. After success, embedded Billing refreshes and shows authoritative total/paid/remaining state.

## Concurrency

If payment, invoice, booking, hold or inventory state changes so the expected extension cannot be proven, the entire extension conflicts rather than partially applying.