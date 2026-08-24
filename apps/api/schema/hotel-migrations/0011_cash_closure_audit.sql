ALTER TABLE cash_closures ADD COLUMN request_id TEXT;
ALTER TABLE cash_closures ADD COLUMN hotel_id TEXT;

CREATE INDEX IF NOT EXISTS idx_cash_closures_request ON cash_closures(request_id);

CREATE TRIGGER IF NOT EXISTS trg_cash_closure_audit
AFTER INSERT ON cash_closures
BEGIN
  INSERT INTO financial_events (id,event_type,booking_id,actor_subject,request_id,hotel_id,details_json,created_at)
  VALUES (lower(hex(randomblob(16))), 'CASH_CLOSURE', NULL, NEW.actor_subject, NEW.request_id, NEW.hotel_id,
    json_object('total_amount_cents', NEW.total_amount_cents, 'cash_amount_cents', NEW.cash_amount_cents,
      'card_amount_cents', NEW.card_amount_cents, 'payment_count', NEW.payment_count,
      'counted_cash_amount_cents', NEW.counted_cash_amount_cents, 'opening_time', NEW.opening_time), NEW.closing_time);
END;
