# Migration Notes: Theme Reels & Redis preferences

## Database changes
- Apply `scripts/migrations/20250923_add_city_theme_tables.sql` to create `CityTheme`, `Reel`, `ReelMedia` tables, enums, indexes and the `city_theme_ready` view.
- Run `scripts/migrations/20250924_migrate_theme_media.ts` once with `DATABASE_URL` (or `SEARCH_DATABASE_URL`) and optional `REDIS_URL` configured.
  - Converts `destinations_enhanced.videos` arrays into `Reel`/`ReelMedia` rows.
  - Migrates Redis `admin:dest:preferences` cache entries into `CityTheme.isEnabled`.
  - Clears legacy Redis keys.

## Post migration cleanup
- Remove any deprecated references to `/api/admin/destinations/preferences` and numeric theme score flows.
- Verify `city_theme_ready` view returns expected readiness flags.

## Rollback
- To revert, drop the new tables and restore a backup of `destinations_enhanced.videos`.
- Rehydrate Redis preference keys if needed.
