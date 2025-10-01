#!/usr/bin/env python3
"""Fetch and load airport data from the OpenFlights dataset."""
from __future__ import annotations

import argparse
import csv
import os
import subprocess
import sys
from pathlib import Path

try:
    import pycountry  # type: ignore
except ImportError as exc:  # pragma: no cover
    print("pycountry is required for this script", file=sys.stderr)
    raise SystemExit(1) from exc

REPO_URL = "https://github.com/jpatokal/openflights.git"
DEFAULT_REPO_DIR = Path("temp/openflights")
DEFAULT_OUTPUT = Path("temp/airports_openflights.csv")

ALLOWED_TYPES = {
    "airport",
    "large_airport",
    "medium_airport",
    "small_airport",
}


def run(cmd: list[str], *, cwd: Path | None = None) -> None:
    result = subprocess.run(cmd, cwd=str(cwd) if cwd else None, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"Command {' '.join(cmd)} failed: {result.stderr.strip() or result.stdout.strip()}")


def ensure_repo(repo_dir: Path) -> None:
    if repo_dir.exists():
        run(["git", "-C", str(repo_dir), "fetch", "--depth", "1", "origin", "master"])
        run(["git", "-C", str(repo_dir), "reset", "--hard", "origin/master"])
    else:
        repo_dir.parent.mkdir(parents=True, exist_ok=True)
        run(["git", "clone", "--depth", "1", REPO_URL, str(repo_dir)])


def build_country_lookup(countries_file: Path) -> dict[str, str]:
    mapping: dict[str, str] = {}
    with countries_file.open(newline="", encoding="utf-8", errors="ignore") as fh:
        reader = csv.reader(fh)
        for row in reader:
            if len(row) < 2:
                continue
            name = row[0].strip()
            iso2 = (row[1] or "").strip().upper()
            iso3 = (row[2] or "").strip().upper() if len(row) > 2 else ""
            if iso2:
                mapping[name.upper()] = iso2
            if iso3 and iso3 not in mapping:
                mapping[iso3] = iso2 or iso3
    for country in pycountry.countries:
        if hasattr(country, "alpha_2"):
            mapping.setdefault(country.name.upper(), country.alpha_2.upper())
        if hasattr(country, "alpha_3"):
            mapping.setdefault(country.alpha_3.upper(), country.alpha_2.upper())
        for attr in ("common_name", "official_name"):
            value = getattr(country, attr, None)
            if value:
                mapping.setdefault(str(value).upper(), country.alpha_2.upper())
    mapping.setdefault("UK", "GB")
    mapping.setdefault("UNITED KINGDOM", "GB")
    mapping.setdefault("KOSOVO", "XK")
    mapping.setdefault("BONAIRE, SAINT EUSTATIUS AND SABA", "BQ")
    mapping.setdefault("SAINT BARTHELEMY", "BL")
    return mapping


def resolve_country_code(name: str, mapping: dict[str, str]) -> tuple[str, str]:
    cleaned = (name or "").strip()
    if not cleaned:
        return "", ""
    code = mapping.get(cleaned.upper(), "")
    if not code:
        match = pycountry.countries.get(name=cleaned)
        if match:
            code = match.alpha_2
        else:
            match = pycountry.countries.get(common_name=cleaned)
            if match:
                code = match.alpha_2
    if not code and len(cleaned) == 2:
        code = cleaned.upper()
    return cleaned if cleaned else code, code


def normalize(value: str | None) -> str:
    value = (value or "").strip()
    if value == "\\N":
        return ""
    return value


