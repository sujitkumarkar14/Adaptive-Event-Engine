-- Adaptive Entry 360 — Cloud Spanner DDL for high-concurrency arrival windows.
-- Instance: adaptive-entry-instance | Database: entry-routing-db
-- Aligns with Cloud Functions `reserveEntrySlot` (runTransactionAsync on ArrivalWindows).

CREATE TABLE ArrivalWindows (
  slot_id STRING(64) NOT NULL,
  gate_id STRING(64) NOT NULL,
  window_start TIMESTAMP NOT NULL,
  window_end TIMESTAMP NOT NULL,
  max_capacity INT64 NOT NULL,
  capacity_reserved INT64 NOT NULL,
  last_modified TIMESTAMP NOT NULL OPTIONS (allow_commit_timestamp = true),
) PRIMARY KEY (slot_id);

CREATE INDEX ArrivalWindowsByGate
ON ArrivalWindows (gate_id, window_start DESC);

-- Application invariant: capacity_reserved <= max_capacity (transaction in `reserveEntrySlot`).
