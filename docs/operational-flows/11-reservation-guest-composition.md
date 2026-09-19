# 11 — Reservation with inline guest creation

Status: `BINDING DEFINITION`

## Existing guest

When search finds the guest, normal booking creation uses the existing guest identity through `POST /api/v1/bookings`.

## New guest

When the operator chooses `Create guest` inside the reservation flow, guest creation and booking creation form one business intent.

Binding outcome:

- if guest validation or booking availability fails, no unintended orphan guest is persisted;
- if booking succeeds, guest and booking are both persisted and the new booking becomes active Reception case;
- tenant/hotel identity is authoritative and cannot come from client guest/booking IDs.

Because both records live in the same hotel D1, implementation uses one atomic business operation rather than UI compensation.

Canonical command is `POST /api/v1/bookings/with-guest`, defined in `19-api-command-contract-map.md`, and requires both `guests.write` and `bookings.write`. Guest payload reuses the existing guest-create contract; booking payload uses normal room/dates/notes fields. Generic frontend choreography `POST guest` then `POST booking` is outside target scope because booking conflict can leave unintended guest data.

## Duplicate handling

This flow does not auto-merge guests. Existing identity/email uniqueness rules remain authoritative. If identity appears to exist, UI returns to guest selection rather than inventing deduplication logic.

## Explicit save-only guest

Standalone Guests remains the place for intentionally creating a guest without a reservation. Inline flow does not expose implicit `save guest anyway` recovery unless later product policy requests it.

## Acceptance

- existing guest reservation succeeds through normal booking create;
- new guest + available room succeeds atomically through `bookings/with-guest`;
- new guest + concurrently lost room leaves neither booking nor unintended guest;
- duplicate/invalid guest error leaves no booking;
- missing either required capability returns forbidden;
- resulting booking is selected in Reception without module switch;
- OpenAPI/client contract represents the atomic command before browser acceptance.