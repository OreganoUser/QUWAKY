BEGIN;

INSERT INTO circuits (slug, name, country, length_km, laps)
VALUES ('losail','Lusail International Circuit','Qatar',5.380,22)
ON CONFLICT DO NOTHING
SET name=EXCLUDED.name,
    country=EXCLUDED.country,
    length_km=EXCLUDED.length_km,
    laps=EXCLUDED.laps;

COMMIT;