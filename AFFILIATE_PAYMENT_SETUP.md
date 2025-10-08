# Spontra Affiliate & Payment System Setup Guide

**Last Updated**: October 8, 2025
**Status**: Phase 1 Implementation Complete

---

## Overview

This guide walks you through setting up:
1. **Kiwi.com** affiliate integration (primary booking partner)
2. **Travelpayouts** affiliate integration (secondary booking partner)
3. **Wise Business** multi-currency account (USD receiving)
4. **Stripe Connect** creator payout system

---

## Phase 1: Kiwi.com Affiliate Setup

### Why Kiwi.com First?
- ✅ **Easy approval** - accepts new sites with no traffic
- ✅ **2-3% commission** on all bookings
- ✅ **Search API** - show real prices on your site
- ✅ **Global coverage** - 800+ airlines

### Step 1: Sign Up

1. Visit: https://www.kiwi.com/affiliate/
2. Fill out the application form:
   - **Company Name**: Spontra (or your legal entity)
   - **Website**: Your Vercel deployment URL
   - **Traffic**: Can be 0 initially (they don't require minimum)
   - **Niche**: Travel discovery / metasearch
3. **Wait 24-48 hours** for approval email

### Step 2: Get Your Credentials

Once approved, you'll receive:
- **Affiliate ID**: e.g., `spontra_123456`
- **API Key**: Access to Tequila Search API

**Where to find them:**
- Affiliate ID: Your affiliate dashboard → Account Settings
- API Key: https://tequila.kiwi.com/portal/getting-started → Generate API token

### Step 3: Configure Environment Variables

Add to `frontend/.env.local`:
```bash
KIWI_API_KEY="your_api_key_here"
KIWI_AFFILIATE_ID="spontra_123456"
```

### Step 4: Test Integration

```bash
cd frontend
npm run dev
```

Open browser console and test:
```javascript
// This should work if API key is valid
fetch('/api/test-kiwi')
```

Or use the server action directly in your code:
```typescript
import { searchKiwiFlights } from '@/app/actions/kiwi'

const result = await searchKiwiFlights({
  origin: 'LAX',
  destination: 'LAS',
  departureDate: '2025-12-01',
  adults: 1
})

console.log(result) // Should return flight results
```

### API Limits (Free Tier)
- **100 requests/minute**
- **Unlimited total requests**
- No credit card required

---

## Phase 2: Travelpayouts Affiliate Setup

### Why Travelpayouts?
- ✅ **Instant approval** - guaranteed acceptance
- ✅ **1-2% commission** (lower than Kiwi, but good fallback)
- ✅ **Multiple engines**: Aviasales, Jetradar
- ✅ **Hotel bookings** too (future revenue stream)

### Step 1: Sign Up

1. Visit: https://www.travelpayouts.com/
2. Click **"Sign Up"** (no approval wait - instant access)
3. Verify email

### Step 2: Get Your Marker (Affiliate ID)

1. Login to dashboard
2. Go to **Tools → API**
3. Copy your **Marker** (e.g., `spontra123`)
4. Copy your **API Token**

### Step 3: Configure Environment Variables

Add to `frontend/.env.local`:
```bash
TRAVELPAYOUTS_TOKEN="your_token_here"
TRAVELPAYOUTS_MARKER="spontra123"
```

### Step 4: Enable Aviasales

1. Dashboard → **Programs** → **Aviasales**
2. Click **"Join Program"** (instant approval)
3. You're now earning 1-2% on all Aviasales bookings

### Step 5: Test Integration

```typescript
import { searchTravelpayoutsFlights } from '@/app/actions/travelpayouts'

const result = await searchTravelpayoutsFlights({
  origin: 'SYD',
  destination: 'MEL',
  departureDate: '2025-12-01'
})

console.log(result) // Should return flight prices
```

---

## Phase 3: Wise Business Account (USD Receiving)

### Why Wise?
- ✅ **Real exchange rates** (no 2-3% bank markup)
- ✅ **USD receiving account** - get US bank details
- ✅ **0.5% conversion fees** (vs 3-5% banks)
- ✅ **Batch payouts** to creators worldwide

### Step 1: Create Wise Business Account

1. Visit: https://wise.com/gb/business/
2. Click **"Get started"** (use your Australian details)
3. Select **"Sole trader"** or **"Company"** (depending on your setup)
4. Verify identity (passport + address proof)
5. **Approval**: 1-2 business days

### Step 2: Open Multi-Currency Balances

Once approved:

1. Dashboard → **"Open a balance"**
2. Select **USD** (United States Dollar)
3. Select **EUR** (Euro) - optional but recommended
4. **You now have real US bank details** for receiving USD payments

**Your USD account details will look like:**
```
Account type: Checking
Routing number: 084009519
Account number: 9600000000XXXXX
Bank name: Community Federal Savings Bank
Address: New York, NY
```

### Step 3: Configure for Affiliate Payments

When you get approved by Kiwi/Travelpayouts:

**Kiwi.com payout settings:**
- Bank country: **United States**
- Routing: Your Wise routing number
- Account: Your Wise account number

**Travelpayouts payout settings:**
- Payment method: **Wire transfer**
- Currency: **USD**
- SWIFT: **CMFGUS33** (Wise's SWIFT)
- Account: Your Wise USD account details

### Step 4: Link Wise to Stripe (for creator payouts)

Coming in Phase 4 - Wise → Stripe USD transfers

---

## Phase 4: Stripe Connect Setup (Creator Payouts)

### Why Stripe Connect?
- ✅ **115+ countries** supported
- ✅ **Automatic tax compliance** (1099s, W9s)
- ✅ **Local currency payouts** to creators
- ✅ **You pay in USD** from Wise account

### Step 1: Create Stripe Account

1. Visit: https://dashboard.stripe.com/register
2. Sign up with your Australian business details
3. **Business type**: Company or Sole Trader
4. **Default currency**: **USD** (important!)

### Step 2: Enable Stripe Connect

1. Dashboard → **Connect** (left sidebar)
2. Click **"Get started"**
3. Select **"Platform or Marketplace"**
4. Platform name: **Spontra**
5. Click **"Continue"**

### Step 3: Get API Keys

1. Dashboard → **Developers** → **API Keys**
2. Copy:
   - **Publishable key**: `pk_test_...` (for frontend)
   - **Secret key**: `sk_test_...` (for backend)

### Step 4: Configure Environment Variables

Add to `frontend/.env.local`:
```bash
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

### Step 5: Create Connect Account Type

1. Dashboard → **Connect** → **Settings**
2. Select **Express** accounts (recommended)
   - Creators onboard in 2 minutes
   - Stripe handles all compliance
   - You control payout timing

**Alternative:** Standard accounts (if creators want full control)

### Step 6: Set Up Webhooks

1. Dashboard → **Developers** → **Webhooks**
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events:
   - `account.updated` (creator completes onboarding)
   - `payout.paid` (payout completed)
   - `payout.failed` (payout failed)
4. Copy **Webhook signing secret**

Add to `.env.local`:
```bash
STRIPE_WEBHOOK_SECRET="whsec_..."
```

---

## Phase 5: Testing the Full Flow

### Test Scenario: Creator Signs Up → Books Flight → Gets Paid

#### 1. Creator Signs Up
```bash
# Create test creator account
npm run dev
# Navigate to /become-creator
# Fill out form
```

#### 2. User Views Creator Video
```typescript
import { trackVideoView } from '@/app/actions/creator'

await trackVideoView({
  videoId: 'video_123',
  userId: null, // Anonymous
  sessionId: 'session_abc'
})
```

#### 3. User Clicks Booking Link (Kiwi)
```typescript
import { trackKiwiClick } from '@/app/actions/kiwi'

const clickUrl = generateKiwiDeepLink({
  origin: 'LAX',
  destination: 'LAS',
  departureDate: '2025-12-01',
  adults: 1
})

await trackKiwiClick({
  sessionId: 'session_abc',
  originAirport: 'LAX',
  destinationAirport: 'LAS',
  departureDate: '2025-12-01',
  displayedPrice: 89,
  clickUrl
})

// Redirect user to clickUrl
window.location.href = clickUrl
```

#### 4. User Books Flight (Manual Simulation)
```typescript
// In production, Kiwi sends postback webhook
// For testing, manually mark as converted:
await db.affiliateClick.update({
  where: { id: clickId },
  data: {
    converted: true,
    convertedAt: new Date(),
    commission: 2.67 // 3% of $89
  }
})
```

#### 5. Attribution to Creator
```typescript
import { processBookingAttribution } from '@/app/actions/creator'

await processBookingAttribution({
  sessionId: 'session_abc',
  destinationId: 'dest_123',
  affiliateClickId: clickId
})

// This creates CreatorEarning records
// with 60-day hold period
```

#### 6. Payout (After 60 Days)
```typescript
// Admin runs monthly payout cron
import { processMonthlyPayouts } from '@/app/actions/payouts'

await processMonthlyPayouts()

// Stripe transfers USD to creator's bank account
// Creator receives in their local currency
```

---

## Currency Flow Diagram

```
┌─────────────────────────────────────────┐
│   Kiwi.com/Travelpayouts                │
│   Pays you: $1,000 USD/month            │
└─────────────┬───────────────────────────┘
              │
              ↓
┌─────────────────────────────────────────┐
│   Wise Business - USD Balance           │
│   Receives: $1,000 USD (no conversion)  │
└─────────────┬───────────────────────────┘
              │
              ├─────────────────────────────┐
              ↓                             ↓
┌──────────────────────────┐  ┌────────────────────────┐
│  Stripe Connect          │  │  Your Living Expenses  │
│  Transfer: $200 USD      │  │  Convert: $800 → AUD   │
│  (for creator payouts)   │  │  Fee: ~0.5% = $796 AUD │
└──────────┬───────────────┘  └────────────────────────┘
           │
           ↓
┌──────────────────────────┐
│  Creator Bank Accounts   │
│  - US creator: $50 USD   │
│  - AU creator: $75 AUD   │
│  - EU creator: €45 EUR   │
│  (Stripe auto-converts)  │
└──────────────────────────┘
```

**Total Fees:**
- Wise receiving: $0 (free to receive)
- Stripe payout: ~$6 (3% of $200)
- Wise AUD conversion: ~$4 (0.5% of $800)
- **Total: $10 on $1000 revenue = 1% overhead**

Compare to converting everything to AUD then back: **5-7% overhead**

---

## Production Checklist

### Before Launch:
- [ ] Kiwi.com affiliate approved
- [ ] Travelpayouts account created
- [ ] Wise Business USD account open
- [ ] Stripe Connect configured
- [ ] Environment variables set in Vercel
- [ ] Test booking flow works
- [ ] Test creator attribution works
- [ ] Test payout calculation works

### After Launch (0-1000 users):
- [ ] Monitor affiliate click tracking
- [ ] Track conversion rates per partner
- [ ] Compare Kiwi vs Travelpayouts performance
- [ ] Optimize affiliate link placement

### Scale Phase (1000+ users):
- [ ] Apply to Skyscanner (need 10K+ monthly users)
- [ ] Apply to Kayak (need traffic proof)
- [ ] Consider switching to Duffel direct booking API
- [ ] Set up automated monthly payout cron job

---

## Support & Troubleshooting

### Kiwi.com Not Returning Results?
- Check API key is valid
- Ensure date format is `YYYY-MM-DD`
- Try reducing `max_stopovers` parameter
- Check rate limits (100/min)

### Travelpayouts Returning Empty Data?
- Their API sometimes has no data for certain routes
- Try alternative dates
- Use as fallback only (Kiwi is more reliable)

### Stripe Connect Onboarding Stuck?
- Creator needs to complete ALL steps
- May require manual identity verification
- Check Stripe Dashboard → Connect → Accounts for status

### Creator Not Receiving Payout?
- Check hold period completed (60 days)
- Verify minimum threshold met ($25 USD)
- Check Stripe account status
- Review payout logs in admin dashboard

---

## Testing Your Integration

### Quick Test (5 minutes)

1. **Add your credentials** to `frontend/.env.local`:
   ```bash
   TRAVELPAYOUTS_TOKEN="your_token_here"
   TRAVELPAYOUTS_MARKER="your_marker_here"
   ```

2. **Restart dev server**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Visit test page**: http://localhost:3000/test-affiliate

4. **Check results**:
   - ✅ All tests passing? You're ready to build!
   - ❌ Tests failing? Check error messages and verify credentials

### Test API Endpoint Directly

```bash
curl http://localhost:3000/api/test-affiliate | jq
```

Returns JSON with:
- Credential status
- Flight search results (LAX→LAS)
- Hotel search results (Las Vegas)
- Affiliate link sample

### Test in Code

```typescript
import { searchAviasalesFlights } from '@/app/actions/travelpayouts'

const flights = await searchAviasalesFlights({
  origin: 'SYD',
  destination: 'MEL',
  departureDate: '2025-12-01'
})

console.log(flights.data?.flights[0])
// { price: 89, airline: 'QF', bookingLink: 'https://...' }
```

---

## Next Steps

1. ✅ **Sign up for Travelpayouts** (instant) - https://www.travelpayouts.com/
2. ✅ **Test integration** - Visit `/test-affiliate` page
3. ⏳ **Open Wise Business account** (takes 1-2 days) - for receiving USD
4. ⏳ **Set up Stripe Connect** (coming next) - for creator payouts
5. ⏳ **Build destination pages** - Show prices from Aviasales
6. ⏳ **Add hotel recommendations** - 30% commission vs 2% flights!

---

**Questions?** Check the implementation docs in:
- `frontend/src/app/actions/kiwi.ts` - Kiwi.com integration code
- `frontend/src/app/actions/travelpayouts.ts` - Travelpayouts integration code
- `frontend/prisma/schema.prisma` - Database schema with payment fields
