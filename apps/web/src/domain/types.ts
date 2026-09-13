export type Room = { id: string; room_number: string; room_type: string; status: string; price_cents: number };
export type Guest = { id: string; full_name: string; email: string; phone: string | null };
export type Hold = { id: string; start_date: string; end_date: string; hold_type: string; reason: string };
export type Booking = { id: string; guest_id: string; guest_name: string; room_id: string; room_number: string; check_in: string; check_out: string; status: string; total_cents: number; notes: string | null };
export type Invoice = { id: string; booking_id: string; amount_cents: number; paid_amount_cents: number; status: string; payment_method: string; payment_reference: string | null } | null;
export type Payment = { id: string; amount_cents: number; payment_method: string; payment_reference: string | null; received_at: string };
export type ExtraCharge = { id: string; description: string; amount_cents: number; category: string; created_at: string };
