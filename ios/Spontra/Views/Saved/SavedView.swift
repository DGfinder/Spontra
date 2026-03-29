import SwiftUI

struct SavedView: View {
    @State private var store = SavedStore.shared
    @State private var alertStore = PriceAlertStore.shared
    @State private var selectedDestination: Destination?
    @State private var flightSearch: Destination?
    @State private var tab = 0

    var body: some View {
        NavigationStack {
            ZStack {
                Color.sBackground.ignoresSafeArea()

                VStack(spacing: 0) {
                    // Segment control
                    Picker("", selection: $tab) {
                        Text("Saved (\(store.saved.count))").tag(0)
                        Text("Alerts (\(alertStore.alerts.count))").tag(1)
                    }
                    .pickerStyle(.segmented)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)

                    if tab == 0 {
                        if store.saved.isEmpty {
                            EmptySavedView()
                        } else {
                            ScrollView {
                                LazyVGrid(
                                    columns: [GridItem(.flexible()), GridItem(.flexible())],
                                    spacing: 12
                                ) {
                                    ForEach(store.saved) { saved in
                                        SavedCard(saved: saved) {
                                            flightSearch = Destination(
                                                iata: saved.id,
                                                cityName: saved.cityName,
                                                countryName: saved.countryName,
                                                countryCode: saved.countryCode,
                                                flightDurationMinutes: nil,
                                                estimatedPrice: nil,
                                                currency: "€"
                                            )
                                        } onRemove: {
                                            withAnimation {
                                                store.remove(saved.id)
                                            }
                                        }
                                    }
                                }
                                .padding(16)
                            }
                        }
                    } else {
                        PriceAlertsListView()
                    }
                }
            }
            .navigationTitle("Saved")
            .navigationBarTitleDisplayMode(.large)
            .toolbarColorScheme(.dark, for: .navigationBar)
        }
        .sheet(item: $flightSearch) { dest in
            FlightSearchSheet(destination: dest)
        }
    }
}

// MARK: - Saved Card

private struct SavedCard: View {
    let saved: SavedDestination
    let onFly: () -> Void
    let onRemove: () -> Void

    var body: some View {
        ZStack(alignment: .bottom) {
            // Background
            if let urlStr = saved.imageUrl, let url = URL(string: urlStr) {
                AsyncImage(url: url) { phase in
                    if case .success(let img) = phase {
                        img.resizable().scaledToFill()
                    } else {
                        placeholderBg
                    }
                }
            } else {
                placeholderBg
            }

            // Gradient + text
            LinearGradient(
                colors: [.clear, .black.opacity(0.75)],
                startPoint: .center, endPoint: .bottom
            )

            VStack(alignment: .leading, spacing: 3) {
                Text(saved.cityName)
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(.white)
                    .lineLimit(1)
                Text(saved.countryName)
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.75))
                    .lineLimit(1)

                HStack(spacing: 6) {
                    Button(action: onFly) {
                        Text("Fly")
                            .font(.caption.weight(.bold))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 5)
                            .background(Color.sOrange)
                            .clipShape(Capsule())
                    }

                    Button(action: onRemove) {
                        Image(systemName: "bookmark.slash")
                            .font(.caption)
                            .foregroundStyle(.white.opacity(0.7))
                    }
                }
                .padding(.top, 4)
            }
            .padding(10)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .frame(height: 160)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private var placeholderBg: some View {
        LinearGradient(
            colors: [Color(hex: "#1e293b"), Color(hex: "#0f172a")],
            startPoint: .top, endPoint: .bottom
        )
    }
}

// MARK: - Empty state

private struct EmptySavedView: View {
    var body: some View {
        VStack(spacing: 16) {
            Text("🔖")
                .font(.system(size: 64))
            Text("No saved destinations")
                .font(.title3.weight(.semibold))
                .foregroundStyle(Color.sTextPrimary)
            Text("Double-tap a destination or hit the bookmark button to save it")
                .font(.subheadline)
                .foregroundStyle(Color.sTextSecondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
        }
    }
}
