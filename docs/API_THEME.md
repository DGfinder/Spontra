# Admin Theme APIs

## GET /api/admin/destinations/[iata]/themes
- Auth: `x-spontra-admin-role` header, roles: owner, admin, curator, analyst, support.
- Response: `{ ok: true, data: Array<{ themeSlug, isEnabled, min, max, reelCount, isReady }> }`

## PATCH /api/admin/destinations/[iata]/themes/[theme]
- Roles: owner, admin, curator.
- Body: `{ isEnabled?, min?, max?, notes? }`
- Enabling checks reel count within min/max (default 5-10).

## GET /api/admin/destinations/[iata]/themes/[theme]/reels
- Returns reels + media metadata for destination/theme.

## POST /api/admin/destinations/[iata]/themes/[theme]/reels
- Body: `{ urls: string[] }`
- Creates one reel per URL after host validation.

## PATCH /api/admin/reels/[id]
- Body: `{ title?, caption?, isActive?, sortOrder? }`

## POST /api/admin/reels/[id]/media
- Body: `{ urls: string[] }`
- Attaches additional media items to an existing reel.

## PATCH /api/admin/reel-media/[id]
- Body: `{ isActive?, sortOrder?, altText?, credit?, license? }`

## GET /api/admin/destinations/list-from-airports
- Includes per-theme readiness array.

## GET /api/admin/destinations/[iata]
- Overlay fields + theme readiness.

## POST /api/admin/destinations/update
- Upserts overlay description/hero/highlights/activities into `destinations_enhanced`.
