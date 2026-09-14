# 13 — Financial policy and source-parity register

Status: `BINDING CLARIFICATION`; no open Human Gate for the defined operational-flow wave.

Accepted pricing remains binding for intentional room/date repricing, reassignment, extension and extra charges.

D9 binds the opposite side: guest/name/notes-only updates, check-in, cancellation, no-show, late arrival and checkout preserve the stored booking total.

D11 in `20-intentional-target-departures.md` is authoritative when a priced mutation changes an invoice after prior collection. It defines derived remaining/credit values, invoice status and timestamp reconciliation, preservation of payment history, the required schema correction, and fail-closed handling of an existing VOIDED invoice.

Checkout uses the resulting authoritative Billing truth. `settled` requires no remaining balance on a valid invoice; `pending-approved` remains the governed positive-balance exception with admin-only override.

Future commercial/accounting behavior beyond D11 requires a separate decision. Any contradiction here is resolved in favor of D9/D11.