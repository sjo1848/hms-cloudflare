-- F0.6 critic repair: canonical F0.5 pricing segments are quote inputs and
-- must be included in the exact source snapshot before synthetic activation.
-- Forward-only guard; migration 0026 and all earlier migration history remain immutable.
CREATE TRIGGER active_stay_bootstrap_pricing_segment_snapshot_guard
BEFORE UPDATE OF status ON active_stay_bootstrap_runs
WHEN OLD.status='SHADOWED' AND NEW.status='ACTIVATING'
BEGIN
  SELECT RAISE(ABORT,'active-stay bootstrap canonical pricing segment snapshot is stale')
  WHERE EXISTS (
    SELECT 1 FROM active_stay_bootstrap_candidates c
    WHERE c.run_id=NEW.run_id AND c.classification='TRACEABLE_SEGMENTS'
      AND (
        COALESCE(json_type(c.baseline_source_json,'$.pricingSegments'),'')<>'array'
        OR (SELECT COUNT(*) FROM booking_pricing_segments s WHERE s.booking_id=c.booking_id)
          <>json_array_length(json_extract(c.baseline_source_json,'$.pricingSegments'))
        OR EXISTS (
          SELECT 1 FROM booking_pricing_segments s
          WHERE s.booking_id=c.booking_id AND NOT EXISTS (
            SELECT 1 FROM json_each(c.baseline_source_json,'$.pricingSegments') j
            WHERE json_extract(j.value,'$.segmentId')=s.segment_id
              AND json_extract(j.value,'$.bookingId')=s.booking_id
              AND json_extract(j.value,'$.roomId')=s.room_id
              AND json_extract(j.value,'$.effectiveStart')=s.effective_start
              AND json_extract(j.value,'$.effectiveEnd')=s.effective_end
              AND json_extract(j.value,'$.rateCents')=s.rate_cents
              AND json_extract(j.value,'$.roomPricingVersion')=s.room_pricing_version
              AND json_extract(j.value,'$.segmentVersion')=s.segment_version
              AND json_extract(j.value,'$.operationToken')=s.operation_token
              AND json_extract(j.value,'$.actorSubject')=s.actor_subject
              AND json_extract(j.value,'$.hotelId')=s.hotel_id
              AND json_extract(j.value,'$.requestId')=s.request_id
              AND json_extract(j.value,'$.createdAt')=s.created_at
          )
        )
        OR EXISTS (
          SELECT 1 FROM json_each(c.baseline_source_json,'$.pricingSegments') j
          WHERE NOT EXISTS (
            SELECT 1 FROM booking_pricing_segments s
            WHERE s.booking_id=c.booking_id
              AND s.segment_id=json_extract(j.value,'$.segmentId')
              AND s.booking_id=json_extract(j.value,'$.bookingId')
              AND s.room_id=json_extract(j.value,'$.roomId')
              AND s.effective_start=json_extract(j.value,'$.effectiveStart')
              AND s.effective_end=json_extract(j.value,'$.effectiveEnd')
              AND s.rate_cents=json_extract(j.value,'$.rateCents')
              AND s.room_pricing_version=json_extract(j.value,'$.roomPricingVersion')
              AND s.segment_version=json_extract(j.value,'$.segmentVersion')
              AND s.operation_token=json_extract(j.value,'$.operationToken')
              AND s.actor_subject=json_extract(j.value,'$.actorSubject')
              AND s.hotel_id=json_extract(j.value,'$.hotelId')
              AND s.request_id=json_extract(j.value,'$.requestId')
              AND s.created_at=json_extract(j.value,'$.createdAt')
          )
        )
      )
  );
END;
