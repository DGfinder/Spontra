import SwiftUI

struct DurationPickerView: View {
    @Environment(AppState.self) private var appState

    private let options: [(label: String, minutes: Int)] = [
        ("1h", 60), ("2h", 120), ("3h", 180), ("4h", 240), ("5h+", 300)
    ]

    var body: some View {
        @Bindable var state = appState

        VStack(alignment: .leading, spacing: 12) {
            Text("Max flight time")
                .font(.headline)
                .foregroundStyle(Color.sTextPrimary)

            HStack(spacing: 8) {
                ForEach(options, id: \.minutes) { option in
                    let isSelected = appState.maxFlightMinutes == option.minutes

                    Button(option.label) {
                        appState.maxFlightMinutes = option.minutes
                    }
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(isSelected ? .white : Color.sTextSecondary)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(isSelected ? Color.sOrange : Color.sSurface)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                    .overlay(
                        RoundedRectangle(cornerRadius: 10)
                            .stroke(isSelected ? Color.sOrange : Color.sBorder, lineWidth: 1)
                    )
                    .animation(.spring(response: 0.2), value: isSelected)
                }
            }
        }
    }
}
