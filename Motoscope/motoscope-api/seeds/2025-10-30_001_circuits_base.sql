BEGIN;
-- ensure unique once if schema.sql didn’t add it (safe guard)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='circuits_slug_key') THEN
    ALTER TABLE circuits ADD CONSTRAINT circuits_slug_key UNIQUE (slug);
  END IF;
END $$;
INSERT INTO circuits (slug, name, country, length_km, laps)
VALUES ('jerez','Circuito de Jerez – Ángel Nieto','Qatar', 4.428,29)
ON CONFLICT (slug) DO UPDATE
SET name=EXCLUDED.name,
    country=EXCLUDED.country,
    length_km=EXCLUDED.length_km,
    laps=EXCLUDED.laps;
COMMIT;
