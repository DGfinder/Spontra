# Google Analytics 4 (GA4) Setup Guide

**Status**: ✅ Code Complete - Configuration Required
**Date**: October 2025

---

## 📋 Overview

Google Analytics 4 has been fully integrated into Spontra with:
- **GDPR/CCPA Compliance** - Only tracks when user consents to analytics cookies
- **IP Anonymization** - All IP addresses anonymized automatically
- **Event Tracking** - Custom events for search, clicks, conversions
- **Page View Tracking** - Automatic tracking on route changes
- **User Properties** - Track logged-in user behavior

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Create Google Analytics 4 Property

1. Go to [Google Analytics](https://analytics.google.com/)
2. Click **Admin** (gear icon, bottom left)
3. Click **Create Property**
4. Enter property details:
   - **Property name**: Spontra
   - **Reporting time zone**: Your timezone
   - **Currency**: USD
5. Click **Next**, then **Create**

### Step 2: Get Your Measurement ID

1. In **Admin** → **Property** → **Data Streams**
2. Click **Add stream** → **Web**
3. Enter:
   - **Website URL**: https://spontra.com (or your domain)
   - **Stream name**: Spontra Production
4. Click **Create stream**
5. **Copy the Measurement ID** (format: `G-XXXXXXXXXX`)

### Step 3: Add Measurement ID to Environment Variables

**Local Development** (`.env.local`):
```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
```

**Vercel Production**:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - **Key**: `NEXT_PUBLIC_GA_MEASUREMENT_ID`
   - **Value**: `G-XXXXXXXXXX`
   - **Environment**: Production, Preview, Development (select all)
3. Click **Save**
4. **Redeploy** your application for changes to take effect

### Step 4: Verify Installation

1. Visit your site in a browser
2. **Accept analytics cookies** via the cookie banner
3. Open browser DevTools → Network tab
4. Search for `gtag/js` or `google-analytics.com`
5. You should see GA4 requests being sent

**Alternative**: Use [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna) Chrome extension

---

## 📊 Events Being Tracked

### Automatic Events
- ✅ **Page Views** - Every route change
- ✅ **First Visit** - New user session start
- ✅ **Session Start** - User session metrics

### Custom Events (Implementation Ready)

| Event Name | Trigger | Parameters |
|------------|---------|------------|
| `search` | User searches for destinations | `origin_airport`, `theme`, `min_flight_time`, `max_flight_time`, `results_count` |
| `view_item` | User views destination detail | `item_id`, `item_name`, `item_category` (country) |
| `affiliate_click` | User clicks flight comparison link | `partner`, `destination`, `origin`, `value` |
| `conversion` | Affiliate click (conversion event) | `conversion_type`, `partner`, `value` |
| `sign_up` | User creates account | `method` (email, google) |
| `login` | User logs in | `method` (email, google) |
| `add_to_favorites` | User favorites destination | `item_id`, `item_name` |
| `save_search` | User saves search | `origin_airport`, `theme` |
| `video_play` | User plays destination video | `video_url`, `destination_id` |
| `outbound_link_click` | User clicks external link | `link_url`, `link_label` |

### How to Use Event Tracking

Import the tracking functions in your components:

```typescript
import {
  trackSearch,
  trackDestinationView,
  trackAffiliateClick,
  trackSignup,
  trackLogin,
  trackFavoriteAdded,
  trackSavedSearch
} from '@/lib/analytics'

// Example: Track search
trackSearch({
  origin: 'LAX',
  theme: 'adventure',
  minFlightTime: 2,
  maxFlightTime: 6,
  resultsCount: 25
})

// Example: Track affiliate click
trackAffiliateClick({
  partner: 'skyscanner',
  destination: 'Tokyo',
  origin: 'LAX',
  value: 50  // Estimated commission value
})
```

---

## 🎯 Setting Up Conversion Goals

### Step 1: Create Key Events (Conversions)

1. In GA4, go to **Admin** → **Events**
2. Click **Create event** or **Mark as conversion**
3. Mark these events as conversions:
   - `affiliate_click` - Primary conversion (commission opportunity)
   - `sign_up` - User acquisition
   - `save_search` - Engagement
   - `add_to_favorites` - Engagement

### Step 2: Configure Enhanced Conversions (Optional)

For better conversion attribution:

1. Go to **Admin** → **Data Streams** → Your web stream
2. Click **Configure tag settings** → **Show more**
3. Enable **Enhanced conversions**
4. Follow Google's instructions to verify

### Step 3: Set Up Conversion Funnels

1. Go to **Explore** → **Funnel exploration**
2. Create funnel:
   - **Step 1**: `page_view` (home page)
   - **Step 2**: `search`
   - **Step 3**: `view_item` (destination view)
   - **Step 4**: `affiliate_click` (conversion)

This shows your **search → click → conversion** funnel.

---

## 🔍 Key Reports to Monitor

### Traffic Acquisition
- **Path**: Reports → Acquisition → Traffic acquisition
- **What to Monitor**: Where users come from (Google, social, direct, referral)
- **Goal**: Optimize marketing spend based on highest-converting sources

### User Engagement
- **Path**: Reports → Engagement → Events
- **What to Monitor**: Most common user actions (`search`, `affiliate_click`, `view_item`)
- **Goal**: Understand user behavior, identify drop-off points

### Conversions
- **Path**: Reports → Monetization → Conversions
- **What to Monitor**: `affiliate_click` conversion rate, conversion path
- **Goal**: Measure affiliate revenue attribution

### Realtime
- **Path**: Reports → Realtime
- **What to Monitor**: Current active users, live events
- **Goal**: Test new features, verify tracking

---

## 🛡️ Privacy & GDPR Compliance

### How Spontra Respects Privacy

✅ **Consent-Based Tracking**
- GA4 **only loads** when user accepts analytics cookies
- Cookie banner shown on first visit
- User can change preferences anytime (Cookie Settings in footer)

✅ **IP Anonymization**
- All IP addresses anonymized (`anonymize_ip: true`)
- GA4 cannot track precise user location (city-level only)

✅ **No PII Tracking**
- We do NOT send email addresses, names, or user IDs to GA4
- User IDs are hashed anonymously for logged-in users

✅ **Data Retention**
- GA4 default: 26 months (configurable in GA4 settings)
- Can be reduced to 14 months or 2 months for stricter privacy

### Configuring Data Retention

1. Go to **Admin** → **Data Settings** → **Data retention**
2. Set **Event data retention**: 14 months (recommended for GDPR)
3. Enable **Reset user data on new activity**: ON

---

## 📈 Success Metrics to Track

Once GA4 is configured, monitor these KPIs:

### 1. Traffic & Acquisition
- **Users**: Target 1,000-10,000/month (first 6 months)
- **Sessions**: Target 2-5 sessions per user
- **Bounce Rate**: Target < 60%
- **Avg Session Duration**: Target > 2 minutes

### 2. Search Behavior
- **Searches per User**: Target 2-5
- **Top Origin Airports**: Identify popular departure cities
- **Top Themes**: Understand user preferences (adventure, beach, culture)
- **Search-to-View Rate**: % of searches that lead to destination views (target > 40%)

### 3. Affiliate Conversions
- **Affiliate Click Rate**: % of destination views that result in clicks (target > 10%)
- **Top Converting Partners**: Which metasearch site (Skyscanner, KAYAK, Google Flights) converts best
- **Conversion Value**: Track estimated commission revenue
- **Click-to-Booking Conversion**: If partners provide webhook data (typical 5-15%)

### 4. User Engagement
- **Signup Rate**: % of users who create accounts (target > 5%)
- **Favorite Destinations**: Avg favorites per user (target > 3)
- **Saved Searches**: % of users who save searches (target > 10%)
- **Return Visitor Rate**: % of users who visit 2+ times (target > 30%)

---

## 🐛 Troubleshooting

### GA4 Not Showing Data

**Problem**: No data appearing in GA4 after 24-48 hours

**Solutions**:
1. Verify `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set correctly
2. Check browser console for errors (`Failed to load gtag/js`)
3. Ensure you **accepted analytics cookies** (required for tracking)
4. Disable ad blockers (uBlock Origin, AdBlock Plus block GA4)
5. Check Realtime report in GA4 (data appears instantly here)

### Events Not Tracking

**Problem**: Page views work, but custom events don't appear

**Solutions**:
1. Verify event names match GA4 recommended events (e.g., `sign_up`, not `signup`)
2. Check browser console for `[Analytics] Event tracked:` logs
3. Use **DebugView** in GA4 (Admin → DebugView) for real-time event testing
4. Ensure `trackEvent()` is called **after** GA4 loads (inside `useEffect` or click handlers)

### Consent Issues

**Problem**: "Analytics disabled - no consent" in console

**Solutions**:
1. This is **expected behavior** if user hasn't accepted analytics cookies
2. Click "Accept All" on cookie banner
3. Or enable analytics in Cookie Settings (footer link)
4. Verify `localStorage` has `spontra_cookie_consent` with `analytics: true`

---

## 🔗 Useful Links

- [Google Analytics 4 Documentation](https://support.google.com/analytics/answer/10089681)
- [GA4 Events Reference](https://support.google.com/analytics/answer/9267735)
- [GA4 Privacy Controls](https://support.google.com/analytics/answer/9019185)
- [Enhanced Conversions Setup](https://support.google.com/google-ads/answer/11062876)
- [GDPR Compliance Guide](https://support.google.com/analytics/answer/9019185)

---

## ✅ Post-Setup Checklist

After configuring GA4, verify:

- [ ] Measurement ID added to environment variables (local + Vercel)
- [ ] GA4 property created with correct data stream
- [ ] Realtime report shows active users when you visit site
- [ ] Cookie banner allows users to accept/reject analytics
- [ ] Events appear in DebugView (Admin → DebugView)
- [ ] Conversion events marked (`affiliate_click`, `sign_up`)
- [ ] Data retention configured (14-26 months)
- [ ] IP anonymization enabled (default)
- [ ] Team members granted access (Admin → Property Access Management)

---

**🎉 You're Done!** Spontra now has enterprise-grade analytics with full GDPR compliance.

Next steps: Monitor traffic for 1-2 weeks, then optimize based on user behavior data.
