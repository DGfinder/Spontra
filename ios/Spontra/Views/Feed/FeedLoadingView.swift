import SwiftUI

/// Full-screen shimmer skeleton shown while the feed is loading
struct FeedLoadingView: View {
    @Environment(AppState.self) private var appState
    @State private var shimmerPhase: CGFloat = -1

    private var theme: ThemeSlug { appState.selectedTheme ?? .discover }
    private var accentColor: Color { theme.gradient[0] }

    var body: some View {
        GeometryReader { geo in
            ZStack {
                Color.sBackground.ignoresSafeArea()

                // Animated background gradient that slowly shifts
                LinearGradient(
                    colors: theme.gradient.map { $0.opacity(0.15) } + [Color.sBackground],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()
                .animation(.easeInOut(duration: 2).repeatForever(autoreverses: true), value: shimmerPhase)

                VStack(spacing: 0) {
                    // Fake header
                    HStack {
                        Circle().fill(Color.sSurface).frame(width: 36, height: 36)
                        Spacer()
                        RoundedRectangle(cornerRadius: 8).fill(Color.sSurface)
                            .frame(width: 80, height: 14)
                        Spacer()
                        Capsule().fill(Color.sSurface).frame(width: 80, height: 28)
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 56)

                    Spacer()

                    // Skeleton content (bottom of card)
                    VStack(alignment: .leading, spacing: 12) {
                        // Theme badge
                        Capsule().fill(Color.sSurface).frame(width: 90, height: 26)

                        // City name
                        RoundedRectangle(cornerRadius: 8).fill(Color.sSurface)
                            .frame(width: geo.size.width * 0.65, height: 44)

                        // Country + duration
                        HStack(spacing: 12) {
                            RoundedRectangle(cornerRadius: 6).fill(Color.sSurface)
                                .frame(width: 120, height: 18)
                            RoundedRectangle(cornerRadius: 6).fill(Color.sSurface)
                                .frame(width: 80, height: 18)
                        }

                        // Caption lines
                        VStack(alignment: .leading, spacing: 8) {
                            RoundedRectangle(cornerRadius: 6).fill(Color.sSurface)
                                .frame(width: geo.size.width * 0.85, height: 14)
                            RoundedRectangle(cornerRadius: 6).fill(Color.sSurface)
                                .frame(width: geo.size.width * 0.60, height: 14)
                        }

                        // CTA button skeleton
                        RoundedRectangle(cornerRadius: 16)
                            .fill(accentColor.opacity(0.25))
                            .frame(maxWidth: .infinity)
                            .frame(height: 56)
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 52)
                    .overlay(shimmerOverlay(width: geo.size.width))
                }
            }
        }
        .onAppear {
            withAnimation(.linear(duration: 1.4).repeatForever(autoreverses: false)) {
                shimmerPhase = 1
            }
        }
    }

    @ViewBuilder
    private func shimmerOverlay(width: CGFloat) -> some View {
        GeometryReader { _ in
            LinearGradient(
                stops: [
                    .init(color: .clear, location: 0),
                    .init(color: .white.opacity(0.08), location: 0.4),
                    .init(color: .white.opacity(0.18), location: 0.5),
                    .init(color: .white.opacity(0.08), location: 0.6),
                    .init(color: .clear, location: 1),
                ],
                startPoint: .init(x: shimmerPhase - 0.3, y: 0.5),
                endPoint:   .init(x: shimmerPhase + 0.3, y: 0.5)
            )
        }
        .allowsHitTesting(false)
    }
}

/// Shown when the feed comes back empty
struct FeedEmptyView: View {
    @Environment(AppState.self) private var appState
    let onBack: () -> Void

    private var theme: ThemeSlug { appState.selectedTheme ?? .discover }

    var body: some View {
        ZStack {
            Color.sBackground.ignoresSafeArea()
            LinearGradient(
                colors: theme.gradient.map { $0.opacity(0.12) } + [Color.clear],
                startPoint: .bottom, endPoint: .top
            ).ignoresSafeArea()

            VStack(spacing: 24) {
                Text(theme.emoji)
                    .font(.system(size: 64))

                Text("No trips found")
                    .font(.title2.weight(.bold))
                    .foregroundStyle(.white)

                Text("Try a longer flight time or a different vibe.\nWe're always adding new destinations.")
                    .font(.subheadline)
                    .foregroundStyle(.white.opacity(0.6))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)

                Button(action: onBack) {
                    Text("Change search")
                        .font(.headline.weight(.semibold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 32)
                        .padding(.vertical, 14)
                        .background(
                            LinearGradient(colors: theme.gradient, startPoint: .leading, endPoint: .trailing)
                        )
                        .clipShape(Capsule())
                }
            }
        }
    }
}
