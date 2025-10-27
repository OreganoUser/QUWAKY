BEGIN;

-- === Seasons (unique on year) ===============================================
INSERT INTO seasons (year) VALUES (2024)
ON CONFLICT (year) DO NOTHING;

INSERT INTO seasons (year) VALUES (2025)
ON CONFLICT (year) DO NOTHING;

-- === Circuit (unique on slug) ================================================
INSERT INTO circuits (slug, name, country, length_km, laps)
VALUES ('losail','Lusail International Circuit','Qatar',5.380,22)
ON CONFLICT (slug) DO UPDATE
SET name=EXCLUDED.name,
    country=EXCLUDED.country,
    length_km=EXCLUDED.length_km,
    laps=EXCLUDED.laps;

-- === Event (unique on season_id, round) ======================================
INSERT INTO events (season_id, round, gp_name, circuit_id, start_date, end_date)
VALUES (
  (SELECT id FROM seasons WHERE year=2025),
  1,
  'Qatar Grand Prix',
  (SELECT id FROM circuits WHERE slug='losail'),
  '2025-03-07','2025-03-09'
)
ON CONFLICT (season_id, round) DO UPDATE
SET gp_name   = EXCLUDED.gp_name,
    circuit_id= EXCLUDED.circuit_id,
    start_date= EXCLUDED.start_date,
    end_date  = EXCLUDED.end_date;

-- === Sessions (wipe & insert for this event) =================================
-- remove any previously seeded sessions for this GP to avoid dupes
DELETE FROM sessions
USING events e
WHERE sessions.event_id = e.id
  AND e.gp_name = 'Qatar Grand Prix';

INSERT INTO sessions (event_id, class, type, name, start_time, end_time)
SELECT e.id, 'motogp'::race_class, 'PRACTICE'::session_type, 'Practice 1',
       TIMESTAMPTZ '2025-03-07 14:00+03', TIMESTAMPTZ '2025-03-07 15:00+03'
FROM events e WHERE e.gp_name='Qatar Grand Prix'
UNION ALL
SELECT e.id, 'motogp'::race_class, 'QUALIFYING'::session_type, 'Qualifying',
       TIMESTAMPTZ '2025-03-08 14:00+03', TIMESTAMPTZ '2025-03-08 14:45+03'
FROM events e WHERE e.gp_name='Qatar Grand Prix'
UNION ALL
SELECT e.id, 'motogp'::race_class, 'SPRINT'::session_type, 'Sprint',
       TIMESTAMPTZ '2025-03-08 18:00+03', TIMESTAMPTZ '2025-03-08 18:20+03'
FROM events e WHERE e.gp_name='Qatar Grand Prix'
UNION ALL
SELECT e.id, 'motogp'::race_class, 'RACE'::session_type, 'Race',
       TIMESTAMPTZ '2025-03-09 18:00+03', TIMESTAMPTZ '2025-03-09 19:00+03'
FROM events e WHERE e.gp_name='Qatar Grand Prix';

-- === Team (unique on slug) ===================================================
INSERT INTO teams (slug, name, manufacturer, country)
VALUES ('ducati-lenovo','Ducati Lenovo Team','Ducati','Italy')
ON CONFLICT (slug) DO UPDATE
SET name         = EXCLUDED.name,
    manufacturer = EXCLUDED.manufacturer,
    country      = EXCLUDED.country;

-- === Staff (no natural unique; prevent duplicates with WHERE NOT EXISTS) =====
INSERT INTO staff (team_id, role, first_name, last_name, birth_date)
SELECT t.id, 'TEAM_MANAGER', 'Davide', 'Tardozzi', NULL
FROM teams t
WHERE t.slug='ducati-lenovo'
  AND NOT EXISTS (
    SELECT 1 FROM staff s
    WHERE s.team_id=t.id
      AND s.role='TEAM_MANAGER'
      AND s.first_name='Davide'
      AND s.last_name='Tardozzi'
  );

-- === Rider (unique on slug) ==================================================
INSERT INTO riders (slug, first_name, last_name, birth_date, height_cm, weight_kg, country)
VALUES ('francesco-bagnaia','Francesco','Bagnaia','1997-01-14',176,67,'Italy')
ON CONFLICT (slug) DO UPDATE
SET first_name = EXCLUDED.first_name,
    last_name  = EXCLUDED.last_name,
    birth_date = EXCLUDED.birth_date,
    height_cm  = EXCLUDED.height_cm,
    weight_kg  = EXCLUDED.weight_kg,
    country    = EXCLUDED.country;

-- === Team entry (unique season_id, class, team_id) ===========================
INSERT INTO team_entries (season_id, class, team_id)
VALUES (
  (SELECT id FROM seasons WHERE year=2025),
  'motogp'::race_class,
  (SELECT id FROM teams WHERE slug='ducati-lenovo')
)
ON CONFLICT (season_id, class, team_id) DO NOTHING;

-- === Rider contract (unique season_id, class, team_id, rider_id) ============
INSERT INTO rider_contracts (season_id, class, team_id, rider_id, number)
VALUES (
  (SELECT id FROM seasons WHERE year=2025),
  'motogp'::race_class,
  (SELECT id FROM teams  WHERE slug='ducati-lenovo'),
  (SELECT id FROM riders WHERE slug='francesco-bagnaia'),
  1
)
ON CONFLICT (season_id, class, team_id, rider_id) DO UPDATE
SET number = EXCLUDED.number;

-- === Career stats (PK rider_id) =============================================
INSERT INTO rider_career_stats (rider_id, seasons, races, wins, sprint_wins, poles, podiums)
VALUES (
  (SELECT id FROM riders WHERE slug='francesco-bagnaia'),
  6, 100, 25, 8, 15, 50
)
ON CONFLICT (rider_id) DO UPDATE
SET seasons     = EXCLUDED.seasons,
    races       = EXCLUDED.races,
    wins        = EXCLUDED.wins,
    sprint_wins = EXCLUDED.sprint_wins,
    poles       = EXCLUDED.poles,
    podiums     = EXCLUDED.podiums;

COMMIT;
