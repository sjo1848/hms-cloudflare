# 03B — Cross-module context and navigation

Status: `BINDING DEFINITION`

Booking is primary context for reservation/stay work; room is primary for cleaning/maintenance. Interaction/history semantics are additionally governed by `21-app-interaction-contract.md`.

## Deep-link contract

- `/bookings?booking_id=<id>`
- `/rooms?room_id=<id>`
- `/guests?guest_id=<id>`
- `/housekeeping?room_id=<id>&date=<yyyy-mm-dd>`

Query context never authorizes access. Missing/invalid IDs fail safely.

## App-navigation semantics

The shell remains mounted across module switches. Contextual navigation focuses the referenced entity rather than merely loading the module top.

Back/Forward restores:
- module;
- meaningful query filters;
- selected entity where valid;
- prior list/queue context and scroll position when practical.

A contextual navigation must not unconditionally force `scrollTo(0,0)`. Top-level module navigation may use remembered/top workspace position, but returning via Back must restore the prior operational context.

## Contextual actions

Reception -> assigned room, guest, housekeeping/maintenance context.
Rooms -> active/upcoming booking, guest, housekeeping/maintenance.
Guests -> stay in Reception or related room.
Housekeeping -> blocking booking/departure in Reception.

## Selected Billing context

Reception-selected booking governs embedded Billing. Billing cannot silently retain/reselect another booking.

## Filter state

Meaningful filters/search belong to application navigation state per `21`: query params for shareable/history-relevant state, optional session memory only when URL does not specify them.
