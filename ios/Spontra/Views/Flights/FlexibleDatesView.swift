import SwiftUI

/// Skyscanner-style cheapest-date grid. Shows a 5-week rolling calendar
/// with relative price tiers so users can spot the cheapest travel window.
struct FlexibleDatesView: View {
    let origin: String
    let destination: Destination
    let travelClass: FlightSearchRequest.TravelClass
    let onDateSelected: (Date) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var priceMap: [String: PriceTier] = [:]
    @State private var isLoading = false
    @State private var selectedDate: Date?

    private let calendar = Calendar.current
    private var weeks: [[Date?]] {
        generateWeeks(from: .now, count: 6)
    }

    var body: some View {
        NavigationStack {
            ZStack {
                Color.sBackground.ignoresSafeArea()

                VStack(spacing: 0) {
                    // Route pill
                    HStack(spacing: 12) {
                        Text(origin)
                            .font(.system(size: 18, weight: .black, design: .monospaced))
                        Image(systemName: "arrow.right")
                            .foregroundStyle(Color.sOrange)
                        Text(destination.iata)
                            .font(.system(size: 18, weight: .black, design: .monospaced))
                        Text("·")
                            .foregroundStyle(Color.sBorder)
                        Text(travelClass.displayName)
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(Color.sTextSecondary)
                    }
                    .foregroundStyle(Color.sTextPrimary)
                    .padding(.vertical, 14)

                    // Day-of-week header
                    DayHeader()
                        .padding(.horizontal, 12)

                    Divider().background(Color.sBorder)

                    if isLoading {
                        Spacer()
                        ProgressView()
                            .tint(Color.sOrange)
                            .scaleEffect(1.3)
                        Spacer()
                    } else {
                        // Calendar grid
                        ScrollView(showsIndicators: false) {
                            VStack(spacing: 2) {
                                ForEach(0..<weeks.count, id: \.self) { wi in
                                    WeekRow(
                                        days: weeks[wi],
                                        priceMap: priceMap,
                                        selectedDate: $selectedDate,
                                        onTap: { date in
                                            withAnimation(.spring(response: 0.2)) {
                                                selectedDate = date
                                            }
                                            UIImpactFeedbackGenerator(style: .light).impactOccurred()
                                        }
                                    )
                                }
                            }
                            .padding(.horizontal, 12)
                            .padding(.top, 8)

                            // Legend
                            PriceLegend()
                                .padding(.horizontal, 20)
                                .padding(.top, 20)
                                .padding(.bottom, 8)
                        }
                    }

                    // CTA
                    if let date = selectedDate {
                        ConfirmBar(date: date) {
                            onDateSelected(date)
                            dismiss()
                        }
                    }
                }
            }
            .navigationTitle("Flexible Dates")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Cancel") { dismiss() }
                        .foregroundStyle(Color.sOrange)
                }
            }
            .task { await loadPrices() }
        }
    }

    // MARK: - Price loading

    private func loadPrices() async {
        isLoading = true
        let fmt = DateFormatter()
        fmt.dateFormat = "yyyy-MM-dd"

        // Fire searches for the next ~5 Fridays to seed the price map
        var prices: [(date: Date, price: Double)] = []
        let fridays = upcomingFridays(count: 8)

        await withTaskGroup(of: (Date, Double?).self) { group in
            for friday in fridays {
                let dateStr = fmt.string(from: friday)
                group.addTask {
                    let req = FlightSearchRequest(
                        origin: origin,
                        destination: destination.iata,
                        departureDate: dateStr,
                        returnDate: nil,
                        passengers: 1,
                        travelClass: travelClass,
                        nonStop: false
                    )
                    let offers = try? await SpontraAPI.shared.searchFlights(req)
                    return (friday, offers?.map(\.price).min())
                }
            }
            for await (date, price) in group {
                if let p = price { prices.append((date, p)) }
            }
        }

        // Build tier map
        guard !prices.isEmpty else { isLoading = false; return }
        let sorted = prices.sorted { $0.price < $1.price }
        let low  = sorted[0].price
        let high = sorted[sorted.count - 1].price
        let mid  = (low + high) / 2

        var map: [String: PriceTier] = [:]
        for (date, price) in prices {
            let tier: PriceTier = price <= low * 1.1 ? .cheap
                                : price <= mid        ? .moderate
                                : price <= high * 0.9 ? .pricey
                                :                       .expensive
            map[fmt.string(from: date)] = tier
        }
        priceMap = map
        isLoading = false
    }

    private func upcomingFridays(count: Int) -> [Date] {
        var result: [Date] = []
        var d = Date.now
        while result.count < count {
            d = d.addingTimeInterval(86400)
            if calendar.component(.weekday, from: d) == 6 { result.append(d) }
        }
        return result
    }

    private func generateWeeks(from start: Date, count: Int) -> [[Date?]] {
        let startOfToday = calendar.startOfDay(for: start)
        var current = startOfToday

        // Rewind to Monday
        let weekday = calendar.component(.weekday, from: current)
        let toMonday = (weekday == 1 ? -6 : 2 - weekday)
        current = calendar.date(byAdding: .day, value: toMonday, to: current)!

        var weeks: [[Date?]] = []
        for _ in 0..<count {
            var week: [Date?] = []
            for d in 0..<7 {
                let day = calendar.date(byAdding: .day, value: d, to: current)!
                week.append(day < startOfToday ? nil : day)
            }
            weeks.append(week)
            current = calendar.date(byAdding: .day, value: 7, to: current)!
        }
        return weeks
    }
}

