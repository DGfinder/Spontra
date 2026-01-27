# Spontra Mobile App

Instagram meets Skyscanner — discover destinations by vibe, not just location.

## The Vision

Most travel sites assume you know WHERE you want to go. Spontra flips it:
- Pick your **vibe** (Adventure, Nature, Vibe, Indulge, Discover)
- Set your **max flight time**
- Swipe through **curated Shorts & photos**
- Tap to fly there

## Tech Stack

- **Expo SDK 54** (React Native)
- **expo-router** - File-based navigation
- **expo-video** - Video playback for Shorts
- **react-native-reanimated** - Smooth animations
- **@shopify/flash-list** - Performant scrolling feed
- **Zustand** - State management (same as web)

## Getting Started

```bash
# Install dependencies
npm install

# Start Expo dev server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android
```

## Project Structure

```
mobile/
├── app/                    # Screens (expo-router)
│   ├── _layout.tsx        # Root layout
│   ├── index.tsx          # Home - Theme selection
│   ├── feed.tsx           # Swipeable content feed
│   └── destination/
│       └── [iata].tsx     # Flight search & booking
├── components/
│   ├── feed/
│   │   └── ContentCard.tsx # Video/image card
│   └── ui/
├── hooks/
├── services/
│   └── api.ts             # Backend API client
├── store/
│   └── appStore.ts        # Zustand store
└── types/
    └── index.ts           # Shared types
```

## Key Screens

### 1. Home (`index.tsx`)
- Airport input
- Flight time selector (1h - 5h)
- Theme selection (5 vibes)
- "Explore" CTA

### 2. Feed (`feed.tsx`)
- Full-screen swipeable cards
- Video auto-plays when visible
- Destination info overlay
- "Fly there" CTA on each card

### 3. Destination (`destination/[iata].tsx`)
- Flight search results
- Date picker
- Direct booking links
- Google Flights fallback

## Connecting to Backend

The app expects these API endpoints from the Next.js backend:

```
GET  /api/destinations/explore?origin=LHR&theme=adventure&maxFlightMinutes=180
GET  /api/destinations/:iata/themes/:theme/reels
POST /api/amadeus/flights
POST /api/redirect/flight
GET  /api/airports/search?q=london
```

For development, mock data is included. Set `EXPO_PUBLIC_API_URL` in `.env` to point to your backend.

## Content Curation

Content comes from the admin panel (curated Reels), NOT YouTube API search.

Each piece of content has:
- Destination (IATA, city, country)
- Theme (adventure/nature/vibe/indulge/discover)
- Media (video URL or image URL)
- Attribution (original creator credit)

## Design Tokens

```
Colors:
- Background: #0f172a (slate-900)
- Card: #1e293b (slate-800)
- Border: #334155 (slate-700)
- Text: #fff / #e2e8f0 / #94a3b8
- Accent: #f97316 (orange-500)
- Success: #4ade80 (green-400)

Themes (gradients):
- Adventure: orange → red
- Nature: green → teal
- Vibe: purple → pink
- Indulge: amber → yellow
- Discover: blue → indigo
```

## Building for Production

```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to stores
eas submit
```

## Future Enhancements

- [ ] Pull-to-refresh on feed
- [ ] Save/bookmark destinations
- [ ] Share cards to social
- [ ] Push notifications for deals
- [ ] Onboarding flow
- [ ] User accounts
- [ ] Personalized recommendations
