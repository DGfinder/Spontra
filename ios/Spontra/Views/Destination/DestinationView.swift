import SwiftUI

struct DestinationView: View {
    let destination: Destination
    let heroImageUrl: String?
    let theme: ThemeSlug

    @Environment(\.dismiss) private var dismiss
    @State private var showFlights = false
    @State private var isSaved = false

    private var savedStore: SavedStore { SavedStore.shared }

    var body: some View {
        NavigationStack {
            ZStack {
                Color.sBackground.ignoresSafeArea()

                ScrollView(showsIndicators: false) {
                    VStack(spacing: 0) {
                        // ── Hero image ──────────────────────────────────────
                        HeroImage(url: heroImageUrl, height: 280)

                        VStack(alignment: .leading, spacing: 24) {
                            // ── Title row ──────────────────────────────────
                            HStack(alignment: .top) {
                                VStack(alignment: .leading, spacing: 6) {
                                    Text(destination.cityName)
                                        .font(.system(size: 32, weight: .black, design: .rounded))
                                        .foregroundStyle(Color.sTextPrimary)

                                    HStack(spacing: 8) {
                                        Text(flag(for: destination.countryCode))
                                        Text(destination.countryName)
                                            .font(.subheadline.weight(.medium))
                                            .foregroundStyle(Color.sTextSecondary)
                                    }
                                }

                                Spacer()

                                // Save button
                                Button {
                                    savedStore.toggle(destination, theme: theme, imageUrl: heroImageUrl)
                                    isSaved = savedStore.isSaved(destination.iata)
                                    UIImpactFeedbackGenerator(style: .rigid).impactOccurred()
                                } label: {
                                    Image(systemName: isSaved ? "bookmark.fill" : "bookmark")
                                        .font(.title2)
                                        .foregroundStyle(isSaved ? Color.sOrange : Color.sTextSecondary)
                                        .frame(width: 44, height: 44)
                                        .background(Color.sSurface)
                                        .clipShape(RoundedRectangle(cornerRadius: 10))
                                }
                            }

                            // ── Quick stats ─────────────────────────────────
                            HStack(spacing: 10) {
                                if let dur = destination.formattedDuration {
                                    StatPill(icon: "airplane", value: dur, label: "flight")
                                }
                                if let price = destination.formattedPrice {
                                    StatPill(icon: "tag", value: "from \(price)", label: "est. fare", highlight: true)
                                }
                                StatPill(icon: "globe", value: destination.countryCode, label: "country")
                            }

                            // ── Vibe section ────────────────────────────────
                            VibeSection(theme: theme, destination: destination)

                            // ── Best time to visit ──────────────────────────
                            BestTimeSection(destination: destination)

                            // ── What to know ───────────────────────────────
                            QuickFactsSection(destination: destination)
                        }
                        .padding(.horizontal, 20)
                        .padding(.top, 20)
                        .padding(.bottom, 120)
                    }
                }

                // ── Sticky CTA ──────────────────────────────────────────────
                VStack {
                    Spacer()
                    StickyFlightCTA(destination: destination) {
                        showFlights = true
                    }
                }
            }
            .ignoresSafeArea(edges: .top)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                        .foregroundStyle(Color.sOrange)
                        .background(.ultraThinMaterial.opacity(0.7))
                        .clipShape(Capsule())
                }
            }
            .sheet(isPresented: $showFlights) {
                FlightSearchSheet(destination: destination)
            }
            .onAppear {
                isSaved = savedStore.isSaved(destination.iata)
            }
        }
    }

    private func flag(for code: String) -> String {
        code.unicodeScalars.compactMap {
            Unicode.Scalar(127397 + $0.value).map(String.init)
        }.joined()
    }
}

// MARK: - Hero Image

private struct HeroImage: View {
    let url: String?
    let height: CGFloat

    var body: some View {
        ZStack(alignment: .bottom) {
            if let urlStr = url, let imageUrl = URL(string: urlStr) {
                AsyncImage(url: imageUrl) { phase in
                    if case .success(let img) = phase {
                        img.resizable().scaledToFill()
                    } else {
                        placeholder
                    }
                }
            } else {
                placeholder
            }
            LinearGradient(
                colors: [.clear, Color.sBackground],
                startPoint: .center, endPoint: .bottom
            )
        }
        .frame(height: height)
        .clipped()
    }

    private var placeholder: some View {
        LinearGradient(
            colors: [Color(hex: "#1e293b"), Color(hex: "#0f172a")],
            startPoint: .top, endPoint: .bottom
        )
    }
}

// MARK: - Stat Pill

