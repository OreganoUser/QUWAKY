BEGIN;
INSERT INTO seasons (id, year, created_at)
VALUES (1, 2025, now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO seasons (id, year, created_at)
VALUES (2, 2024, now())
ON CONFLICT (id) DO NOTHING;
COMMIT;