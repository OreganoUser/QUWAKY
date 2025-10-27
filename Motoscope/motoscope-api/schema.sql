-- ENUMs
CREATE TYPE race_class AS ENUM ('motogp','moto2','moto3');
CREATE TYPE session_type AS ENUM ('PRACTICE','QUALIFYING','SPRINT','RACE','WARMUP','TEST');
CREATE TYPE staff_role AS ENUM ('TEAM_MANAGER','ANALYST','TYRE_ENGINEER','MECHANIC','CREW_CHIEF','DATA_ENGINEER','OTHER');

-- Seasons
CREATE TABLE seasons (
  id          SERIAL PRIMARY KEY,
  year        INT UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Circuits
CREATE TABLE circuits (
  id          SERIAL PRIMARY KEY,
  slug        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  country     TEXT,
  length_km   NUMERIC(5,3),
  laps        INT,                 -- default race laps (MotoGP; class-specific laps can override per event if needed)
  description TEXT
);

-- Events (Grand Prix)
CREATE TABLE events (
  id           SERIAL PRIMARY KEY,
  season_id    INT NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  round        INT NOT NULL,
  gp_name      TEXT NOT NULL,
  circuit_id   INT NOT NULL REFERENCES circuits(id),
  start_date   DATE,
  end_date     DATE,
  UNIQUE (season_id, round)
);

-- Sessions (per class)
CREATE TABLE sessions (
  id           SERIAL PRIMARY KEY,
  event_id     INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  class        race_class NOT NULL,
  type         session_type NOT NULL,
  name         TEXT NOT NULL,      -- "Practice 1", "Qualifying", etc
  start_time   TIMESTAMPTZ,
  end_time     TIMESTAMPTZ
);

-- Teams (org level)
CREATE TABLE teams (
  id         SERIAL PRIMARY KEY,
  slug       TEXT UNIQUE NOT NULL,
  name       TEXT NOT NULL,
  manufacturer TEXT,               -- Ducati, KTM, etc.
  country    TEXT
);

-- Staff members
CREATE TABLE staff (
  id          SERIAL PRIMARY KEY,
  team_id     INT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  role        staff_role NOT NULL,
  first_name  TEXT NOT NULL,
  last_name   TEXT NOT NULL,
  birth_date  DATE,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Riders (person level)
CREATE TABLE riders (
  id           SERIAL PRIMARY KEY,
  slug         TEXT UNIQUE NOT NULL,
  first_name   TEXT NOT NULL,
  last_name    TEXT NOT NULL,
  birth_date   DATE,
  height_cm    INT,
  weight_kg    INT,
  country      TEXT
);

-- Team entries per season & class (teams competing that year)
CREATE TABLE team_entries (
  id          SERIAL PRIMARY KEY,
  season_id   INT NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  class       race_class NOT NULL,
  team_id     INT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  UNIQUE (season_id, class, team_id)
);

-- Rider contracts per season/class/team (which rider drove where)
CREATE TABLE rider_contracts (
  id            SERIAL PRIMARY KEY,
  season_id     INT NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  class         race_class NOT NULL,
  team_id       INT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  rider_id      INT NOT NULL REFERENCES riders(id) ON DELETE CASCADE,
  number        INT,          -- bike number
  start_event   INT REFERENCES events(id),   -- optional first round
  end_event     INT REFERENCES events(id),   -- optional last round
  UNIQUE (season_id, class, team_id, rider_id)
);

-- Career stats (aggregated, optional)
CREATE TABLE rider_career_stats (
  rider_id       INT PRIMARY KEY REFERENCES riders(id) ON DELETE CASCADE,
  seasons        INT DEFAULT 0,
  races          INT DEFAULT 0,
  wins           INT DEFAULT 0,
  sprint_wins    INT DEFAULT 0,
  poles          INT DEFAULT 0,
  podiums        INT DEFAULT 0
);

-- Per-season stats (optional granularity)
CREATE TABLE rider_season_stats (
  rider_id     INT REFERENCES riders(id) ON DELETE CASCADE,
  season_id    INT REFERENCES seasons(id) ON DELETE CASCADE,
  class        race_class NOT NULL,
  races        INT DEFAULT 0,
  wins         INT DEFAULT 0,
  sprint_wins  INT DEFAULT 0,
  poles        INT DEFAULT 0,
  podiums      INT DEFAULT 0,
  points       INT DEFAULT 0,
  PRIMARY KEY (rider_id, season_id, class)
);

-- Indexes
CREATE INDEX idx_events_season_round ON events (season_id, round);
CREATE INDEX idx_sessions_event_class ON sessions (event_id, class);
CREATE INDEX idx_team_entries_season_class ON team_entries (season_id, class);
CREATE INDEX idx_contracts_keys ON rider_contracts (season_id, class, team_id, rider_id);
