import SwiftUI
import UserNotifications

// MARK: - Model

struct PriceAlert: Codable, Identifiable {
    let id: String
    let origin: String
    let destination: Destination
    let targetPrice: Double
    let currency: String
    let travelClass: String
    let createdAt: Date
    var lastCheckedPrice: Double?
    var isTriggered: Bool

    var formattedTarget: String {
        let sym = currency == "EUR" ? "€" : currency == "GBP" ? "£" : "$"
        return "\(sym)\(Int(targetPrice))"
    }
}

// MARK: - Store

@Observable
final class PriceAlertStore {
    static let shared = PriceAlertStore()

    private(set) var alerts: [PriceAlert] = []
    private let key = "spontra.price.alerts"

    init() { load() }

    func add(origin: String, destination: Destination, targetPrice: Double, currency: String, travelClass: String) {
        let alert = PriceAlert(
            id: UUID().uuidString,
            origin: origin,
            destination: destination,
            targetPrice: targetPrice,
            currency: currency,
            travelClass: travelClass,
            createdAt: .now,
            lastCheckedPrice: nil,
            isTriggered: false
        )
        alerts.insert(alert, at: 0)
        persist()
        requestNotificationPermission()
    }

    func remove(_ id: String) {
        alerts.removeAll { $0.id == id }
        persist()
    }

    func requestNotificationPermission() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { _, _ in }
    }

    func sendTestNotification(destination: String, price: String) {
        let content = UNMutableNotificationContent()
        content.title = "✈️ Price Drop Alert"
        content.body  = "Flights to \(destination) are now \(price)!"
        content.sound = .default

        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        let request = UNNotificationRequest(identifier: UUID().uuidString, content: content, trigger: trigger)
        UNUserNotificationCenter.current().add(request)
    }

    private func load() {
        guard let data = UserDefaults.standard.data(forKey: key),
              let decoded = try? JSONDecoder().decode([PriceAlert].self, from: data)
        else { return }
        alerts = decoded
    }

    private func persist() {
        guard let data = try? JSONEncoder().encode(alerts) else { return }
        UserDefaults.standard.set(data, forKey: key)
    }
}

// MARK: - Set Alert Sheet

struct SetPriceAlertView: View {
    let origin: String
    let destination: Destination
    let currentPrice: Double?
    let currency: String

    @Environment(\.dismiss) private var dismiss
    @State private var targetPrice: Double
    @State private var travelClass = FlightSearchRequest.TravelClass.economy
    @State private var alertSet = false

    private var store: PriceAlertStore { PriceAlertStore.shared }

    init(origin: String, destination: Destination, currentPrice: Double?, currency: String) {
        self.origin       = origin
        self.destination  = destination
        self.currentPrice = currentPrice
        self.currency     = currency
        // Default target = 20% below current, or 200 fallback
        _targetPrice = State(initialValue: (currentPrice ?? 250) * 0.8)
    }

    private var currencySymbol: String {
        currency == "EUR" ? "€" : currency == "GBP" ? "£" : "$"
    }

