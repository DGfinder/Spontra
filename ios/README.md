# Spontra iOS

Native SwiftUI app for Spontra — travel discovery on iPhone.

## Requirements
- Xcode 16+
- iOS 17+ deployment target
- Swift 5.9+

## Setup

1. Open Xcode → **File → New → Project**
2. Choose **iOS → App**
3. Settings:
   - Product Name: `Spontra`
   - Bundle ID: `com.spontra.app`
   - Interface: **SwiftUI**
   - Language: **Swift**
   - Minimum Deployments: **iOS 17**
4. Save into this `ios/` directory (replace the generated files)
5. Drag all files from `ios/Spontra/` into the Xcode project navigator
6. Build & run on simulator or your iPhone

## Structure

```
Spontra/
├── SpontraApp.swift          # @main entry point
├── ContentView.swift         # Root navigation (Home ↔ Feed)
├── Models/
│   ├── Models.swift          # All Codable data models
│   └── Theme.swift           # ThemeSlug enum + metadata
├── Services/
│   └── SpontraAPI.swift      # Async/await REST client
├── Store/
│   └── AppState.swift        # @Observable global state
├── Views/
│   ├── Home/
│   │   ├── HomeView.swift          # Main search screen
│   │   ├── AirportSearchView.swift # Debounced airport autocomplete
│   │   ├── DurationPickerView.swift
│   │   └── ThemePickerView.swift
│   ├── Feed/
│   │   ├── FeedView.swift          # Vertical paging feed
│   │   └── DestinationCard.swift   # Full-screen destination card
│   └── Destination/
│       └── DestinationView.swift   # Detail sheet
└── Extensions/
    └── Color+Spontra.swift   # Design system colors
```

## API

In DEBUG builds, the app hits `http://localhost:3000`.  
In production builds, it hits `https://spontra.com`.

Run the frontend locally to develop against real data:
```bash
cd ../frontend && npm run dev
```

## Next Steps

- [ ] Add video playback support in DestinationCard (AVPlayer)
- [ ] Implement "Find Flights" deep-link to Amadeus search
- [ ] Add bookmark/save functionality
- [ ] App icon + splash screen
- [ ] TestFlight distribution
