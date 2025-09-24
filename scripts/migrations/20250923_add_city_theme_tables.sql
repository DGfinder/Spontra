-- Migration: add CityTheme, Reel, ReelMedia tables and readiness view
-- Run against Postgres database configured for Spontra admin tooling

DO 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MediaKind') THEN
    CREATE TYPE "MediaKind" AS ENUM ('video', 'image');
  END IF;
END;

DO 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AspectRatio') THEN
    CREATE TYPE "AspectRatio" AS ENUM ('_9_16', '_1_1', '_16_9');
  END IF;
END;

CREATE TABLE IF NOT EXISTS "CityTheme" (
  id               SERIAL PRIMARY KEY,
  iata             VARCHAR(3) NOT NULL,
  "themeSlug"        VARCHAR(32) NOT NULL,
  "isEnabled"        BOOLEAN NOT NULL DEFAULT FALSE,
  "minMediaRequired" INT NOT NULL DEFAULT 5,
  "maxMediaAllowed"  INT NOT NULL DEFAULT 10,
  notes            TEXT,
  CONSTRAINT city_theme_bounds CHECK (
    "minMediaRequired" >= 0 AND "maxMediaAllowed" >= "minMediaRequired"
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS city_theme_iata_slug_idx
  ON "CityTheme" (iata, "themeSlug");

CREATE INDEX IF NOT EXISTS city_theme_iata_idx
  ON "CityTheme" (iata);

CREATE INDEX IF NOT EXISTS city_theme_slug_idx
  ON "CityTheme" ("themeSlug");

CREATE TABLE IF NOT EXISTS "Reel" (
  id         SERIAL PRIMARY KEY,
  iata       VARCHAR(3) NOT NULL,
  "themeSlug"  VARCHAR(32) NOT NULL,
  title      TEXT,
  caption    TEXT,
  language   VARCHAR(8) NOT NULL DEFAULT 'en',
  "isActive"  BOOLEAN NOT NULL DEFAULT TRUE,
  "sortOrder" INT NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS reel_theme_active_idx
  ON "Reel" (iata, "themeSlug", "isActive");

CREATE TABLE IF NOT EXISTS "ReelMedia" (
  id          SERIAL PRIMARY KEY,
  "reelId"    INT NOT NULL REFERENCES "Reel" (id) ON DELETE CASCADE,
  kind        "MediaKind" NOT NULL,
  "sourceUrl" TEXT NOT NULL,
  "providerId" TEXT,
  aspect      "AspectRatio" NOT NULL DEFAULT '_9_16',
  "durationMs" INT,
  width       INT,
  height      INT,
  "altText"   TEXT,
  credit      TEXT,
  license     TEXT,
  "sortOrder" INT NOT NULL DEFAULT 0,
  "isActive"  BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS reel_media_active_idx
  ON "ReelMedia" ("reelId", "isActive");

CREATE OR REPLACE FUNCTION set_reel_updated_at()
RETURNS TRIGGER AS 
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
 LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS reel_set_updated_at ON "Reel";
CREATE TRIGGER reel_set_updated_at
BEFORE UPDATE ON "Reel"
FOR EACH ROW EXECUTE FUNCTION set_reel_updated_at();

INSERT INTO "CityTheme" (iata, "themeSlug")
SELECT a.iata_code, slug
FROM airports a
CROSS JOIN (VALUES
  ('adventure'),
  ('nature'),
  ('vibe'),
  ('indulge'),
  ('discover')
) AS themes(slug)
ON CONFLICT (iata, "themeSlug") DO NOTHING;

CREATE OR REPLACE VIEW city_theme_ready AS
SELECT
  ct.iata,
  ct."themeSlug" AS theme_slug,
  COUNT(DISTINCT r.id) FILTER (WHERE r."isActive") AS reel_count,
  MIN(ct."minMediaRequired") AS min_media_required,
  MIN(ct."maxMediaAllowed") AS max_media_allowed,
  (BOOL_AND(ct."isEnabled")
    AND COUNT(DISTINCT r.id) FILTER (WHERE r."isActive")
        BETWEEN MIN(ct."minMediaRequired") AND MIN(ct."maxMediaAllowed")) AS is_ready
FROM "CityTheme" ct
LEFT JOIN "Reel" r
  ON r.iata = ct.iata
 AND r."themeSlug" = ct."themeSlug"
 AND r."isActive"
GROUP BY ct.iata, ct."themeSlug";
