-- F0.6: isolated, digest-bound shadow rehearsal for explicitly sourced
-- synthetic active-stay pricing. Nothing here backfills or rewrites accounts.
CREATE TABLE active_stay_bootstrap_heads (
  hotel_id TEXT NOT NULL,
  model_version TEXT NOT NULL,
  source_digest TEXT NOT NULL,
  run_id TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (hotel_id, model_version)
);

CREATE TABLE active_stay_bootstrap_runs (
  run_id TEXT PRIMARY KEY,
  hotel_id TEXT NOT NULL,
  source_digest TEXT NOT NULL,
  model_version TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('SHADOWED','ACTIVATING','COMPLETE','BLOCKED')),
  manifest_json TEXT NOT NULL CHECK (json_valid(manifest_json)),
  activation_token TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (hotel_id, source_digest, model_version)
);

CREATE TABLE active_stay_bootstrap_candidates (
  candidate_id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  hotel_id TEXT NOT NULL,
  booking_id TEXT NOT NULL,
  classification TEXT NOT NULL CHECK (classification IN (
    'TRACEABLE_SEGMENTS','TRACEABLE_AGGREGATE_ONLY','ACCOUNT_MISMATCH','VOIDED','ORPHAN_OR_CONFLICT'
  )),
  status TEXT NOT NULL CHECK (status IN ('SHADOWED','HELD','ACTIVATING','ACTIVATED')),
  baseline_source_json TEXT NOT NULL CHECK (json_valid(baseline_source_json)),
  candidate_json TEXT NOT NULL CHECK (json_valid(candidate_json)),
  source_digest TEXT NOT NULL,
  currency_basis TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (run_id) REFERENCES active_stay_bootstrap_runs(run_id) ON DELETE CASCADE,
  UNIQUE (run_id, booking_id)
);

CREATE INDEX idx_active_stay_bootstrap_candidate_status
  ON active_stay_bootstrap_candidates(hotel_id, status, booking_id);

CREATE TABLE active_stay_bootstrap_candidate_segments (
  candidate_id TEXT NOT NULL,
  segment_order INTEGER NOT NULL CHECK (segment_order > 0),
  source_ref TEXT NOT NULL,
  room_id TEXT NOT NULL,
  effective_start TEXT NOT NULL,
  effective_end TEXT NOT NULL,
  rate_cents INTEGER NOT NULL CHECK (rate_cents >= 0),
  source_rate_version INTEGER NOT NULL CHECK (source_rate_version >= 0),
  operation_token TEXT NOT NULL UNIQUE,
  PRIMARY KEY (candidate_id, segment_order),
  CHECK (effective_start < effective_end),
  FOREIGN KEY (candidate_id) REFERENCES active_stay_bootstrap_candidates(candidate_id) ON DELETE CASCADE,
  FOREIGN KEY (room_id) REFERENCES rooms(id)
);

CREATE TABLE active_stay_bootstrap_snapshot_rooms (
  candidate_id TEXT NOT NULL,
  room_id TEXT NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  pricing_version INTEGER NOT NULL,
  inventory_version INTEGER NOT NULL,
  room_state_version INTEGER NOT NULL,
  PRIMARY KEY (candidate_id, room_id),
  FOREIGN KEY (candidate_id) REFERENCES active_stay_bootstrap_candidates(candidate_id) ON DELETE CASCADE
);

CREATE TABLE active_stay_bootstrap_snapshot_inventory (
  candidate_id TEXT NOT NULL,
  room_id TEXT NOT NULL,
  stay_date TEXT NOT NULL,
  booking_id TEXT NOT NULL,
  PRIMARY KEY (candidate_id, room_id, stay_date, booking_id),
  FOREIGN KEY (candidate_id) REFERENCES active_stay_bootstrap_candidates(candidate_id) ON DELETE CASCADE
);

