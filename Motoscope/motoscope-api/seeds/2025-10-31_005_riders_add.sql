BEGIN;

INSERT INTO riders (slug, first_name, last_name, birth_date, height_cm, weight_kg, country)
VALUES ('jorge-martin','Jorge','Martin','1998-01-29',168,63,'Spain')
ON CONFLICT (slug) DO UPDATE
SET first_name = EXCLUDED.first_name,
    last_name  = EXCLUDED.last_name,
    birth_date = EXCLUDED.birth_date,
    height_cm  = EXCLUDED.height_cm,
    weight_kg  = EXCLUDED.weight_kg,
    country    = EXCLUDED.country;

INSERT INTO riders (slug, first_name, last_name, birth_date, height_cm, weight_kg, country)
VALUES ('marc-marquez','Marc','Marquez','1993-02-17',169,64,'Spain')
ON CONFLICT (slug) DO UPDATE
SET first_name = EXCLUDED.first_name,
    last_name  = EXCLUDED.last_name,
    birth_date = EXCLUDED.birth_date,
    height_cm  = EXCLUDED.height_cm,
    weight_kg  = EXCLUDED.weight_kg,
    country    = EXCLUDED.country;

INSERT INTO riders (slug, first_name, last_name, birth_date, height_cm, weight_kg, country)
VALUES ('brad-binder','Brad','Binder','1995-08-11',170,63,'South Africa')
ON CONFLICT (slug) DO UPDATE
SET first_name = EXCLUDED.first_name,
    last_name  = EXCLUDED.last_name,
    birth_date = EXCLUDED.birth_date,
    height_cm  = EXCLUDED.height_cm,
    weight_kg  = EXCLUDED.weight_kg,
    country    = EXCLUDED.country;

INSERT INTO riders (slug, first_name, last_name, birth_date, height_cm, weight_kg, country)
VALUES ('jack-miller','Jack','Miller','1995-01-18',173,64,'Australia')
ON CONFLICT (slug) DO UPDATE
SET first_name = EXCLUDED.first_name,
    last_name  = EXCLUDED.last_name,
    birth_date = EXCLUDED.birth_date,
    height_cm  = EXCLUDED.height_cm,
    weight_kg  = EXCLUDED.weight_kg,
    country    = EXCLUDED.country;

INSERT INTO riders (slug, first_name, last_name, birth_date, height_cm, weight_kg, country)
VALUES ('maverick-vinales','Maverick','Vinales','1995-01-12',171,64,'Spain')
ON CONFLICT (slug) DO UPDATE
SET first_name = EXCLUDED.first_name,
    last_name  = EXCLUDED.last_name,
    birth_date = EXCLUDED.birth_date,
    height_cm  = EXCLUDED.height_cm,
    weight_kg  = EXCLUDED.weight_kg,
    country    = EXCLUDED.country;

INSERT INTO riders (slug, first_name, last_name, birth_date, height_cm, weight_kg, country)
VALUES ('fabio-quartararo','Fabio','Quartararo','1999-04-20',177,69,'France')
ON CONFLICT (slug) DO UPDATE
SET first_name = EXCLUDED.first_name,
    last_name  = EXCLUDED.last_name,
    birth_date = EXCLUDED.birth_date,
    height_cm  = EXCLUDED.height_cm,
    weight_kg  = EXCLUDED.weight_kg,
    country    = EXCLUDED.country;

INSERT INTO riders (slug, first_name, last_name, birth_date, height_cm, weight_kg, country)
VALUES ('franco-morbidelli','Franco','Morbidelli','1994-12-04',176,68,'Italy')
ON CONFLICT (slug) DO UPDATE
SET first_name = EXCLUDED.first_name,
    last_name  = EXCLUDED.last_name,
    birth_date = EXCLUDED.birth_date,
    height_cm  = EXCLUDED.height_cm,
    weight_kg  = EXCLUDED.weight_kg,
    country    = EXCLUDED.country;

INSERT INTO riders (slug, first_name, last_name, birth_date, height_cm, weight_kg, country)
VALUES ('enea-bastianini','Enea','Bastianini','1997-12-30',168,64,'Italy')
ON CONFLICT (slug) DO UPDATE
SET first_name = EXCLUDED.first_name,
    last_name  = EXCLUDED.last_name,
    birth_date = EXCLUDED.birth_date,
    height_cm  = EXCLUDED.height_cm,
    weight_kg  = EXCLUDED.weight_kg,
    country    = EXCLUDED.country;

INSERT INTO riders (slug, first_name, last_name, birth_date, height_cm, weight_kg, country)
VALUES ('raul-fernandez','Raul','Fernandez','2000-10-23',178,65,'Spain')
ON CONFLICT (slug) DO UPDATE
SET first_name = EXCLUDED.first_name,
    last_name  = EXCLUDED.last_name,
    birth_date = EXCLUDED.birth_date,
    height_cm  = EXCLUDED.height_cm,
    weight_kg  = EXCLUDED.weight_kg,
    country    = EXCLUDED.country;

INSERT INTO riders (slug, first_name, last_name, birth_date, height_cm, weight_kg, country)
VALUES ('somkiat-chantra','Somkiat','Chantra','1998-12-15',172,63,'Thailand')
ON CONFLICT (slug) DO UPDATE
SET first_name = EXCLUDED.first_name,
    last_name  = EXCLUDED.last_name,
    birth_date = EXCLUDED.birth_date,
    height_cm  = EXCLUDED.height_cm,
    weight_kg  = EXCLUDED.weight_kg,
    country    = EXCLUDED.country;

