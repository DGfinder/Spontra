import Foundation

// MARK: - Airport

struct Airport: Codable, Identifiable, Hashable {
    var id: String { code }
    let code: String
    let name: String
    let city: String
    let country: String
    let importanceScore: Double

    enum CodingKeys: String, CodingKey {
        case code, name, city, country
        case importanceScore = "importance_score"
    }
}

// MARK: - Destination

struct Destination: Codable, Identifiable, Hashable {
    var id: String { iata }
    let iata: String
    let cityName: String
    let countryName: String
    let countryCode: String
    let flightDurationMinutes: Int?
    let estimatedPrice: Double?
    let currency: String

    var formattedDuration: String? {
        guard let mins = flightDurationMinutes else { return nil }
        let h = mins / 60
        let m = mins % 60
        if h == 0 { return "\(m)m" }
        if m == 0 { return "\(h)h" }
        return "\(h)h \(m)m"
    }

    var formattedPrice: String? {
        guard let price = estimatedPrice else { return nil }
        return "\(currency)\(Int(price))"
    }
}

// MARK: - Reel Media

struct ReelMedia: Codable, Identifiable {
    let id: String
    let reelId: String
    let kind: MediaKind
    let sourceUrl: String
    let credit: String?
    let altText: String?
    let sortOrder: Int
    let isActive: Bool

    enum MediaKind: String, Codable {
        case image, video
    }
}

// MARK: - Reel

struct Reel: Codable, Identifiable {
    let id: String
    let iata: String
    let themeSlug: String
    let title: String?
    let caption: String?
    let language: String
    let isActive: Bool
    let sortOrder: Int
    let createdAt: String
    let updatedAt: String
    let media: [ReelMedia]

    var primaryMedia: ReelMedia? { media.first }
}

// MARK: - Feed Item

struct FeedItem: Codable, Identifiable {
    let id: String
    let reel: Reel
    let destination: Destination
    let theme: String
}

// MARK: - API Responses

struct FeedResponse: Codable {
    let ok: Bool
    let data: [FeedItem]
    let meta: FeedMeta
}

struct FeedMeta: Codable {
    let origin: String
    let theme: String
    let maxFlightMinutes: Int
    let minFlightMinutes: Int
    let count: Int
}

struct AirportSearchResponse: Codable {
    let ok: Bool
    let data: [Airport]
}