CREATE TABLE active_stay_bootstrap_snapshot_charges (
  candidate_id TEXT NOT NULL,
  charge_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (candidate_id, charge_id),
  FOREIGN KEY (candidate_id) REFERENCES active_stay_bootstrap_candidates(candidate_id) ON DELETE CASCADE
);

CREATE TABLE active_stay_bootstrap_snapshot_payments (
  candidate_id TEXT NOT NULL,
  payment_id TEXT NOT NULL,
  booking_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  payment_method TEXT NOT NULL,
  payment_reference TEXT,
  note TEXT,
  received_by_user_id TEXT NOT NULL,
  received_at TEXT NOT NULL,
  operation_token TEXT,
  PRIMARY KEY (candidate_id, payment_id),
  FOREIGN KEY (candidate_id) REFERENCES active_stay_bootstrap_candidates(candidate_id) ON DELETE CASCADE
);

CREATE TRIGGER active_stay_bootstrap_run_update_guard
BEFORE UPDATE ON active_stay_bootstrap_runs
WHEN NEW.run_id<>OLD.run_id OR NEW.hotel_id<>OLD.hotel_id OR NEW.source_digest<>OLD.source_digest
  OR NEW.model_version<>OLD.model_version OR NEW.manifest_json<>OLD.manifest_json
  OR NEW.created_at<>OLD.created_at
  OR (NEW.status<>OLD.status AND NOT (
    (OLD.status='SHADOWED' AND NEW.status IN ('ACTIVATING','COMPLETE','BLOCKED'))
    OR (OLD.status='ACTIVATING' AND NEW.status IN ('COMPLETE','BLOCKED'))
  ))
  OR (OLD.activation_token IS NOT NULL AND COALESCE(NEW.activation_token,'')<>OLD.activation_token)
  OR (NEW.activation_token IS NOT NULL AND NEW.status<>'ACTIVATING' AND OLD.status<>'ACTIVATING')
  OR (NEW.status='ACTIVATING' AND COALESCE(NEW.activation_token,'')<>NEW.run_id)
BEGIN
  SELECT RAISE(ABORT,'active-stay bootstrap run identity/state is immutable');
END;

CREATE TRIGGER active_stay_bootstrap_candidate_insert_guard
BEFORE INSERT ON active_stay_bootstrap_candidates
WHEN NOT EXISTS (
  SELECT 1 FROM active_stay_bootstrap_runs r
  WHERE r.run_id=NEW.run_id AND r.hotel_id=NEW.hotel_id AND r.source_digest=NEW.source_digest
    AND json_extract(NEW.candidate_json,'$.bookingId')=NEW.booking_id
    AND json_extract(NEW.candidate_json,'$.classification')=NEW.classification
    AND json_extract(NEW.candidate_json,'$.currencyBasis')=NEW.currency_basis
    AND json_extract(NEW.candidate_json,'$.baselineDigest') IS NOT NULL
    AND json(NEW.baseline_source_json)=json_extract(NEW.candidate_json,'$.sourceSnapshot')
    AND EXISTS (SELECT 1 FROM json_each(r.manifest_json,'$.candidates') x
      WHERE json_extract(x.value,'$.bookingId')=NEW.booking_id
        AND json_extract(x.value,'$.classification')=NEW.classification
        AND json_extract(x.value,'$.baselineDigest')=json_extract(NEW.candidate_json,'$.baselineDigest')
        AND json_extract(x.value,'$.currencyBasis')=NEW.currency_basis)
    AND NEW.status=CASE WHEN NEW.classification='TRACEABLE_SEGMENTS' THEN 'SHADOWED' ELSE 'HELD' END
)
BEGIN
  SELECT RAISE(ABORT,'active-stay bootstrap candidate is not bound to its manifest');
END;

