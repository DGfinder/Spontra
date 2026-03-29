import SwiftUI

struct ThemePickerView: View {
    @Environment(AppState.self) private var appState

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("What's the vibe?")
                .font(.headline)
                .foregroundStyle(Color.sTextPrimary)

            VStack(spacing: 10) {
                ForEach(ThemeSlug.allCases, id: \.self) { theme in
                    ThemeCardView(theme: theme, isSelected: appState.selectedTheme == theme) {
                        withAnimation(.spring(response: 0.25)) {
                            appState.selectedTheme = theme
                        }
                    }
                }
            }
        }
    }
}

private struct ThemeCardView: View {
    let theme: ThemeSlug
    let isSelected: Bool
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 16) {
                Text(theme.emoji)
                    .font(.system(size: 32))

                VStack(alignment: .leading, spacing: 3) {
                    Text(theme.displayName)
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(.white)
                    Text(theme.description)
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.75))
                }
                Spacer()

                Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                    .foregroundStyle(.white.opacity(isSelected ? 1 : 0.4))
                    .font(.title3)
            }
            .padding(16)
            .background(
                Group {
                    if isSelected {
                        LinearGradient(
                            colors: theme.gradient,
                            startPoint: .leading, endPoint: .trailing
                        )
                    } else {
                        LinearGradient(
                            colors: [Color.sSurface, Color.sSurface],
                            startPoint: .leading, endPoint: .trailing
                        )
                    }
                }
            )
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(isSelected ? .white.opacity(0.3) : Color.sBorder, lineWidth: 1.5)
            )
            .scaleEffect(isSelected ? 1.02 : 1.0)
        }
        .buttonStyle(.plain)
    }
}