private struct StatPill: View {
    let icon: String
    let value: String
    let label: String
    var highlight = false

    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .foregroundStyle(highlight ? Color.sOrange : Color.sTextSecondary)
                .font(.subheadline)
            Text(value)
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(highlight ? Color.sOrange : Color.sTextPrimary)
            Text(label)
                .font(.caption2)
                .foregroundStyle(Color.sTextSecondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(Color.sSurface)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

// MARK: - Vibe Section

private struct VibeSection: View {
    let theme: ThemeSlug
    let destination: Destination

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("The Vibe", systemImage: "sparkles")
                .font(.headline)
                .foregroundStyle(Color.sTextPrimary)

            HStack(spacing: 12) {
                Text(theme.emoji)
                    .font(.system(size: 40))

                VStack(alignment: .leading, spacing: 4) {
                    Text(theme.displayName)
                        .font(.title3.weight(.bold))
                        .foregroundStyle(Color.sTextPrimary)
                    Text(theme.description)
                        .font(.subheadline)
                        .foregroundStyle(Color.sTextSecondary)
                }
            }
            .padding(16)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                LinearGradient(
                    colors: theme.gradient.map { $0.opacity(0.2) } + [Color.sSurface],
                    startPoint: .leading, endPoint: .trailing
                )
            )
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .stroke(theme.gradient[0].opacity(0.3), lineWidth: 1)
            )
        }
    }
}

// MARK: - Best Time Section

private struct BestTimeSection: View {
    let destination: Destination
    private let months = ["J","F","M","A","M","J","J","A","S","O","N","D"]

    // Simple heuristic — in a real app this would come from the API
    private var peakMonths: Set<Int> {
        switch destination.countryCode {
        case "ES", "IT", "GR", "PT": return [6, 7, 8]
        case "TH", "VN", "ID":       return [11, 12, 1, 2]
        case "AU", "NZ":             return [12, 1, 2]
        case "JP":                   return [3, 4, 10, 11]
        default:                     return [6, 7, 8]
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Best Time to Visit", systemImage: "sun.max")
                .font(.headline)
                .foregroundStyle(Color.sTextPrimary)

            HStack(spacing: 4) {
                ForEach(0..<12, id: \.self) { i in
                    let isPeak = peakMonths.contains(i + 1)
                    VStack(spacing: 4) {
                        RoundedRectangle(cornerRadius: 4)
                            .fill(isPeak ? Color.sOrange : Color.sSurface)
                            .frame(height: isPeak ? 28 : 14)
                        Text(months[i])
                            .font(.system(size: 9, weight: .semibold))
                            .foregroundStyle(Color.sTextSecondary)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
            .padding(12)
            .background(Color.sSurface)
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }
}

// MARK: - Quick Facts

private struct QuickFactsSection: View {
    let destination: Destination

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Quick Facts", systemImage: "info.circle")
                .font(.headline)
                .foregroundStyle(Color.sTextPrimary)

            VStack(spacing: 0) {
                FactRow(label: "Airport", value: destination.iata)
                Divider().background(Color.sBorder).padding(.leading, 16)
                FactRow(label: "Country", value: destination.countryName)
                Divider().background(Color.sBorder).padding(.leading, 16)
                if let dur = destination.formattedDuration {
                    FactRow(label: "Flight time", value: dur)
                    Divider().background(Color.sBorder).padding(.leading, 16)
                }
                if let price = destination.formattedPrice {
                    FactRow(label: "Est. from", value: price)
                }
            }
            .background(Color.sSurface)
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }
}

private struct FactRow: View {
    let label: String
    let value: String
    var body: some View {
        HStack {
            Text(label)
                .font(.subheadline)
                .foregroundStyle(Color.sTextSecondary)
            Spacer()
            Text(value)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(Color.sTextPrimary)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
    }
}

// MARK: - Sticky CTA

private struct StickyFlightCTA: View {
    let destination: Destination
    let action: () -> Void

    var body: some View {
        VStack(spacing: 0) {
            Divider().background(Color.sBorder)
            HStack(spacing: 12) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Ready to fly?")
                        .font(.caption)
                        .foregroundStyle(Color.sTextSecondary)
                    if let price = destination.formattedPrice {
                        Text("From \(price)")
                            .font(.headline)
                            .foregroundStyle(Color.sTextPrimary)
                    } else {
                        Text("Check prices")
                            .font(.headline)
                            .foregroundStyle(Color.sTextPrimary)
                    }
                }
                Spacer()
                Button(action: action) {
                    HStack(spacing: 6) {
                        Image(systemName: "airplane.departure")
                        Text("Search Flights")
                            .fontWeight(.bold)
                    }
                    .foregroundStyle(.white)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 14)
                    .background(
                        LinearGradient(colors: [Color.sOrange, Color.sRed],
                                       startPoint: .leading, endPoint: .trailing)
                    )
                    .clipShape(Capsule())
                }
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 14)
            .background(.ultraThinMaterial)
        }
    }
}