CREATE TRIGGER active_stay_bootstrap_candidate_update_guard
BEFORE UPDATE ON active_stay_bootstrap_candidates
WHEN NEW.candidate_id<>OLD.candidate_id OR NEW.run_id<>OLD.run_id OR NEW.hotel_id<>OLD.hotel_id
  OR NEW.booking_id<>OLD.booking_id OR NEW.classification<>OLD.classification
  OR NEW.baseline_source_json<>OLD.baseline_source_json OR NEW.candidate_json<>OLD.candidate_json
  OR NEW.source_digest<>OLD.source_digest OR NEW.currency_basis<>OLD.currency_basis
  OR NEW.created_at<>OLD.created_at
  OR (NEW.status<>OLD.status AND NOT (
    (OLD.status='SHADOWED' AND NEW.status='ACTIVATING')
    OR (OLD.status='ACTIVATING' AND NEW.status='ACTIVATED')
  ))
BEGIN
  SELECT RAISE(ABORT,'active-stay bootstrap candidate is immutable');
END;

CREATE TRIGGER active_stay_bootstrap_candidate_activation_guard
BEFORE UPDATE OF status ON active_stay_bootstrap_candidates
WHEN NEW.status='ACTIVATING' AND OLD.status='SHADOWED'
BEGIN
  SELECT RAISE(ABORT,'active-stay bootstrap activation is not current')
  WHERE NOT EXISTS (SELECT 1 FROM active_stay_bootstrap_runs r
    JOIN active_stay_bootstrap_heads h ON h.hotel_id=r.hotel_id AND h.model_version=r.model_version
    WHERE r.run_id=NEW.run_id AND r.status='ACTIVATING' AND r.source_digest=NEW.source_digest
      AND h.run_id=r.run_id AND h.source_digest=r.source_digest);
END;

CREATE TRIGGER active_stay_bootstrap_candidate_complete_guard
BEFORE UPDATE OF status ON active_stay_bootstrap_candidates
WHEN NEW.status='ACTIVATED' AND OLD.status='ACTIVATING'
BEGIN
  SELECT RAISE(ABORT,'active-stay bootstrap canonical segment set is incomplete')
  WHERE (SELECT COUNT(*) FROM active_stay_bootstrap_candidate_segments s WHERE s.candidate_id=NEW.candidate_id)
    <>json_array_length(json_extract(NEW.candidate_json,'$.segments'))
    OR EXISTS (SELECT 1 FROM active_stay_bootstrap_candidate_segments s
      WHERE s.candidate_id=NEW.candidate_id AND NOT EXISTS (
        SELECT 1 FROM booking_pricing_segments p WHERE p.booking_id=NEW.booking_id
          AND p.room_id=s.room_id AND p.effective_start=s.effective_start AND p.effective_end=s.effective_end
          AND p.rate_cents=s.rate_cents AND p.room_pricing_version=s.source_rate_version
          AND p.operation_token=s.operation_token));
END;

CREATE TRIGGER active_stay_bootstrap_candidate_segment_no_update
BEFORE UPDATE ON active_stay_bootstrap_candidate_segments
BEGIN
  SELECT RAISE(ABORT,'active-stay bootstrap shadow segment is immutable');
END;

CREATE TRIGGER active_stay_bootstrap_candidate_segment_insert_guard
BEFORE INSERT ON active_stay_bootstrap_candidate_segments
WHEN NOT EXISTS (
  SELECT 1 FROM active_stay_bootstrap_candidates c
  WHERE c.candidate_id=NEW.candidate_id AND c.status='SHADOWED'
    AND c.classification='TRACEABLE_SEGMENTS'
    AND json_extract(c.candidate_json,'$.segments['||(NEW.segment_order-1)||'].sourceRef')=NEW.source_ref
    AND json_extract(c.candidate_json,'$.segments['||(NEW.segment_order-1)||'].roomId')=NEW.room_id
    AND json_extract(c.candidate_json,'$.segments['||(NEW.segment_order-1)||'].effectiveStart')=NEW.effective_start
    AND json_extract(c.candidate_json,'$.segments['||(NEW.segment_order-1)||'].effectiveEnd')=NEW.effective_end
    AND json_extract(c.candidate_json,'$.segments['||(NEW.segment_order-1)||'].rateCents')=NEW.rate_cents
    AND json_extract(c.candidate_json,'$.segments['||(NEW.segment_order-1)||'].sourceRateVersion')=NEW.source_rate_version
    AND NEW.operation_token=c.run_id||':'||c.booking_id||':'||NEW.segment_order
)
BEGIN
  SELECT RAISE(ABORT,'active-stay bootstrap shadow segment is not candidate-backed');
