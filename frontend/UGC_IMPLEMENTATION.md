# UGC Creator System Implementation

## ✅ Phase 1 Complete: Core Attribution System

### Database Schema

**New Models:**
- `Creator` - Creator profiles with tier system (new 5% → elite 15%)
- `VideoView` - Track every video view with same-day filtering
- `CreatorEarning` - Record earnings from attributed bookings

**Updated Models:**
- `User` - Added creator relation
- `POIVideo` - Added creatorId for attribution

**Tier System:**
- `new`: 5% commission share (just signed up)
- `active`: 8% (10+ videos OR 50+ bookings OR $100+ earned)
- `top`: 12% ($1K+ earned OR 200+ bookings)
- `elite`: 15% ($5K+ earned OR 1K+ bookings)

### Server Actions Created

**`creatorActions.ts`:**
- `createCreatorProfile()` - Onboard new creators
- `updateCreatorProfile()` - Update profile info
- `getCreatorByUserId()` - Fetch creator data
- `getCreatorEarnings()` - Dashboard earnings summary
- `upgradeCreatorTier()` - Auto-upgrade based on performance
- `getTierRate()` - Get commission rate for tier

**`videoTrackingActions.ts`:**
- `trackVideoView()` - Record video views for attribution
- `calculateAttribution()` - Same-day, destination-filtered logic
- `processBookingAttribution()` - Create earnings + upgrade tiers
- `getVideoAnalytics()` - Per-video performance metrics

### Attribution Logic

**Rules:**
1. **Same-day only** - Videos watched TODAY influence TODAY's bookings
2. **Destination filter** - Only videos for BOOKED destination count
3. **Discovery mode** - Single video = 100% attribution
4. **Research mode** - Multiple videos = Equal split (cap at 10)
5. **No attribution** - No same-day views = platform keeps 100%

**Commission Flow:**
```
$300 booking → $9 commission (3%)
  ↓
6 videos watched same day
  ↓
Creator tier: active (8%)
  ↓
Each creator: $9 × 0.08 × (1/6) = $0.12
  ↓
Platform keeps: $9 - ($0.12 × 6) = $8.28 (92%)
```

### Utilities

**`session.ts`:**
- `getSessionId()` - Track anonymous users (30-day cookie)
- `getUserId()` - Get logged-in user (from JWT)
- `getTrackingContext()` - Unified tracking helper

## 📋 Phase 2: Creator Features (Next)

### 1. Creator Onboarding UI
- [ ] Registration form (/become-creator)
- [ ] Profile setup (name, bio, social handles)
- [ ] Welcome tutorial/tour

### 2. Creator Dashboard
- [ ] Earnings overview (lifetime, this month)
- [ ] Top performing videos
- [ ] Analytics charts (views, bookings, revenue)
- [ ] Payout management ($25 minimum)

### 3. Video Submission
- [ ] URL paste form (Instagram/TikTok/YouTube)
- [ ] Destination selector
- [ ] Theme picker
- [ ] Caption/metadata entry
- [ ] Preview before submit

### 4. Admin Moderation
- [ ] Pending submissions queue
- [ ] Video player with metadata
- [ ] Approve/reject workflow
- [ ] Rejection reasons

## 🔄 Phase 3: Video Infrastructure (Future)

### Video Download & Hosting
- [ ] yt-dlp integration (download from URLs)
- [ ] Cloudflare Stream setup
- [ ] Upload pipeline
- [ ] Thumbnail generation

### Platform Support
- [ ] Instagram Reels parser
- [ ] TikTok video parser
- [ ] YouTube Shorts (already supported)

### Custom Video Player
- [ ] Vertical format (9:16)
- [ ] Autoplay/loop
- [ ] Creator attribution overlay
- [ ] CTA to book

## 🎯 Integration Points

### Booking Flow Integration

**When user books a flight:**
```typescript
// In your booking completion handler
import { processBookingAttribution } from '@/actions/videoTrackingActions'
import { getTrackingContext } from '@/lib/session'

async function handleBookingComplete(booking) {
  const { userId, sessionId } = await getTrackingContext()

  await processBookingAttribution({
    userId,
    sessionId,
    affiliateClickId: booking.affiliateClickId,
    destinationId: booking.destinationId,
    bookingValue: booking.totalPrice,
    commission: booking.commission, // 3% of totalPrice
    bookingTimestamp: new Date()
  })
}
```

### Video Player Integration

**Track views when user watches videos:**
```typescript
// In your video player component
'use client'
import { trackVideoView } from '@/actions/videoTrackingActions'
import { useEffect } from 'react'

export function VideoPlayer({ videoId }) {
  useEffect(() => {
    // Track view when video starts playing
    async function trackView() {
      const sessionId = getCookie('session_id') // Client-side cookie
      const userId = null // Or get from auth context

      await trackVideoView({
        userId,
        sessionId,
        videoId
      })
    }

    trackView()
  }, [videoId])

  // ... rest of player
}
```

## 📊 Business Metrics

**Tracking Success:**
- Creator count by tier
- Average earnings per creator
- Attribution rate (% of bookings attributed)
- Platform margin (should stay 85-90%)
- Creator retention (monthly active)

**SQL Queries:**

```sql
-- Creator tier distribution
SELECT tier, COUNT(*) as count, AVG(total_earnings) as avg_earnings
FROM creators
GROUP BY tier;

-- Attribution rate
SELECT
  COUNT(DISTINCT affiliate_click_id) as total_bookings,
  COUNT(DISTINCT ce.affiliate_click_id) as attributed_bookings,
  (COUNT(DISTINCT ce.affiliate_click_id)::float / COUNT(DISTINCT affiliate_click_id)) * 100 as attribution_rate
FROM affiliate_clicks ac
LEFT JOIN creator_earnings ce ON ac.id = ce.affiliate_click_id;

-- Top earning creators
SELECT
  c.display_name,
  c.tier,
  c.total_earnings,
  COUNT(v.id) as video_count,
  COUNT(e.id) as booking_count
FROM creators c
LEFT JOIN poi_videos v ON v.creator_id = c.id
LEFT JOIN creator_earnings e ON e.creator_id = c.id
GROUP BY c.id
ORDER BY c.total_earnings DESC
LIMIT 10;
```

## 🚀 Next Steps

1. **Build Creator Dashboard** (highest priority)
   - Shows earnings, analytics, payout status
   - Integrate with existing /dashboard route

2. **Build Video Submission Form**
   - Simple URL paste for now
   - Manual admin approval

3. **Integrate Booking Attribution**
   - Add to existing booking flow
   - Test with real bookings

4. **Video Download Pipeline** (later)
   - yt-dlp + Cloudflare Stream
   - Automated upload

## 🔧 Testing Checklist

- [ ] Track video view (anonymous user)
- [ ] Track video view (logged-in user)
- [ ] Single video attribution (100%)
- [ ] Multi-video attribution (split)
- [ ] Same-day filtering works
- [ ] Destination filtering works
- [ ] Tier upgrade triggers correctly
- [ ] No same-day views = no attribution
- [ ] Creator earnings aggregate correctly

## 📝 Notes

- Prisma Client will regenerate on next dev server restart
- All commission rates configurable via `getTierRate()`
- Session cookies persist 30 days
- Earnings tracked in Decimal for precision
- Auto tier upgrades on every booking attribution
