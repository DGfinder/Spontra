import Foundation
import Observation
import SwiftUI

@Observable
final class SavedStore {
    static let shared = SavedStore()

    private(set) var saved: [SavedDestination] = []

    private let key = "spontra.saved.destinations"

    init() { load() }

    func isSaved(_ iata: String) -> Bool {
        saved.contains { $0.id == iata }
    }

    func remove(_ iata: String) {
        saved.removeAll { $0.id == iata }
        persist()
    }

    func toggle(_ destination: Destination, theme: ThemeSlug, imageUrl: String?) {
        if isSaved(destination.iata) {
            saved.removeAll { $0.id == destination.iata }
        } else {
            let item = SavedDestination(
                id: destination.iata,
                cityName: destination.cityName,
                countryName: destination.countryName,
                countryCode: destination.countryCode,
                imageUrl: imageUrl,
                theme: theme.rawValue,
                savedAt: .now
            )
            saved.insert(item, at: 0)
        }
        persist()
    }

    private func load() {
        guard let data = UserDefaults.standard.data(forKey: key),
              let decoded = try? JSONDecoder().decode([SavedDestination].self, from: data)
        else { return }
        saved = decoded
    }

    private func persist() {
        guard let data = try? JSONEncoder().encode(saved) else { return }
        UserDefaults.standard.set(data, forKey: key)
    }
}