END;

CREATE TRIGGER active_stay_bootstrap_candidate_segment_no_delete
BEFORE DELETE ON active_stay_bootstrap_candidate_segments
BEGIN
  SELECT RAISE(ABORT,'active-stay bootstrap shadow segment is immutable');
END;

CREATE TRIGGER active_stay_bootstrap_snapshot_no_update
BEFORE UPDATE ON active_stay_bootstrap_snapshot_rooms
BEGIN SELECT RAISE(ABORT,'active-stay bootstrap snapshot is immutable'); END;
CREATE TRIGGER active_stay_bootstrap_snapshot_no_update_inventory
BEFORE UPDATE ON active_stay_bootstrap_snapshot_inventory
BEGIN SELECT RAISE(ABORT,'active-stay bootstrap snapshot is immutable'); END;
CREATE TRIGGER active_stay_bootstrap_snapshot_no_update_charges
BEFORE UPDATE ON active_stay_bootstrap_snapshot_charges
BEGIN SELECT RAISE(ABORT,'active-stay bootstrap snapshot is immutable'); END;
CREATE TRIGGER active_stay_bootstrap_snapshot_no_update_payments
BEFORE UPDATE ON active_stay_bootstrap_snapshot_payments
BEGIN SELECT RAISE(ABORT,'active-stay bootstrap snapshot is immutable'); END;

CREATE TRIGGER active_stay_bootstrap_snapshot_no_delete
BEFORE DELETE ON active_stay_bootstrap_snapshot_rooms
BEGIN SELECT RAISE(ABORT,'active-stay bootstrap snapshot is immutable'); END;
CREATE TRIGGER active_stay_bootstrap_snapshot_no_delete_inventory
BEFORE DELETE ON active_stay_bootstrap_snapshot_inventory
BEGIN SELECT RAISE(ABORT,'active-stay bootstrap snapshot is immutable'); END;
CREATE TRIGGER active_stay_bootstrap_snapshot_no_delete_charges
BEFORE DELETE ON active_stay_bootstrap_snapshot_charges
BEGIN SELECT RAISE(ABORT,'active-stay bootstrap snapshot is immutable'); END;
CREATE TRIGGER active_stay_bootstrap_snapshot_no_delete_payments
BEFORE DELETE ON active_stay_bootstrap_snapshot_payments
BEGIN SELECT RAISE(ABORT,'active-stay bootstrap snapshot is immutable'); END;

