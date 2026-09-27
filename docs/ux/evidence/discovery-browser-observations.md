# Discovery browser observations — AS-IS v1

Baseline: `b9197e278e227a8e3da5ecb867d6d430f69c1d2f`. Captures are browser viewport screenshots from local Vite + Wrangler Worker/D1. They are not production/staging and do not certify touch hardware or the complete workflows.

## Coverage

Seven routes were opened read-only at 1280×900, 820×900 and 390×900 (21 screenshots): `/bookings`, `/rooms`, `/guests`, `/housekeeping`, `/reports`, `/users`, `/network`. The synthetic local profile was displayed on each page. No reservation, payment, charge, checkout, cleaning, user or network mutation was submitted. On Reception, the Next Arrival task was opened and then left as a read-only task view.

| Route | 1280 | 820 | 390 | Observed notes |
|---|---|---|---|---|
| Reception | [desktop](browser/discovery-bookings-1280.png) | [tablet](browser/discovery-bookings-820.png) | [mobile](browser/discovery-bookings-390.png) | Queue and separate account/cash stack; mobile lane strip horizontal; Billing selector remained Priority Arrival while queue displayed Next/Blocked Arrival. Worker returned during this visual session; later board/API reads succeeded after one local restart. |
| Rooms | [desktop](browser/discovery-rooms-1280.png) | [tablet](browser/discovery-rooms-820.png) | [mobile](browser/discovery-rooms-390.png) | At 390 detail prompt precedes room cards; long booking text clips/ellipsizes; room physical badge and count reflect distinct derived concepts. |
| Guests | [desktop](browser/discovery-guests-1280.png) | [tablet](browser/discovery-guests-820.png) | [mobile](browser/discovery-guests-390.png) | At 390 detail prompt precedes cards, situation buttons stay horizontally ordered and long context truncates. |
| Housekeeping | [desktop](browser/discovery-housekeeping-1280.png) | [tablet](browser/discovery-housekeeping-820.png) | [mobile](browser/discovery-housekeeping-390.png) | 820 shows stacked queue then selected room detail without modal overlay; source JS selects mobile dialog-like detail only below 768. 390 selected blocker appears in task workspace. |
| Reports | [desktop](browser/discovery-reports-1280.png) | [tablet](browser/discovery-reports-820.png) | [mobile](browser/discovery-reports-390.png) | At 820, four KPI cards and two series remain; at 390, KPI cards two-column and series stacked with inner list scroll. Successful render during this pass does not close historical shared browser finding. |
| Users | [desktop](browser/discovery-users-1280.png) | [tablet](browser/discovery-users-820.png) | [mobile](browser/discovery-users-390.png) | At 390 search/filter/card list and empty detail region; source selector filter does not prove all action states or roles. |
| Network | [desktop](browser/discovery-network-1280.png) | [tablet](browser/discovery-network-820.png) | [mobile](browser/discovery-network-390.png) | Current local identity received HTTP403 on hotels and network-kpis; same view displayed no hotels and analytics unavailable. Thus populated authorized layout remains unobserved. |

## Runtime event

At initial navigation, browser showed the application's generic service error; its console logged HTTP500 for `/api/v1/front-desk/board`, `/rooms`, `/guests`, `/bookings`, `/billing/balance`, `/auth/me`. Worker log ended with `workerd ... disconnected ... Broken pipe`; Vite logged `ECONNREFUSED 127.0.0.1:8787`. One Worker restart with the existing local persistence root restored HTTP200 for the booking board, auth, rooms, guests, booking/invoice and billing reads. Subsequent Network requests returned 403 due to the active local profile. This is one local runtime interruption followed by recovery, not a reproduced application defect attribution or a successful global browser suite.

Playwright setup was attempted through the in-app browser tool and failed because `node:process` import was disallowed. The installed terminal Playwright CLI worked; command and generated page/console logs were kept in ignored `.playwright-cli/` local runtime storage. Screenshots listed above are the durable evidence. Wrangler version was 4.125.0, local mode, persistence `.hms-local/p0-1-manual-31QTDM/combined`; no remote binding/deploy used.

## Claim limits

- Screenshot proportions establish captured layout at those viewport widths, not interaction quality, focus order, screen-reader output or physical touch reach.
- Desktop/tablet/mobile responsive labels combine screenshots and source breakpoint/component behavior; unknown states remain unknown.
- No mutation was used to inspect lifecycle outcomes; refer to historical targeted integration evidence only where cited separately.
- Local fixture state was already present and the app shell labeled it synthetic/unpersisted. Arrival/date values can advance with time; images capture one session state.
