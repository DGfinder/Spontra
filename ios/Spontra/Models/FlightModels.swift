import Foundation

// MARK: - Flight Search Request

struct FlightSearchRequest {
    let origin: String
    let destination: String
    let departureDate: String   // "yyyy-MM-dd"
    let returnDate: String?
    let passengers: Int
    let travelClass: TravelClass
    let nonStop: Bool

    enum TravelClass: String, CaseIterable {
        case economy     = "ECONOMY"
        case business    = "BUSINESS"
        case first       = "FIRST"

        var displayName: String {
            switch self {
            case .economy:  return "Economy"
            case .business: return "Business"
            case .first:    return "First"
            }
        }
    }
}

// MARK: - Flight Offer

struct FlightOffer: Codable, Identifiable {
    let id: String
    let origin: String
    let destination: String
    let departureDate: String
    let returnDate: String?
    let adults: Int
    let travelClass: String
    let price: Double
    let currency: String
    let departureTime: String
    let arrivalTime: String
    let duration: String
    let stops: Int
    let carrierCode: String
    let flightNumber: String

    var formattedPrice: String {
        let symbol = currencySymbol(for: currency)
        return "\(symbol)\(Int(price))"
    }

    var formattedDeparture: String { formatTime(departureTime) }
    var formattedArrival: String   { formatTime(arrivalTime) }

    var formattedDuration: String {
        // "PT2H30M" → "2h 30m"
        let str = duration.replacingOccurrences(of: "PT", with: "")
        var result = ""
        if let hRange = str.range(of: "H") {
            let hours = str[str.startIndex..<hRange.lowerBound]
            result += "\(hours)h "
        }
        if let mRange = str.range(of: "M") {
            let start = str.range(of: "H")?.upperBound ?? str.startIndex
            let mins = str[start..<mRange.lowerBound]
            result += "\(mins)m"
        }
        return result.trimmingCharacters(in: .whitespaces)
    }

    var stopsLabel: String {
        stops == 0 ? "Direct" : "\(stops) stop\(stops > 1 ? "s" : "")"
    }

    private func formatTime(_ iso: String) -> String {
        let formats = ["yyyy-MM-dd'T'HH:mm:ss", "yyyy-MM-dd'T'HH:mm"]
        let f = DateFormatter()
        for fmt in formats {
            f.dateFormat = fmt
            if let d = f.date(from: iso) {
                f.dateFormat = "HH:mm"
                return f.string(from: d)
            }
        }
        return String(iso.suffix(5))
    }

    private func currencySymbol(for code: String) -> String {
        switch code {
        case "EUR": return "€"
        case "GBP": return "£"
        case "USD": return "$"
        case "AUD": return "A$"
        default:    return code + " "
        }
    }
}

struct FlightSearchResponse: Codable {
    let ok: Bool
    let data: [FlightOffer]?
    let error: String?
}

// MARK: - Saved Destination

struct SavedDestination: Codable, Identifiable {
    let id: String          // iata
    let cityName: String
    let countryName: String
    let countryCode: String
    let imageUrl: String?
    let theme: String
    let savedAt: Date
}