// MARK: - Price tier

enum PriceTier {
    case cheap, moderate, pricey, expensive

    var color: Color {
        switch self {
        case .cheap:     return Color(hex: "#22c55e")
        case .moderate:  return Color(hex: "#f59e0b")
        case .pricey:    return Color(hex: "#f97316")
        case .expensive: return Color(hex: "#ef4444")
        }
    }

    var label: String {
        switch self {
        case .cheap:     return "Low"
        case .moderate:  return "Mid"
        case .pricey:    return "High"
        case .expensive: return "Peak"
        }
    }
}

// MARK: - Sub-views

private struct DayHeader: View {
    private let days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    var body: some View {
        HStack(spacing: 0) {
            ForEach(days, id: \.self) { day in
                Text(day)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(Color.sTextSecondary)
                    .frame(maxWidth: .infinity)
            }
        }
        .padding(.vertical, 8)
    }
}

private struct WeekRow: View {
    let days: [Date?]
    let priceMap: [String: PriceTier]
    @Binding var selectedDate: Date?
    let onTap: (Date) -> Void

    private let fmt: DateFormatter = {
        let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"; return f
    }()
    private let dayFmt: DateFormatter = {
        let f = DateFormatter(); f.dateFormat = "d"; return f
    }()

    var body: some View {
        HStack(spacing: 2) {
            ForEach(0..<7, id: \.self) { i in
                if let date = days[i] {
                    let key = fmt.string(from: date)
                    let tier = priceMap[key]
                    let isSelected = selectedDate.map { fmt.string(from: $0) == key } ?? false
                    let isToday = Calendar.current.isDateInToday(date)

                    Button { onTap(date) } label: {
                        VStack(spacing: 3) {
                            Text(dayFmt.string(from: date))
                                .font(.system(size: 15, weight: isSelected ? .black : .regular))
                                .foregroundStyle(isSelected ? .white : Color.sTextPrimary)

                            if let tier {
                                Circle()
                                    .fill(tier.color)
                                    .frame(width: 6, height: 6)
                            } else {
                                Circle()
                                    .fill(Color.clear)
                                    .frame(width: 6, height: 6)
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(
                            ZStack {
                                if isSelected {
                                    RoundedRectangle(cornerRadius: 10)
                                        .fill(Color.sOrange)
                                } else if isToday {
                                    RoundedRectangle(cornerRadius: 10)
                                        .stroke(Color.sOrange.opacity(0.5), lineWidth: 1)
                                }
                            }
                        )
                    }
                    .buttonStyle(.plain)
                } else {
                    // Past or padding
                    Color.clear
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                }
            }
        }
    }
}

private struct PriceLegend: View {
    var body: some View {
        HStack(spacing: 16) {
            ForEach([PriceTier.cheap, .moderate, .pricey, .expensive], id: \.label) { tier in
                HStack(spacing: 5) {
                    Circle().fill(tier.color).frame(width: 8, height: 8)
                    Text(tier.label)
                        .font(.caption)
                        .foregroundStyle(Color.sTextSecondary)
                }
            }
        }
    }
}

private struct ConfirmBar: View {
    let date: Date
    let onConfirm: () -> Void

    private let fmt: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "EEE d MMM yyyy"
        return f
    }()

    var body: some View {
        VStack(spacing: 0) {
            Divider().background(Color.sBorder)
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Departing")
                        .font(.caption)
                        .foregroundStyle(Color.sTextSecondary)
                    Text(fmt.string(from: date))
                        .font(.headline)
                        .foregroundStyle(Color.sTextPrimary)
                }
                Spacer()
                Button("Use this date", action: onConfirm)
                    .fontWeight(.bold)
                    .foregroundStyle(.white)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 12)
                    .background(
                        LinearGradient(colors: [Color.sOrange, Color.sRed],
                                       startPoint: .leading, endPoint: .trailing)
                    )
                    .clipShape(Capsule())
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 14)
            .background(Color.sSurface)
        }
    }
}
