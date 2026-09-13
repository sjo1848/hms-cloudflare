# 11 — Reservation with inline guest creation

Status: `BINDING DEFINITION`

## Existing guest

When search finds the guest, normal booking creation uses the existing guest identity.

## New guest

When the operator chooses `Create guest` inside the reservation flow, guest creation and booking creation form one business intent.

Binding outcome:

- if guest validation or booking availability fails, no orphan guest should be persisted by default;
- if the booking succeeds, guest and booking are both persisted and the new booking becomes the active Reception case;
- tenant/hotel identity is authoritative and cannot come from client guest/booking IDs.

Because both records live in the same hotel D1, implementation should use one atomic business operation rather than relying on UI compensation.

Exact endpoint shape is implementation latitude: a dedicated command or nested create is acceptable. Generic frontend choreography `POST guest` then `POST booking` is not the target because a booking conflict can leave unintended guest data.

## Duplicate handling

This flow does not auto-merge guests. Existing email uniqueness/schema rules remain authoritative. If identity appears to exist, UI should return to guest selection rather than inventing deduplication logic.

## Explicit save-only guest

Standalone Guests remains the place for intentionally creating a guest without a reservation. The inline flow should not expose an implicit `save guest anyway` recovery unless later product policy requests it.

## Acceptance

- existing guest reservation succeeds normally;
- new guest + available room succeeds atomically;
- new guest + concurrently lost room leaves neither booking nor unintended new guest;
- duplicate/invalid guest error leaves no booking;
- resulting booking is selected in Reception without a module switch.