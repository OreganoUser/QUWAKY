BEGIN;

INSERT INTO riders (slug, first_name, last_name, birth_date, height_cm, weight_kg, country)
VALUES ('francesco-bagnaia','Francesco','Bagnaia','1997-01-14',176,67,'Italy')
ON CONFLICT (slug) DO UPDATE
SET first_name = EXCLUDED.first_name,
    last_name  = EXCLUDED.last_name,
    birth_date = EXCLUDED.birth_date,
    height_cm  = EXCLUDED.height_cm,
    weight_kg  = EXCLUDED.weight_kg,
    country    = EXCLUDED.country;


COMMIT;