import SwiftUI

struct FlightSearchSheet: View {
    let destination: Destination
    @Environment(AppState.self) private var appState
    @Environment(\.dismiss) private var dismiss

    // Search params
    @State private var departureDate = Date.now.addingTimeInterval(7 * 86400)
    @State private var returnDate    = Date.now.addingTimeInterval(14 * 86400)
    @State private var isRoundTrip   = true
    @State private var passengers    = 1
    @State private var travelClass   = FlightSearchRequest.TravelClass.economy
    @State private var showFlexibleDates = false

    // Results
    @State private var offers: [FlightOffer] = []
    @State private var isLoading = false
    @State private var error: String?
    @State private var hasSearched = false
    @State private var showPriceAlert = false

    private var origin: String { appState.originAirport?.code ?? "SYD" }

    var body: some View {
        NavigationStack {
            ZStack {
                Color.sBackground.ignoresSafeArea()

                ScrollView(showsIndicators: false) {
                    VStack(spacing: 20) {
                        // Route header
                        RouteHeader(origin: origin, destination: destination)

                        // Search params
                        SearchParamsCard(
                            departureDate: $departureDate,
                            returnDate: $returnDate,
                            isRoundTrip: $isRoundTrip,
                            passengers: $passengers,
                            travelClass: $travelClass
                        )

                        // Flexible dates button
                        Button {
                            showFlexibleDates = true
                        } label: {
                            HStack {
                                Image(systemName: "calendar.badge.clock")
                                Text("Find cheapest dates")
                                    .fontWeight(.semibold)
                                Spacer()
                                Image(systemName: "chevron.right")
                                    .font(.caption)
                            }
                            .foregroundStyle(Color.sOrange)
                            .padding(14)
                            .background(Color.sSurface)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(Color.sOrange.opacity(0.4), lineWidth: 1)
                            )
                        }

                        // Search button
                        Button(action: { Task { await search() } }) {
                            HStack {
                                if isLoading {
                                    ProgressView().tint(.white)
                                } else {
                                    Image(systemName: "magnifyingglass")
                                    Text("Search Flights")
                                        .fontWeight(.bold)
                                }
                            }
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(
                                LinearGradient(colors: [Color.sOrange, Color.sRed],
                                               startPoint: .leading, endPoint: .trailing)
                            )
                            .clipShape(RoundedRectangle(cornerRadius: 14))
                        }
                        .disabled(isLoading)

                        // Results
                        if let error {
                            ErrorBanner(message: error)
                        } else if hasSearched && offers.isEmpty && !isLoading {
                            EmptyResults()
                        } else {
                            // Price alert CTA (after results load)
                        if !offers.isEmpty {
                            Button {
                                showPriceAlert = true
                            } label: {
                                HStack {
                                    Image(systemName: "bell.badge")
                                    Text("Alert me when prices drop")
                                        .fontWeight(.semibold)
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                }
                                .foregroundStyle(Color.sTextPrimary)
                                .padding(14)
                                .background(Color.sSurface)
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                            }
                        }

                        ForEach(offers) { offer in
                                FlightOfferCard(offer: offer)
                            }
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 40)
                }
            }
            .navigationTitle("Flights to \(destination.cityName)")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                        .foregroundStyle(Color.sOrange)
                }
            }
            .sheet(isPresented: $showPriceAlert) {
                SetPriceAlertView(
                    origin: origin,
                    destination: destination,
                    currentPrice: offers.map(\.price).min(),
                    currency: offers.first?.currency ?? "AUD"
                )
            }
            .sheet(isPresented: $showFlexibleDates) {
                FlexibleDatesView(
                    origin: origin,
                    destination: destination,
                    travelClass: travelClass
                ) { date in
                    departureDate = date
                    if isRoundTrip {
                        returnDate = date.addingTimeInterval(7 * 86400)
                    }
                }
            }
        }
    }

    private func search() async {
        guard !isLoading else { return }
        isLoading = true
        error = nil
        hasSearched = true

        let fmt = DateFormatter()
        fmt.dateFormat = "yyyy-MM-dd"

        let req = FlightSearchRequest(
            origin: origin,
            destination: destination.iata,
            departureDate: fmt.string(from: departureDate),
            returnDate: isRoundTrip ? fmt.string(from: returnDate) : nil,
            passengers: passengers,
            travelClass: travelClass,
            nonStop: false
        )

        do {
            offers = try await SpontraAPI.shared.searchFlights(req)
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }
}

// MARK: - Route Header

private struct RouteHeader: View {
    let origin: String
    let destination: Destination

