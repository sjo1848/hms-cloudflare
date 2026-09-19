# 10 — Operational UX acceptance targets

Status: `BINDING PRODUCT TARGETS`

`21-app-interaction-contract.md` is the binding interaction/motion/overlay/filter contract. This document states operational outcomes.

## Product feel

HMS must behave as one continuous operational application:
- persistent shell;
- stable selected context;
- filters/search survive ordinary refresh and mutations;
- module/context navigation preserves history;
- task work opens in focused drawers/sheets/dialogs rather than expanding long CRUD forms into the workspace;
- success returns the operator to the correct next operational case.

Animation alone does not satisfy this target.

## Zero-required-switch primary paths

From Reception:
- normal check-in;
- normal checkout with embedded authoritative Billing;
- in-stay reassignment;
- occupied-room maintenance report/escalation;
- reservation with existing or inline-created guest;
- stay extension;
- cancellation/no-show;
- late-arrival update.

From Housekeeping:
- dirty -> cleaning -> available;
- inspect/resolve maintenance where authorized.

## Overlay rules

- multi-step/context work -> drawer on desktop, full-screen sheet on mobile;
- destructive/material financial confirmation -> product dialog;
- low-risk metadata -> compact dialog/popover;
- non-blocking success -> toast;
- native browser confirm/alert is not accepted UX.

## Operator-memory rule

Known guest, booking, room, Billing, readiness, maintenance, date and selected-case context is never re-entered solely because another internal component owns it.

Reception-selected booking governs Billing; independent Billing reselection inside the Reception flow is a defect.

## Filters and continuity

Filters are first-class state:
- visible chips/counts + clear action;
- Back/Forward and contextual deep links restore meaningful filter/selection state;
- refresh/mutation does not reset filters;
- if current item leaves the filter after success, next case follows canonical operational priority.

## Pricing transparency

D9 non-priced actions show no invented price delta. Reassignment/extension/room-date pricing changes disclose resulting total and D11 Billing consequence before confirmation.

## High-risk confirmations

Explicit product confirmation remains for no-show, cancellation, checkout/release, room reassignment, admin pending-balance override and materially destructive maintenance consequences. Confirmation explains the concrete consequence.

## Feedback

First load uses skeletons. Refresh keeps known data visible. Mutation feedback is local to the task. Validation is inline. Conflict explains authoritative change and refreshes context without auto-replaying the write.

## Responsive acceptance

Browser proof must execute material tasks at mobile, tablet and desktop widths. Mobile must prove primary navigation, queue -> focused task -> return with preserved list position/filter, full-screen sheets and reachable sticky primary action.

## Simulation measurements

Record module switches, confirmations, duplicate input, filter loss, selection loss, conflict recovery, Back/Forward continuity, operator-memory burden and next-action clarity. No arbitrary click-count KPI replaces workflow quality.
