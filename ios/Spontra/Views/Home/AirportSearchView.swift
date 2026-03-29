import SwiftUI

struct AirportSearchView: View {
    @Environment(AppState.self) private var appState
    @State private var query = ""
    @State private var results: [Airport] = []
    @State private var isSearching = false
    @State private var showResults = false

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Flying from")
                .font(.headline)
                .foregroundStyle(Color.sTextPrimary)

            // Selected airport pill
            if let airport = appState.originAirport {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(airport.code)
                            .font(.system(size: 22, weight: .bold, design: .monospaced))
                            .foregroundStyle(Color.sTextPrimary)
                        Text("\(airport.city), \(airport.country)")
                            .font(.caption)
                            .foregroundStyle(Color.sTextSecondary)
                    }
                    Spacer()
                    Button {
                        appState.originAirport = nil
                        query = ""
                        showResults = false
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundStyle(Color.sTextSecondary)
                    }
                }
                .padding(16)
                .background(Color.sSurface)
                .clipShape(RoundedRectangle(cornerRadius: 12))
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color.sOrange.opacity(0.5), lineWidth: 1.5)
                )
            } else {
                // Search field
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundStyle(Color.sTextSecondary)
                    TextField("", text: $query, prompt: Text("Search airports…").foregroundStyle(Color.sTextSecondary))
                        .foregroundStyle(Color.sTextPrimary)
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.characters)
                    if isSearching {
                        ProgressView().scaleEffect(0.7)
                    }
                }
                .padding(14)
                .background(Color.sSurface)
                .clipShape(RoundedRectangle(cornerRadius: 12))
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color.sBorder, lineWidth: 1)
                )
                .onChange(of: query) { _, new in
                    Task { await search(query: new) }
                }

                // Results
                if showResults && !results.isEmpty {
                    VStack(spacing: 0) {
                        ForEach(results.prefix(6)) { airport in
                            Button {
                                appState.originAirport = airport
                                query = ""
                                results = []
                                showResults = false
                            } label: {
                                HStack {
                                    Text(airport.code)
                                        .font(.system(size: 16, weight: .bold, design: .monospaced))
                                        .foregroundStyle(Color.sTextPrimary)
                                        .frame(width: 44, alignment: .leading)
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(airport.name)
                                            .font(.subheadline)
                                            .foregroundStyle(Color.sTextPrimary)
                                            .lineLimit(1)
                                        Text("\(airport.city), \(airport.country)")
                                            .font(.caption)
                                            .foregroundStyle(Color.sTextSecondary)
                                    }
                                    Spacer()
                                }
                                .padding(.horizontal, 16)
                                .padding(.vertical, 12)
                            }
                            if airport.id != results.prefix(6).last?.id {
                                Divider().background(Color.sBorder)
                            }
                        }
                    }
                    .background(Color.sSurface)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.sBorder, lineWidth: 1)
                    )
                }
            }
        }
    }

    private func search(query: String) async {
        guard query.count >= 2 else {
            results = []
            showResults = false
            return
        }
        // Debounce: wait 300ms
        try? await Task.sleep(for: .milliseconds(300))
        guard !Task.isCancelled else { return }

        isSearching = true
        results = (try? await SpontraAPI.shared.searchAirports(query: query)) ?? []
        showResults = true
        isSearching = false
    }
}
