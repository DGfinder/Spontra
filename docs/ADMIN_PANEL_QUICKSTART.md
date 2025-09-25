# Admin Panel Quickstart

## Prerequisites
- Node.js 18+
- `npm install` completed in `frontend`
- `.env.local` with `ADMIN_PANEL_EMAIL`, `ADMIN_PANEL_PASSWORD`, and `ADMIN_PANEL_JWT_SECRET`

## Launching the Admin Panel
1. Start the API/backend stack (if applicable).
2. From `frontend/`, run `npm run dev`.
3. Visit `http://localhost:3000/admin/login`.
4. Sign in with the admin credentials referenced above.

## Primary Workflows
- **Destinations ? Manage**: overview grid with readiness filters and quick jumps by country/city.
- **Destinations ? Detail**: tabs for overview, theme readiness, activities, and media management per theme.
- **Airports ? Manage**: read-only reference of airport data and search tooling.
- **Dashboard**: high-level readiness metrics, search health estimate, and “needs attention” list.
- **Moderation**: lite queue to triage flagged content/creators with resolve and dismiss actions.

## Keyboard Tips
- `/` focuses the search field on the destination grid (when focused).  
- `g m` navigates to the moderation queue (custom shortcut in global shell).

## Troubleshooting
- **403 redirect to login**: ensure the JWT secret is set and matches server-side value.
- **Destinations missing data**: re-run `scripts/generate-admin-locations.js` then refresh.
- **Theme toggle blocked**: open the destination detail ? Media tab and add the required reels.