    var body: some View {
        NavigationStack {
            ZStack {
                Color.sBackground.ignoresSafeArea()

                VStack(spacing: 28) {
                    // Header
                    VStack(spacing: 8) {
                        Text("🔔")
                            .font(.system(size: 56))
                        Text("Price Alert")
                            .font(.system(size: 28, weight: .black, design: .rounded))
                            .foregroundStyle(Color.sTextPrimary)
                        Text("Notify me when \(origin) → \(destination.cityName) drops below:")
                            .font(.subheadline)
                            .foregroundStyle(Color.sTextSecondary)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal)
                    }

                    // Price input
                    VStack(spacing: 8) {
                        HStack(alignment: .center, spacing: 4) {
                            Text(currencySymbol)
                                .font(.system(size: 40, weight: .bold))
                                .foregroundStyle(Color.sOrange)
                            TextField("", value: $targetPrice, format: .number.precision(.fractionLength(0)))
                                .keyboardType(.numberPad)
                                .font(.system(size: 52, weight: .black, design: .rounded))
                                .foregroundStyle(Color.sTextPrimary)
                                .multilineTextAlignment(.center)
                                .frame(width: 140)
                        }

                        if let current = currentPrice {
                            Text("Current price: \(currencySymbol)\(Int(current))")
                                .font(.caption)
                                .foregroundStyle(Color.sTextSecondary)
                        }

                        // Slider
                        Slider(
                            value: $targetPrice,
                            in: 50...(currentPrice.map { $0 * 1.5 } ?? 1000),
                            step: 10
                        )
                        .tint(Color.sOrange)
                        .padding(.horizontal, 32)
                    }

                    // Class picker
                    HStack {
                        Text("Cabin class")
                            .foregroundStyle(Color.sTextSecondary)
                        Spacer()
                        Picker("", selection: $travelClass) {
                            ForEach(FlightSearchRequest.TravelClass.allCases, id: \.self) {
                                Text($0.displayName).tag($0)
                            }
                        }
                        .tint(Color.sOrange)
                    }
                    .padding(16)
                    .background(Color.sSurface)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .padding(.horizontal, 20)

                    // Set alert button
                    if alertSet {
                        HStack(spacing: 10) {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundStyle(Color(hex: "#22c55e"))
                            Text("Alert set! We'll notify you.")
                                .fontWeight(.semibold)
                                .foregroundStyle(Color.sTextPrimary)
                        }
                        .padding()
                        .frame(maxWidth: .infinity)
                        .background(Color(hex: "#22c55e").opacity(0.15))
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                        .padding(.horizontal, 20)
                    } else {
                        Button {
                            store.add(
                                origin: origin,
                                destination: destination,
                                targetPrice: targetPrice,
                                currency: currency,
                                travelClass: travelClass.rawValue
                            )
                            // Demo: fire a test notification
                            store.sendTestNotification(
                                destination: destination.cityName,
                                price: "\(currencySymbol)\(Int(targetPrice))"
                            )
                            withAnimation { alertSet = true }
                            DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) { dismiss() }
                        } label: {
                            HStack {
                                Image(systemName: "bell.badge.fill")
                                Text("Set Alert for \(currencySymbol)\(Int(targetPrice))")
                                    .fontWeight(.bold)
                            }
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 18)
                            .background(
                                LinearGradient(colors: [Color.sOrange, Color.sRed],
                                               startPoint: .leading, endPoint: .trailing)
                            )
                            .clipShape(RoundedRectangle(cornerRadius: 16))
                        }
                        .padding(.horizontal, 20)
                    }

                    Spacer()
                }
                .padding(.top, 32)
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Cancel") { dismiss() }.foregroundStyle(Color.sOrange)
                }
            }
        }
    }
}

// MARK: - Alerts list (for Saved tab or Settings)

struct PriceAlertsListView: View {
    @State private var store = PriceAlertStore.shared

    var body: some View {
        ZStack {
            Color.sBackground.ignoresSafeArea()

            if store.alerts.isEmpty {
                VStack(spacing: 12) {
                    Text("🔔").font(.system(size: 48))
                    Text("No price alerts")
                        .font(.headline).foregroundStyle(Color.sTextPrimary)
                    Text("Set an alert on any flight to get notified when prices drop")
                        .font(.subheadline).foregroundStyle(Color.sTextSecondary)
                        .multilineTextAlignment(.center).padding(.horizontal, 40)
                }
            } else {
                List {
                    ForEach(store.alerts) { alert in
                        AlertRow(alert: alert)
                            .listRowBackground(Color.sSurface)
                    }
                    .onDelete { idx in
                        idx.forEach { store.remove(store.alerts[$0].id) }
                    }
                }
                .listStyle(.plain)
                .scrollContentBackground(.hidden)
            }
        }
        .navigationTitle("Price Alerts")
        .navigationBarTitleDisplayMode(.large)
    }
}

private struct AlertRow: View {
    let alert: PriceAlert

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 6) {
                    Text(alert.origin)
                        .font(.system(size: 14, weight: .bold, design: .monospaced))
                        .foregroundStyle(Color.sTextPrimary)
                    Image(systemName: "arrow.right")
                        .font(.caption2)
                        .foregroundStyle(Color.sTextSecondary)
                    Text(alert.destination.iata)
                        .font(.system(size: 14, weight: .bold, design: .monospaced))
                        .foregroundStyle(Color.sTextPrimary)
                }
                Text(alert.destination.cityName)
                    .font(.caption)
                    .foregroundStyle(Color.sTextSecondary)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 2) {
                Text("Alert at")
                    .font(.caption2)
                    .foregroundStyle(Color.sTextSecondary)
                Text(alert.formattedTarget)
                    .font(.headline.weight(.bold))
                    .foregroundStyle(Color.sOrange)
            }
        }
        .padding(.vertical, 6)
    }
}
