import SwiftUI

struct FlightOfferCard: View {
    let offer: FlightOffer

    private func openBooking() {
        var comps = URLComponents(string: "\(SpontraAPI.shared.bookingBaseURL)/api/book")!
        var items: [URLQueryItem] = [
            .init(name: "origin",      value: offer.origin),
            .init(name: "destination", value: offer.destination),
            .init(name: "date",        value: offer.departureDate),
            .init(name: "passengers",  value: "\(offer.adults)"),
            .init(name: "class",       value: offer.travelClass.uppercased()),
            .init(name: "carrier",     value: offer.carrierCode),
            .init(name: "price",       value: "\(Int(offer.price))"),
            .init(name: "currency",    value: offer.currency),
            .init(name: "source",      value: "ios"),
        ]
        if let ret = offer.returnDate { items.append(.init(name: "returnDate", value: ret)) }
        comps.queryItems = items
        guard let url = comps.url else { return }
        UIApplication.shared.open(url)
    }

    var body: some View {
        VStack(spacing: 0) {
            // Main row: times + route
            HStack(alignment: .center, spacing: 0) {
                // Departure
                VStack(alignment: .leading, spacing: 2) {
                    Text(offer.formattedDeparture)
                        .font(.system(size: 22, weight: .bold, design: .rounded))
                        .foregroundStyle(Color.sTextPrimary)
                    Text(offer.origin)
                        .font(.caption.weight(.medium))
                        .foregroundStyle(Color.sTextSecondary)
                }

                Spacer()

                // Route line
                VStack(spacing: 4) {
                    Text(offer.formattedDuration)
                        .font(.caption)
                        .foregroundStyle(Color.sTextSecondary)

                    HStack(spacing: 4) {
                        Circle()
                            .frame(width: 5, height: 5)
                            .foregroundStyle(Color.sBorder)
                        Rectangle()
                            .frame(height: 1)
                            .foregroundStyle(Color.sBorder)
                        Image(systemName: "airplane")
                            .font(.system(size: 12))
                            .foregroundStyle(Color.sOrange)
                        Rectangle()
                            .frame(height: 1)
                            .foregroundStyle(Color.sBorder)
                        Circle()
                            .frame(width: 5, height: 5)
                            .foregroundStyle(Color.sBorder)
                    }
                    .frame(width: 120)

                    Text(offer.stopsLabel)
                        .font(.caption)
                        .foregroundStyle(offer.stops == 0 ? Color.sOrange : Color.sTextSecondary)
                }

                Spacer()

                // Arrival
                VStack(alignment: .trailing, spacing: 2) {
                    Text(offer.formattedArrival)
                        .font(.system(size: 22, weight: .bold, design: .rounded))
                        .foregroundStyle(Color.sTextPrimary)
                    Text(offer.destination)
                        .font(.caption.weight(.medium))
                        .foregroundStyle(Color.sTextSecondary)
                }
            }
            .padding(.horizontal, 16)
            .padding(.top, 16)

            // Divider
            Divider()
                .background(Color.sBorder)
                .padding(.horizontal, 16)
                .padding(.vertical, 12)

            // Footer: carrier + price + book
            HStack {
                // Carrier
                HStack(spacing: 8) {
                    // Airline logo placeholder
                    ZStack {
                        RoundedRectangle(cornerRadius: 6)
                            .fill(Color.sBorder)
                            .frame(width: 32, height: 32)
                        Text(offer.carrierCode)
                            .font(.system(size: 9, weight: .bold))
                            .foregroundStyle(Color.sTextSecondary)
                    }
                    VStack(alignment: .leading, spacing: 1) {
                        Text(offer.carrierCode + offer.flightNumber)
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(Color.sTextPrimary)
                        Text(offer.travelClass.capitalized)
                            .font(.caption2)
                            .foregroundStyle(Color.sTextSecondary)
                    }
                }

                Spacer()

                // Price + book
                HStack(spacing: 12) {
                    VStack(alignment: .trailing, spacing: 1) {
                        Text(offer.formattedPrice)
                            .font(.system(size: 20, weight: .black))
                            .foregroundStyle(Color.sTextPrimary)
                        Text("per person")
                            .font(.caption2)
                            .foregroundStyle(Color.sTextSecondary)
                    }

                    Button("Book") {
                        openBooking()
                    }
                    .font(.subheadline.weight(.bold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(
                        LinearGradient(colors: [Color.sOrange, Color.sRed],
                                       startPoint: .leading, endPoint: .trailing)
                    )
                    .clipShape(Capsule())
                }
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 16)
        }
        .background(Color.sSurface)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.sBorder, lineWidth: 1)
        )
    }
}