INSERT INTO riders (slug, first_name, last_name, birth_date, height_cm, weight_kg, country)
VALUES ('joan-mir','Joan','Mir','1997-09-01',181,69,'Spain')
ON CONFLICT (slug) DO UPDATE
SET first_name = EXCLUDED.first_name,
    last_name  = EXCLUDED.last_name,
    birth_date = EXCLUDED.birth_date,
    height_cm  = EXCLUDED.height_cm,
    weight_kg  = EXCLUDED.weight_kg,
    country    = EXCLUDED.country;

INSERT INTO riders (slug, first_name, last_name, birth_date, height_cm, weight_kg, country)
VALUES ('pedro-acosta','Pedro','Acosta','2004-05-25',171,63,'Spain')
ON CONFLICT (slug) DO UPDATE
SET first_name = EXCLUDED.first_name,
    last_name  = EXCLUDED.last_name,
    birth_date = EXCLUDED.birth_date,
    height_cm  = EXCLUDED.height_cm,
    weight_kg  = EXCLUDED.weight_kg,
    country    = EXCLUDED.country;

INSERT INTO riders (slug, first_name, last_name, birth_date, height_cm, weight_kg, country)
VALUES ('alex-rins','Alex','Rins','1995-12-08',176,68,'Spain')
ON CONFLICT (slug) DO UPDATE
SET first_name = EXCLUDED.first_name,
    last_name  = EXCLUDED.last_name,
    birth_date = EXCLUDED.birth_date,
    height_cm  = EXCLUDED.height_cm,
    weight_kg  = EXCLUDED.weight_kg,
    country    = EXCLUDED.country;

INSERT INTO riders (slug, first_name, last_name, birth_date, height_cm, weight_kg, country)
VALUES ('fabio-di-giannantonio','Fabio','Di Giannantonio','1998-10-10',177,62,'Italy')
ON CONFLICT (slug) DO UPDATE
SET first_name = EXCLUDED.first_name,
    last_name  = EXCLUDED.last_name,
    birth_date = EXCLUDED.birth_date,
    height_cm  = EXCLUDED.height_cm,
    weight_kg  = EXCLUDED.weight_kg,
    country    = EXCLUDED.country;

INSERT INTO riders (slug, first_name, last_name, birth_date, height_cm, weight_kg, country)
VALUES ('fermin-aldeguer','Fermin','Aldeguer','2005-04-05',181,69,'Spain')
ON CONFLICT (slug) DO UPDATE
SET first_name = EXCLUDED.first_name,
    last_name  = EXCLUDED.last_name,
    birth_date = EXCLUDED.birth_date,
    height_cm  = EXCLUDED.height_cm,
    weight_kg  = EXCLUDED.weight_kg,
    country    = EXCLUDED.country;

INSERT INTO riders (slug, first_name, last_name, birth_date, height_cm, weight_kg, country)
VALUES ('marco-bezzecchi','Marco','Bezzecchi','1998-11-12',176,64,'Italy')
ON CONFLICT (slug) DO UPDATE
SET first_name = EXCLUDED.first_name,
    last_name  = EXCLUDED.last_name,
    birth_date = EXCLUDED.birth_date,
    height_cm  = EXCLUDED.height_cm,
    weight_kg  = EXCLUDED.weight_kg,
    country    = EXCLUDED.country;

INSERT INTO riders (slug, first_name, last_name, birth_date, height_cm, weight_kg, country)
VALUES ('alex-marquez','Alex','Marquez','1996-04-23',180,65,'Spain')
ON CONFLICT (slug) DO UPDATE
SET first_name = EXCLUDED.first_name,
    last_name  = EXCLUDED.last_name,
    birth_date = EXCLUDED.birth_date,
    height_cm  = EXCLUDED.height_cm,
    weight_kg  = EXCLUDED.weight_kg,
    country    = EXCLUDED.country;

INSERT INTO riders (slug, first_name, last_name, birth_date, height_cm, weight_kg, country)
VALUES ('luca-marini','Luca','Marini','1997-08-10',184,69,'Italy')
ON CONFLICT (slug) DO UPDATE
SET first_name = EXCLUDED.first_name,
    last_name  = EXCLUDED.last_name,
    birth_date = EXCLUDED.birth_date,
    height_cm  = EXCLUDED.height_cm,
    weight_kg  = EXCLUDED.weight_kg,
    country    = EXCLUDED.country;

INSERT INTO riders (slug, first_name, last_name, birth_date, height_cm, weight_kg, country)
VALUES ('ai-ogura','Ai','Ogura','2001-01-26',169,60,'Japan')
ON CONFLICT (slug) DO UPDATE
SET first_name = EXCLUDED.first_name,
    last_name  = EXCLUDED.last_name,
    birth_date = EXCLUDED.birth_date,
    height_cm  = EXCLUDED.height_cm,
    weight_kg  = EXCLUDED.weight_kg,
    country    = EXCLUDED.country;

INSERT INTO riders (slug, first_name, last_name, birth_date, height_cm, weight_kg, country)
VALUES ('miguel-oliveira','Miguel','Oliveira','1995-01-04',170,64,'Portugal')
ON CONFLICT (slug) DO UPDATE
SET first_name = EXCLUDED.first_name,
    last_name  = EXCLUDED.last_name,
    birth_date = EXCLUDED.birth_date,
    height_cm  = EXCLUDED.height_cm,
    weight_kg  = EXCLUDED.weight_kg,
    country    = EXCLUDED.country;


COMMIT;