    var body: some View {
        HStack(spacing: 0) {
            VStack(alignment: .leading) {
                Text(origin)
                    .font(.system(size: 32, weight: .black, design: .monospaced))
                    .foregroundStyle(Color.sTextPrimary)
                Text("Origin")
                    .font(.caption)
                    .foregroundStyle(Color.sTextSecondary)
            }

            Spacer()

            Image(systemName: "airplane")
                .foregroundStyle(Color.sOrange)
                .font(.title2)

            Spacer()

            VStack(alignment: .trailing) {
                Text(destination.iata)
                    .font(.system(size: 32, weight: .black, design: .monospaced))
                    .foregroundStyle(Color.sTextPrimary)
                Text(destination.cityName)
                    .font(.caption)
                    .foregroundStyle(Color.sTextSecondary)
            }
        }
        .padding(20)
        .background(Color.sSurface)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}

// MARK: - Search Params Card

private struct SearchParamsCard: View {
    @Binding var departureDate: Date
    @Binding var returnDate: Date
    @Binding var isRoundTrip: Bool
    @Binding var passengers: Int
    @Binding var travelClass: FlightSearchRequest.TravelClass

    var body: some View {
        VStack(spacing: 0) {
            // Trip type toggle
            HStack(spacing: 0) {
                ForEach(["One-way", "Return"], id: \.self) { label in
                    let isSelected = (label == "Return") == isRoundTrip
                    Button(label) {
                        withAnimation { isRoundTrip = (label == "Return") }
                    }
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(isSelected ? .white : Color.sTextSecondary)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(isSelected ? Color.sOrange : Color.clear)
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                }
            }
            .padding(4)
            .background(Color.sBorder)
            .clipShape(RoundedRectangle(cornerRadius: 10))
            .padding(16)

            Divider().background(Color.sBorder)

            // Dates
            HStack {
                DateParamRow(label: "Depart", date: $departureDate)
                if isRoundTrip {
                    Divider().frame(height: 40).background(Color.sBorder)
                    DateParamRow(label: "Return", date: $returnDate)
                }
            }
            .padding(16)

            Divider().background(Color.sBorder)

            // Passengers + class
            HStack {
                // Passengers stepper
                HStack(spacing: 16) {
                    Text("Passengers")
                        .font(.subheadline)
                        .foregroundStyle(Color.sTextSecondary)
                    Spacer()
                    Button { if passengers > 1 { passengers -= 1 } } label: {
                        Image(systemName: "minus.circle.fill")
                            .foregroundStyle(passengers > 1 ? Color.sOrange : Color.sBorder)
                    }
                    Text("\(passengers)")
                        .font(.headline)
                        .foregroundStyle(Color.sTextPrimary)
                        .frame(minWidth: 24, alignment: .center)
                    Button { if passengers < 9 { passengers += 1 } } label: {
                        Image(systemName: "plus.circle.fill")
                            .foregroundStyle(Color.sOrange)
                    }
                }
                .padding(16)
            }

            Divider().background(Color.sBorder)

            // Travel class picker
            HStack {
                Text("Class")
                    .font(.subheadline)
                    .foregroundStyle(Color.sTextSecondary)
                Spacer()
                Picker("Class", selection: $travelClass) {
                    ForEach(FlightSearchRequest.TravelClass.allCases, id: \.self) {
                        Text($0.displayName).tag($0)
                    }
                }
                .pickerStyle(.menu)
                .tint(Color.sOrange)
            }
            .padding(16)
        }
        .background(Color.sSurface)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}

private struct DateParamRow: View {
    let label: String
    @Binding var date: Date

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label)
                .font(.caption)
                .foregroundStyle(Color.sTextSecondary)
            DatePicker("", selection: $date, displayedComponents: .date)
                .datePickerStyle(.compact)
                .labelsHidden()
                .tint(Color.sOrange)
                .colorScheme(.dark)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

// MARK: - Empty / Error states

private struct ErrorBanner: View {
    let message: String
    var body: some View {
        HStack {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundStyle(Color.sOrange)
            Text(message)
                .font(.subheadline)
                .foregroundStyle(Color.sTextSecondary)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.sSurface)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

private struct EmptyResults: View {
    var body: some View {
        VStack(spacing: 12) {
            Text("✈️")
                .font(.system(size: 48))
            Text("No flights found")
                .font(.headline)
                .foregroundStyle(Color.sTextPrimary)
            Text("Try different dates or remove the non-stop filter")
                .font(.subheadline)
                .foregroundStyle(Color.sTextSecondary)
                .multilineTextAlignment(.center)
        }
        .padding(32)
    }
}