-- Rebuild only this forward-owned guard. The normal F0.5 path is byte-for-byte
-- semantically preserved; the second path requires an active exact candidate.
DROP TRIGGER booking_pricing_segment_insert_guard;
CREATE TRIGGER booking_pricing_segment_insert_guard
BEFORE INSERT ON booking_pricing_segments
WHEN NOT EXISTS (
  SELECT 1 FROM bookings b JOIN rooms r ON r.id=NEW.room_id
  WHERE b.id=NEW.booking_id AND b.room_id=NEW.room_id
    AND b.check_in<=NEW.effective_start AND NEW.effective_end<=b.check_out
    AND r.pricing_version=NEW.room_pricing_version
    AND b.last_pricing_operation_token=NEW.operation_token
    AND NOT EXISTS (SELECT 1 FROM active_stay_bootstrap_candidate_segments s WHERE s.operation_token=NEW.operation_token)
    AND NEW.segment_version=b.pricing_version+1
)
AND NOT EXISTS (
  SELECT 1
  FROM active_stay_bootstrap_candidate_segments s
  JOIN active_stay_bootstrap_candidates c ON c.candidate_id=s.candidate_id
  JOIN active_stay_bootstrap_runs r ON r.run_id=c.run_id
  JOIN active_stay_bootstrap_heads h ON h.hotel_id=r.hotel_id AND h.model_version=r.model_version
  JOIN bookings b ON b.id=c.booking_id
  WHERE c.booking_id=NEW.booking_id AND c.classification='TRACEABLE_SEGMENTS'
    AND c.status='ACTIVATING' AND r.status='ACTIVATING'
    AND r.activation_token=r.run_id
    AND h.run_id=r.run_id AND h.source_digest=r.source_digest
    AND s.room_id=NEW.room_id AND s.effective_start=NEW.effective_start AND s.effective_end=NEW.effective_end
    AND s.rate_cents=NEW.rate_cents AND s.source_rate_version=NEW.room_pricing_version
    AND s.operation_token=NEW.operation_token
    AND NEW.segment_version=b.pricing_version+1
    AND b.last_pricing_operation_token=NEW.operation_token
)
BEGIN
  SELECT RAISE(ABORT,'pricing segment source/version guard failed');
END;

