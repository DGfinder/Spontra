import SwiftUI

enum ThemeSlug: String, CaseIterable, Codable {
    case adventure
    case nature
    case vibe
    case indulge
    case discover

    var displayName: String {
        switch self {
        case .adventure: return "Adventure"
        case .nature:    return "Nature"
        case .vibe:      return "Vibe"
        case .indulge:   return "Indulge"
        case .discover:  return "Discover"
        }
    }

    var emoji: String {
        switch self {
        case .adventure: return "🧗"
        case .nature:    return "🌿"
        case .vibe:      return "🎉"
        case .indulge:   return "🍷"
        case .discover:  return "🗺️"
        }
    }

    var description: String {
        switch self {
        case .adventure: return "Hike, surf, climb"
        case .nature:    return "Forests, coasts, wildlife"
        case .vibe:      return "Nightlife, culture, energy"
        case .indulge:   return "Fine dining, spas, luxury"
        case .discover:  return "History, art, hidden gems"
        }
    }

    var gradient: [Color] {
        switch self {
        case .adventure: return [Color(hex: "#fbbf24"), Color(hex: "#f59e0b")]
        case .nature:    return [Color(hex: "#22c55e"), Color(hex: "#16a34a")]
        case .vibe:      return [Color(hex: "#f97316"), Color(hex: "#ea580c")]
        case .indulge:   return [Color(hex: "#ef4444"), Color(hex: "#b91c1c")]
        case .discover:  return [Color(hex: "#9333ea"), Color(hex: "#7e22ce")]
        }
    }
}
