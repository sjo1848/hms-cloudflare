# 17 — Reassignment history semantics

Status: `BINDING DEFINITION`

A booking has one current `room_id`, but an in-stay reassignment must not rewrite the fact that earlier nights were spent in the old room.

## V1 representation

- `bookings.room_id` = current assigned room;
- past `room_inventory_nights` already elapsed before reassignment remain associated with the old room;
- remaining inventory nights move to the destination;
- lifecycle `REASSIGN` event records old room, new room and effective hotel-local date.

Together these preserve sufficient operational/audit history without introducing a new split-stay entity in this wave.

## UI/history consequence

Current guest/stay summaries may show the current/final room as their primary room. When historical room movement matters, use lifecycle movement history rather than pretending one room represented the entire stay.

A richer `stay_segments` read model is deferred until a concrete reporting/product requirement justifies it.

## Reporting boundary

Hotel-level occupancy count remains one occupied room per active stay and is not materially changed by a mid-stay room move. Any future room-level historical occupancy report must use historical claims/events rather than only current `bookings.room_id`.