-- Snapshot validation runs inside the same D1 batch transaction that activates
-- candidates. Exact set equality avoids count-only/equal-count substitution.
CREATE TRIGGER active_stay_bootstrap_activation_snapshot_guard
BEFORE UPDATE OF status ON active_stay_bootstrap_runs
WHEN OLD.status='SHADOWED' AND NEW.status='ACTIVATING'
BEGIN
  SELECT RAISE(ABORT,'active-stay bootstrap source digest is no longer current')
  WHERE NOT EXISTS (
    SELECT 1 FROM active_stay_bootstrap_heads h
    WHERE h.hotel_id=NEW.hotel_id AND h.model_version=NEW.model_version
      AND h.run_id=NEW.run_id AND h.source_digest=NEW.source_digest
  );
  SELECT RAISE(ABORT,'active-stay booking snapshot is stale or conflicting')
  WHERE EXISTS (
    SELECT 1 FROM active_stay_bootstrap_candidates c
    JOIN bookings b ON b.id=c.booking_id
    WHERE c.run_id=NEW.run_id AND c.classification='TRACEABLE_SEGMENTS'
      AND (
        b.id<>json_extract(c.baseline_source_json,'$.booking.id')
        OR b.status<>json_extract(c.baseline_source_json,'$.booking.status')
        OR b.room_id<>json_extract(c.baseline_source_json,'$.booking.roomId')
        OR b.check_in<>json_extract(c.baseline_source_json,'$.booking.checkIn')
        OR b.check_out<>json_extract(c.baseline_source_json,'$.booking.checkOut')
        OR b.total_cents<>json_extract(c.baseline_source_json,'$.booking.totalCents')
        OR b.pricing_version<>json_extract(c.baseline_source_json,'$.booking.pricingVersion')
        OR COALESCE(b.last_pricing_operation_token,'')<>COALESCE(json_extract(c.baseline_source_json,'$.booking.lastPricingOperationToken'),'')
        OR b.updated_at<>json_extract(c.baseline_source_json,'$.booking.updatedAt')
        OR (SELECT COUNT(*) FROM active_stay_bootstrap_candidate_segments s WHERE s.candidate_id=c.candidate_id)
          <>json_array_length(json_extract(c.candidate_json,'$.segments'))
        OR (SELECT COUNT(*) FROM active_stay_bootstrap_snapshot_rooms s WHERE s.candidate_id=c.candidate_id)
          <>json_array_length(json_extract(c.baseline_source_json,'$.rooms'))
        OR (SELECT COUNT(*) FROM active_stay_bootstrap_snapshot_inventory s WHERE s.candidate_id=c.candidate_id)
          <>json_array_length(json_extract(c.baseline_source_json,'$.inventory'))
        OR (SELECT COUNT(*) FROM active_stay_bootstrap_snapshot_charges s WHERE s.candidate_id=c.candidate_id)
          <>json_array_length(json_extract(c.baseline_source_json,'$.charges'))
        OR (SELECT COUNT(*) FROM active_stay_bootstrap_snapshot_payments s WHERE s.candidate_id=c.candidate_id)
          <>json_array_length(json_extract(c.baseline_source_json,'$.payments'))
        OR (SELECT COUNT(*) FROM invoices i WHERE i.booking_id=b.id)<>1
        OR NOT EXISTS (SELECT 1 FROM invoices i WHERE i.booking_id=b.id
          AND i.id=json_extract(c.baseline_source_json,'$.invoice.id')
          AND i.amount_cents=json_extract(c.baseline_source_json,'$.invoice.amountCents')
          AND i.paid_amount_cents=json_extract(c.baseline_source_json,'$.invoice.paidAmountCents')
          AND i.status=json_extract(c.baseline_source_json,'$.invoice.status')
          AND i.payment_method=json_extract(c.baseline_source_json,'$.invoice.paymentMethod')
          AND COALESCE(i.payment_reference,'')=COALESCE(json_extract(c.baseline_source_json,'$.invoice.paymentReference'),'')
          AND COALESCE(i.paid_at,'')=COALESCE(json_extract(c.baseline_source_json,'$.invoice.paidAt'),'')
          AND i.created_at=json_extract(c.baseline_source_json,'$.invoice.createdAt'))
        OR (SELECT COUNT(*) FROM extra_charges a WHERE a.booking_id=b.id)
          <>(SELECT COUNT(*) FROM active_stay_bootstrap_snapshot_charges s WHERE s.candidate_id=c.candidate_id)
        OR EXISTS (SELECT 1 FROM active_stay_bootstrap_snapshot_charges s
          WHERE s.candidate_id=c.candidate_id AND NOT EXISTS (SELECT 1 FROM extra_charges a WHERE a.booking_id=b.id
            AND a.id=s.charge_id AND a.amount_cents=s.amount_cents AND a.description=s.description
            AND a.category=s.category AND a.created_at=s.created_at))
        OR EXISTS (SELECT 1 FROM extra_charges a WHERE a.booking_id=b.id AND NOT EXISTS (
          SELECT 1 FROM active_stay_bootstrap_snapshot_charges s WHERE s.candidate_id=c.candidate_id
            AND s.charge_id=a.id AND s.amount_cents=a.amount_cents AND s.description=a.description
            AND s.category=a.category AND s.created_at=a.created_at))
        OR (SELECT COUNT(*) FROM payment_entries p WHERE p.invoice_id=(SELECT i.id FROM invoices i WHERE i.booking_id=b.id))
          <>(SELECT COUNT(*) FROM active_stay_bootstrap_snapshot_payments s WHERE s.candidate_id=c.candidate_id)
        OR EXISTS (SELECT 1 FROM active_stay_bootstrap_snapshot_payments s
          WHERE s.candidate_id=c.candidate_id AND NOT EXISTS (SELECT 1 FROM payment_entries p
            WHERE p.invoice_id=(SELECT i.id FROM invoices i WHERE i.booking_id=b.id)
              AND p.id=s.payment_id AND p.booking_id=s.booking_id AND p.amount_cents=s.amount_cents
              AND p.payment_method=s.payment_method AND COALESCE(p.payment_reference,'')=COALESCE(s.payment_reference,'')
              AND COALESCE(p.note,'')=COALESCE(s.note,'') AND p.received_by_user_id=s.received_by_user_id
              AND p.received_at=s.received_at AND COALESCE(p.operation_token,'')=COALESCE(s.operation_token,'')))
        OR EXISTS (SELECT 1 FROM payment_entries p WHERE p.invoice_id=(SELECT i.id FROM invoices i WHERE i.booking_id=b.id)
          AND NOT EXISTS (SELECT 1 FROM active_stay_bootstrap_snapshot_payments s WHERE s.candidate_id=c.candidate_id
            AND s.payment_id=p.id AND s.booking_id=p.booking_id AND s.amount_cents=p.amount_cents
            AND s.payment_method=p.payment_method AND COALESCE(s.payment_reference,'')=COALESCE(p.payment_reference,'')
            AND COALESCE(s.note,'')=COALESCE(p.note,'') AND s.received_by_user_id=p.received_by_user_id
            AND s.received_at=p.received_at AND COALESCE(s.operation_token,'')=COALESCE(p.operation_token,'')))
        OR (SELECT COUNT(*) FROM room_inventory_nights n JOIN active_stay_bootstrap_snapshot_rooms s
          ON s.candidate_id=c.candidate_id AND s.room_id=n.room_id
          WHERE n.stay_date>=b.check_in AND n.stay_date<b.check_out)
          <>(SELECT COUNT(*) FROM active_stay_bootstrap_snapshot_inventory s WHERE s.candidate_id=c.candidate_id)
        OR EXISTS (SELECT 1 FROM active_stay_bootstrap_snapshot_inventory s
          WHERE s.candidate_id=c.candidate_id AND NOT EXISTS (SELECT 1 FROM room_inventory_nights n
            WHERE n.booking_id=s.booking_id AND n.room_id=s.room_id AND n.stay_date=s.stay_date))
        OR EXISTS (SELECT 1 FROM room_inventory_nights n JOIN active_stay_bootstrap_snapshot_rooms sr
          ON sr.candidate_id=c.candidate_id AND sr.room_id=n.room_id
          WHERE n.stay_date>=b.check_in AND n.stay_date<b.check_out AND NOT EXISTS (
            SELECT 1 FROM active_stay_bootstrap_snapshot_inventory s WHERE s.candidate_id=c.candidate_id
              AND s.booking_id=n.booking_id AND s.room_id=n.room_id AND s.stay_date=n.stay_date))
        OR (SELECT COUNT(*) FROM active_stay_bootstrap_snapshot_rooms s WHERE s.candidate_id=c.candidate_id)
          <>(SELECT COUNT(*) FROM rooms r JOIN active_stay_bootstrap_snapshot_rooms s
            ON s.candidate_id=c.candidate_id AND s.room_id=r.id)
        OR EXISTS (SELECT 1 FROM active_stay_bootstrap_snapshot_rooms s
          WHERE s.candidate_id=c.candidate_id AND NOT EXISTS (SELECT 1 FROM rooms r WHERE r.id=s.room_id
            AND r.price_cents=s.price_cents AND r.pricing_version=s.pricing_version AND r.inventory_version=s.inventory_version
            AND r.room_state_version=s.room_state_version))
      )
  );
END;

CREATE TRIGGER active_stay_bootstrap_run_complete_guard
BEFORE UPDATE OF status ON active_stay_bootstrap_runs
WHEN NEW.status='COMPLETE' AND OLD.status IN ('SHADOWED','ACTIVATING')
BEGIN
  SELECT RAISE(ABORT,'active-stay bootstrap activation is incomplete')
  WHERE (SELECT COUNT(*) FROM active_stay_bootstrap_candidates c WHERE c.run_id=NEW.run_id)
      <>json_array_length(json_extract(NEW.manifest_json,'$.candidates'))
    OR EXISTS (SELECT 1 FROM active_stay_bootstrap_candidates c
      WHERE c.run_id=NEW.run_id AND c.classification='TRACEABLE_SEGMENTS' AND c.status<>'ACTIVATED');
END;
