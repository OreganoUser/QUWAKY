BEGIN;
INSERT INTO seasons (id, year, created_at)
VALUES (1, 2023, now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO seasons (id, year, created_at)
VALUES (2, 2022, now())
ON CONFLICT (id) DO NOTHING;
COMMIT;