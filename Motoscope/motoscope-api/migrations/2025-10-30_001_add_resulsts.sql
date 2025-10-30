BEGIN;

CREATE TABLE IF NOT EXISTS results (
  id SERIAL PRIMARY KEY,
  event_id INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  rider_id INT NOT NULL,
  position INT NOT NULL CHECK (position >= 1),
  points INT NOT NULL DEFAULT 0 CHECK (points >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS results_event_idx ON results(event_id);

COMMIT;
