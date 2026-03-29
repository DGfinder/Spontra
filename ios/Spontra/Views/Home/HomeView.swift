import SwiftUI

// iOS 26 / Liquid Glass design language
// Spontra home: content-first, glass floats over the world, form appears as you need it

struct HomeView: View {
    @Environment(AppState.self) private var appState
    let onExplore: () -> Void

    @State private var heroIndex = 0
    @State private var heroOpacity: Double = 1
    @State private var showSheet = false
    @State private var appearedOnce = false

    private let heroImages = [
        "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1200", // Paris
        "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200", // Bali
        "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1200", // Tokyo
        "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1200", // Santorini
        "https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=1200", // Northern lights
    ]

    var accentGradient: [Color] {
        appState.selectedTheme?.gradient ?? [Color.sOrange, Color.sRed]
    }

    var body: some View {
        ZStack {
            // ── Full-bleed cycling background ──────────────────────────────
            ForEach(heroImages.indices, id: \.self) { i in
                AsyncImage(url: URL(string: heroImages[i])) { phase in
                    if case .success(let img) = phase {
                        img.resizable().scaledToFill()
                    } else { Color(hex: "#0a0a0a") }
                }
                .ignoresSafeArea()
                .opacity(i == heroIndex ? 1 : 0)
                .animation(.easeInOut(duration: 1.4), value: heroIndex)
            }

            // ── Vignette (dark edges, light centre) ──────────────────────
            RadialGradient(
                colors: [.clear, .black.opacity(0.6)],
                center: .center,
                startRadius: 80,
                endRadius: 450
            ).ignoresSafeArea()

            // ── Bottom dark lift ──────────────────────────────────────────
            LinearGradient(
                colors: [.clear, .black.opacity(0.9)],
                startPoint: UnitPoint(x: 0.5, y: 0.4),
                endPoint: .bottom
            ).ignoresSafeArea()

            // ── Theme colour wash ─────────────────────────────────────────
            if let theme = appState.selectedTheme {
                LinearGradient(
                    colors: theme.gradient.map { $0.opacity(0.22) } + [.clear],
                    startPoint: .bottomLeading,
                    endPoint: .topTrailing
                )
                .ignoresSafeArea()
                .animation(.easeInOut(duration: 0.7), value: appState.selectedTheme)
            }

            // ── UI ────────────────────────────────────────────────────────
            VStack(spacing: 0) {

                // Wordmark — top
                HStack {
                    Text("spontra")
                        .font(.system(size: 18, weight: .black, design: .rounded))
                        .foregroundStyle(.white.opacity(0.9))
                        .tracking(-0.5)
                    Spacer()
                }
                .padding(.horizontal, 28)
                .padding(.top, 60)

                Spacer()

                // ── Hero tagline ──────────────────────────────────────────
                VStack(alignment: .leading, spacing: 10) {
                    if let theme = appState.selectedTheme {
                        HStack(spacing: 6) {
                            Text(theme.emoji).font(.system(size: 14))
                            Text(theme.displayName.uppercased())
                                .font(.system(size: 11, weight: .bold))
                                .tracking(2.5)
                                .foregroundStyle(.white.opacity(0.7))
                        }
                        .transition(.opacity.combined(with: .scale(scale: 0.95)))
                    }

                    Text(heroHeadline)
                        .font(.system(size: 44, weight: .black, design: .rounded))
                        .foregroundStyle(.white)
                        .lineSpacing(2)
                        .shadow(color: .black.opacity(0.3), radius: 8)
                        .animation(.spring(response: 0.45), value: appState.selectedTheme)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 28)
                .padding(.bottom, 24)

                // ── Theme pills ───────────────────────────────────────────
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 10) {
                        ForEach(ThemeSlug.allCases, id: \.self) { theme in
                            GlassThemePill(
                                theme: theme,
                                isSelected: appState.selectedTheme == theme
                            ) {
                                withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                                    appState.selectedTheme = theme
                                    showSheet = true
                                }
                                UIImpactFeedbackGenerator(style: .light).impactOccurred()
                            }
                        }
                    }
                    .padding(.horizontal, 28)
                    .padding(.vertical, 2)
                }
                .padding(.bottom, 16)