def generate_output(repo_dir: Path, output_file: Path) -> tuple[int, int]:
    airports_path = repo_dir / "data" / "airports.dat"
    countries_path = repo_dir / "data" / "countries.dat"
    if not airports_path.exists():
        raise RuntimeError(f"Missing airports dataset at {airports_path}")
    lookup = build_country_lookup(countries_path)

    output_file.parent.mkdir(parents=True, exist_ok=True)
    inserted = skipped = 0

    with airports_path.open(newline="", encoding="utf-8", errors="ignore") as src:
        with output_file.open("w", newline="", encoding="utf-8") as dst:
            reader = csv.reader(src)
            writer = csv.writer(dst)
            writer.writerow([
                "iata_code",
                "icao_code",
                "name",
                "city",
                "country",
                "country_code",
                "latitude",
                "longitude",
                "timezone",
                "altitude_ft",
                "website",
                "city_code",
            ])
            for row in reader:
                if len(row) < 14:
                    skipped += 1
                    continue
                _, name_raw, city_raw, country_raw, iata_raw, icao_raw, lat_raw, lon_raw, altitude_raw, _offset, _dst, tz_raw, airport_type_raw, _source = row[:14]
                iata = normalize(iata_raw).upper()
                if len(iata) != 3:
                    skipped += 1
                    continue
                airport_type = normalize(airport_type_raw).lower()
                if airport_type and airport_type not in ALLOWED_TYPES:
                    skipped += 1
                    continue
                name = normalize(name_raw)
                if not name:
                    skipped += 1
                    continue
                icao = normalize(icao_raw).upper()
                city = normalize(city_raw)
                country_name, country_code = resolve_country_code(country_raw, lookup)
                if not country_code:
                    skipped += 1
                    continue
                if not city:
                    city = name if name else country_name
                lat = normalize(lat_raw)
                lon = normalize(lon_raw)
                altitude = normalize(altitude_raw)
                tz = normalize(tz_raw)
                writer.writerow([
                    iata,
                    icao,
                    name,
                    city,
                    country_name,
                    country_code,
                    lat,
                    lon,
                    tz,
                    altitude,
                    "",
                    "",
                ])
                inserted += 1
    return inserted, skipped


def load_into_postgres(db_url: str, csv_path: Path) -> None:
    truncate_sql = "TRUNCATE TABLE flight_routes, airports;"
    copy_sql = (
        "\\copy airports (iata_code, icao_code, name, city, country, country_code, "
        "latitude, longitude, timezone, altitude_ft, website, city_code) "
        f"FROM '{csv_path.as_posix()}' CSV HEADER NULL ''"
    )
    run(["psql", db_url, "-c", truncate_sql])
    run(["psql", db_url, "-c", copy_sql])

    activation_sql = (
        "DO $$\n"
        "BEGIN\n"
        "  IF EXISTS (\n"
        "    SELECT 1 FROM information_schema.tables\n"
        "    WHERE table_schema = 'public' AND table_name = 'flight_durations'\n"
        "  ) THEN\n"
        "    UPDATE airports SET is_active = false;\n"
        "    UPDATE airports SET is_active = true\n"
        "    WHERE iata_code IN (\n"
        "      SELECT DISTINCT origin_airport FROM flight_durations\n"
        "      UNION\n"
        "      SELECT DISTINCT destination_airport FROM flight_durations\n"
        "    );\n"
        "  ELSE\n"
        "    UPDATE airports SET is_active = false;\n"
        "  END IF;\n"
        "END $$;"
    )
    try:
        run(["psql", db_url, "-c", activation_sql])
    except RuntimeError as exc:
        print(f"Warning: failed to update active airports: {exc}", file=sys.stderr)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Update airports data from OpenFlights")
    parser.add_argument("--repo-dir", type=Path, default=DEFAULT_REPO_DIR, help="Where to clone OpenFlights repo")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="CSV output path")
    parser.add_argument(
        "--db-url",
        default=os.environ.get(
            "DATABASE_URL",
            "postgres://spontra:development@localhost:15432/search_service_db?sslmode=disable",
        ),
        help="Postgres connection string",
    )
    parser.add_argument("--skip-load", action="store_true", help="Generate CSV without loading Postgres")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    ensure_repo(args.repo_dir)
    inserted, skipped = generate_output(args.repo_dir, args.output)
    print(f"Prepared {inserted} airports ({skipped} skipped) -> {args.output}")
    if args.skip_load:
        return
    load_into_postgres(args.db_url, args.output)
    print("Postgres updated successfully")


if __name__ == "__main__":
    main()
