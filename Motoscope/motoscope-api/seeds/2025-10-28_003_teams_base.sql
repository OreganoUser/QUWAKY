BEGIN;

INSERT INTO teams (slug, name, manufacturer, country)
VALUES ('ducati-lenovo','Ducati Lenovo Team','Ducati','Italy')
ON CONFLICT (slug) DO UPDATE
SET name         = EXCLUDED.name,
    manufacturer = EXCLUDED.manufacturer,
    country      = EXCLUDED.country;

COMMIT;