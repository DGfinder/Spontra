import Foundation

enum APIError: LocalizedError {
    case invalidURL
    case badResponse(Int)
    case decodingError(Error)
    case networkError(Error)

    var errorDescription: String? {
        switch self {
        case .invalidURL:           return "Invalid URL"
        case .badResponse(let c):   return "Server error (\(c))"
        case .decodingError(let e): return "Decode failed: \(e.localizedDescription)"
        case .networkError(let e):  return e.localizedDescription
        }
    }
}

final class SpontraAPI {
    static let shared = SpontraAPI()

    #if DEBUG
    let baseURL        = "http://localhost:3000"
    var bookingBaseURL: String { baseURL }
    #else
    let baseURL        = "https://spontra.vercel.app"
    var bookingBaseURL: String { baseURL }
    #endif

    private let decoder: JSONDecoder = {
        let d = JSONDecoder()
        d.keyDecodingStrategy = .useDefaultKeys
        return d
    }()

    // MARK: - Feed

    func fetchFeed(
        origin: String,
        theme: ThemeSlug,
        minFlightMinutes: Int = 0,
        maxFlightMinutes: Int = 180,
        limit: Int = 20
    ) async throws -> [FeedItem] {
        var components = URLComponents(string: "\(baseURL)/api/feed")!
        components.queryItems = [
            .init(name: "origin", value: origin),
            .init(name: "theme", value: theme.rawValue),
            .init(name: "minFlightMinutes", value: "\(minFlightMinutes)"),
            .init(name: "maxFlightMinutes", value: "\(maxFlightMinutes)"),
            .init(name: "limit", value: "\(limit)"),
        ]
        guard let url = components.url else { throw APIError.invalidURL }

        let (data, response) = try await URLSession.shared.data(from: url)
        guard let http = response as? HTTPURLResponse else { throw APIError.badResponse(0) }
        guard (200..<300).contains(http.statusCode) else { throw APIError.badResponse(http.statusCode) }

        do {
            let decoded = try decoder.decode(FeedResponse.self, from: data)
            return decoded.data
        } catch {
            throw APIError.decodingError(error)
        }
    }

    // MARK: - Flight Search

    func searchFlights(_ req: FlightSearchRequest) async throws -> [FlightOffer] {
        var components = URLComponents(string: "\(baseURL)/api/amadeus/flights")!
        var items: [URLQueryItem] = [
            .init(name: "origin",        value: req.origin),
            .init(name: "destination",   value: req.destination),
            .init(name: "departureDate", value: req.departureDate),
            .init(name: "passengers",    value: "\(req.passengers)"),
            .init(name: "travelClass",   value: req.travelClass.rawValue),
            .init(name: "nonStop",       value: req.nonStop ? "true" : "false"),
        ]
        if let ret = req.returnDate { items.append(.init(name: "returnDate", value: ret)) }
        components.queryItems = items
        guard let url = components.url else { throw APIError.invalidURL }

        let (data, response) = try await URLSession.shared.data(from: url)
        guard let http = response as? HTTPURLResponse,
              (200..<300).contains(http.statusCode) else {
            throw APIError.badResponse((response as? HTTPURLResponse)?.statusCode ?? 0)
        }

        do {
            let decoded = try decoder.decode(FlightSearchResponse.self, from: data)
            return decoded.data ?? []
        } catch {
            throw APIError.decodingError(error)
        }
    }

    // MARK: - Airport Search

    func searchAirports(query: String) async throws -> [Airport] {
        guard query.count >= 2 else { return [] }

        var components = URLComponents(string: "\(baseURL)/api/airports/search")!
        components.queryItems = [.init(name: "q", value: query)]
        guard let url = components.url else { throw APIError.invalidURL }

        let (data, response) = try await URLSession.shared.data(from: url)
        guard let http = response as? HTTPURLResponse,
              (200..<300).contains(http.statusCode) else { return [] }

        do {
            let decoded = try decoder.decode(AirportSearchResponse.self, from: data)
            return decoded.data
        } catch {
            return []
        }
    }
}
