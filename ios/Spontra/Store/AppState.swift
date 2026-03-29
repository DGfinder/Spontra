import SwiftUI
import Observation

@Observable
final class AppState {
    // MARK: - Search params
    var originAirport: Airport?
    var selectedTheme: ThemeSlug?
    var maxFlightMinutes: Int = 180

    // MARK: - Feed
    var feedItems: [FeedItem] = []
    var isLoadingFeed = false
    var feedError: String?
    var currentFeedIndex = 0

    // MARK: - Selected destination (for detail view)
    var selectedDestination: Destination?

    // MARK: - Computed
    var canExplore: Bool {
        originAirport != nil && selectedTheme != nil
    }

    // MARK: - Actions

    @MainActor
    func loadFeed() async {
        guard let origin = originAirport, let theme = selectedTheme else { return }

        isLoadingFeed = true
        feedError = nil
        currentFeedIndex = 0

        do {
            feedItems = try await SpontraAPI.shared.fetchFeed(
                origin: origin.code,
                theme: theme,
                maxFlightMinutes: maxFlightMinutes
            )
        } catch {
            feedError = error.localizedDescription
        }

        isLoadingFeed = false
    }

    func reset() {
        feedItems = []
        feedError = nil
        currentFeedIndex = 0
        selectedDestination = nil
    }
}
