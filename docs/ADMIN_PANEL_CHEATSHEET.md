# Admin Panel Cheat Sheet

| Action | Where | Notes |
| --- | --- | --- |
| Refresh dashboard metrics | Dashboard ? Refresh button | Pulls latest readiness snapshot from the destination index. |
| Filter destinations by country | Global nav ? selector | Auto-updates the grid and detail view URL parameters. |
| Jump to destination detail | Destinations grid ? “Edit details” | Opens tabbed editor for the selected IATA code. |
| Manage reels | Destination detail ? Media tab | Reel list supports add, reorder, enable/disable, and caption edits. |
| Resolve moderation item | Moderation queue ? “Resolve” | Marks item as resolved and logs to console/toast. |
| Clear filters | Destinations grid ? “Clear filters” | Resets search, readiness, and country/city filters. |
| Toggle theme gating | Destination detail or grid theme chips | Requires min media count; logs to console analytics. |
| Update highlights | Destination detail ? Overview tab | Persisted through `/api/admin/destinations/update`. |
| Copy hero URL | Use browser copy from field | Image preview updates automatically. |

> Pro tip: The shell navigator keeps your country/city context between pages so you can audit all locales quickly.
