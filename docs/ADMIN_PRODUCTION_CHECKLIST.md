# Admin Panel Production Checklist

## Configuration
- [ ] `ADMIN_PANEL_EMAIL` and `ADMIN_PANEL_PASSWORD` set to non-default values.
- [ ] `ADMIN_PANEL_JWT_SECRET` provisioned (>=32 chars) and shared with the server runtime.
- [ ] Location dataset regenerated (`node scripts/generate-admin-locations.js`) after latest airport import.

## Application Health
- [ ] Dashboard "Ready destinations" > 0 and "Needs attention" cleared or triaged.
- [ ] Moderation queue empty or actively monitored.
- [ ] Detail editor saves succeed (test overview + activities updates).
- [ ] Theme toggles enforce reel gating (verify warning toast on insufficient media).

## Observability
- [ ] Console analytics events flowing (`destinations.*` events visible on actions).
- [ ] Plan to forward console logs to central logging in production.

## Security
- [ ] HTTPS enforced for admin host.
- [ ] Session cookie marked `HttpOnly`, `Secure`, `SameSite=Lax` in production (handled by auth helper).
- [ ] Admin credentials rotated and stored securely.

## Rollout
- [ ] Update README/hand-off notes with new quickstart & cheat sheet links.
- [ ] Communicate navigation changes to curators (new quick jump + detail tabs).