                // ── Glass search panel (slides in after theme pick) ────────
                if showSheet {
                    GlassSearchPanel(accentGradient: accentGradient, onExplore: onExplore)
                        .padding(.horizontal, 18)
                        .padding(.bottom, 44)
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                } else {
                    Text("pick a vibe")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(.white.opacity(0.4))
                        .tracking(1.5)
                        .padding(.bottom, 52)
                }
            }
            .animation(.spring(response: 0.4, dampingFraction: 0.85), value: showSheet)
        }
        .onAppear {
            guard !appearedOnce else { return }
            appearedOnce = true
            startCycle()
        }
    }

    private var heroHeadline: String {
        switch appState.selectedTheme {
        case .adventure: return "Ready to push\nyour limits?"
        case .nature:    return "Find your\nwild escape"
        case .vibe:      return "Where's the\nparty at?"
        case .indulge:   return "You deserve\nthis trip"
        case .discover:  return "Something new\nawaits you"
        case nil:        return "Where do you\nwant to feel?"
        }
    }

    private func startCycle() {
        Timer.scheduledTimer(withTimeInterval: 5, repeats: true) { _ in
            withAnimation { heroOpacity = 0 }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.7) {
                heroIndex = (heroIndex + 1) % heroImages.count
                withAnimation { heroOpacity = 1 }
            }
        }
    }
}

// MARK: - Glass Theme Pill

private struct GlassThemePill: View {
    let theme: ThemeSlug
    let isSelected: Bool
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 7) {
                Text(theme.emoji).font(.system(size: 16))
                Text(theme.displayName)
                    .font(.system(size: 14, weight: .semibold))
            }
            .foregroundStyle(isSelected ? Color.black.opacity(0.75) : Color.white)
            .padding(.horizontal, 18)
            .padding(.vertical, 11)
            .background(
                Group {
                    if isSelected {
                        LinearGradient(colors: theme.gradient, startPoint: .topLeading, endPoint: .bottomTrailing)
                    } else {
                        // Liquid Glass — frosted panel
                        Color.white.opacity(0.1)
                    }
                }
            )
            .background(.ultraThinMaterial.opacity(isSelected ? 0 : 1))
            .clipShape(Capsule())
            .overlay(
                Capsule().stroke(
                    isSelected ? Color.clear : Color.white.opacity(0.2),
                    lineWidth: 0.5
                )
            )
            .shadow(
                color: isSelected ? theme.gradient[0].opacity(0.55) : .clear,
                radius: 12, y: 4
            )
            .scaleEffect(isSelected ? 1.06 : 1.0)
        }
        .buttonStyle(.plain)
        .animation(.spring(response: 0.28, dampingFraction: 0.7), value: isSelected)
    }
}

// MARK: - Glass Search Panel

private struct GlassSearchPanel: View {
    @Environment(AppState.self) private var appState
    let accentGradient: [Color]
    let onExplore: () -> Void

    var body: some View {
        VStack(spacing: 12) {
            // ── Airport field ───────────────────────────────────────────
            AirportSearchView()

            // ── Duration picker ─────────────────────────────────────────
            DurationPickerView()

            // ── Explore CTA ─────────────────────────────────────────────
            Button(action: onExplore) {
                HStack {
                    Text("Explore \(appState.selectedTheme?.displayName ?? "Destinations")")
                        .font(.system(size: 17, weight: .bold))
                    Spacer()
                    Image(systemName: "arrow.right")
                        .font(.system(size: 15, weight: .bold))
                }
                .foregroundStyle(.black.opacity(0.8))
                .padding(.horizontal, 22)
                .padding(.vertical, 17)
                .background(
                    LinearGradient(colors: accentGradient, startPoint: .leading, endPoint: .trailing)
                )
                .clipShape(RoundedRectangle(cornerRadius: 20))
                .shadow(color: accentGradient[0].opacity(0.45), radius: 14, y: 5)
            }
            .disabled(!appState.canExplore)
            .opacity(appState.canExplore ? 1 : 0.55)
        }
        .padding(20)
        .background(.ultraThinMaterial)
        .background(Color.black.opacity(0.25))
        .clipShape(RoundedRectangle(cornerRadius: 28))
        .overlay(
            RoundedRectangle(cornerRadius: 28)
                .stroke(Color.white.opacity(0.12), lineWidth: 0.5)
        )
        .shadow(color: .black.opacity(0.35), radius: 24, y: 8)
    }
}
