-- Seed ArrivalWindows for demo booking (slot ids must match `Booking.tsx` and `reserveEntrySlot`).
-- Run against database entry-routing-db after schema deploy. Adjust timestamps for your event.

INSERT INTO ArrivalWindows (slot_id, gate_id, window_start, window_end, max_capacity, capacity_reserved, last_modified)
VALUES
  ('1', 'GATE_B', TIMESTAMP '2026-04-20T14:00:00Z', TIMESTAMP '2026-04-20T14:15:00Z', 500, 0, PENDING_COMMIT_TIMESTAMP()),
  ('2', 'GATE_B', TIMESTAMP '2026-04-20T14:15:00Z', TIMESTAMP '2026-04-20T14:30:00Z', 500, 0, PENDING_COMMIT_TIMESTAMP()),
  ('3', 'GATE_B', TIMESTAMP '2026-04-20T14:30:00Z', TIMESTAMP '2026-04-20T14:45:00Z', 500, 499, PENDING_COMMIT_TIMESTAMP()),
  ('4', 'GATE_B', TIMESTAMP '2026-04-20T14:45:00Z', TIMESTAMP '2026-04-20T15:00:00Z', 500, 0, PENDING_COMMIT_TIMESTAMP());
