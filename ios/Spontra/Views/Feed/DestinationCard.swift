import SwiftUI

// iOS 26 Liquid Glass card
// Full-bleed photography. Glass info strip floats at bottom.
// Actions are glass capsules — not icon rows.

struct DestinationCard: View {
    let item: FeedItem
    let isActive: Bool
    let onFlightSearch: () -> Void

    @State private var isSaved   = false
    @State private var fireLike  = false
    @State private var likeCount = 0

    private var store: SavedStore { SavedStore.shared }
    private var theme: ThemeSlug { ThemeSlug(rawValue: item.theme) ?? .discover }

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .bottom) {

                // ── Full-bleed background ─────────────────────────────────
                CardBackground(media: item.reel.primaryMedia, size: geo.size, isActive: isActive)

                // ── Scrim — bottom only, keeps top clean ──────────────────
                LinearGradient(
                    colors: [.clear, .clear, .black.opacity(0.15), .black.opacity(0.88)],
                    startPoint: UnitPoint(x: 0.5, y: 0.35),
                    endPoint: .bottom
                )
                .ignoresSafeArea()

                // Theme ambient tint (very subtle)
                LinearGradient(
                    colors: theme.gradient.map { $0.opacity(0.12) } + [.clear],
                    startPoint: .bottomLeading,
                    endPoint: .topLeading
                )

                // ── Like burst ────────────────────────────────────────────
                LikeAnimationOverlay(trigger: $fireLike)

                // ── Spontra wordmark — top left ───────────────────────────
                VStack {
                    HStack {
                        Text("spontra")
                            .font(.system(size: 14, weight: .black, design: .rounded))
                            .foregroundStyle(.white.opacity(0.75))
                            .tracking(-0.3)
                            .padding(.top, 58)
                            .padding(.leading, 22)
                        Spacer()
                    }
                    Spacer()
                }

                // ── Bottom: glass info panel + action column ──────────────
                HStack(alignment: .bottom, spacing: 12) {

                    // Info + CTA (left, grows)
                    VStack(alignment: .leading, spacing: 8) {

                        // Theme badge — glass capsule
                        HStack(spacing: 5) {
                            Text(theme.emoji).font(.system(size: 12))
                            Text(theme.displayName.uppercased())
                                .font(.system(size: 10, weight: .bold))
                                .tracking(1.5)
                        }
                        .foregroundStyle(.white.opacity(0.85))
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(.ultraThinMaterial)
                        .clipShape(Capsule())
                        .overlay(Capsule().stroke(Color.white.opacity(0.2), lineWidth: 0.5))

                        // City name
                        Text(item.destination.cityName)
                            .font(.system(size: 40, weight: .black, design: .rounded))
                            .foregroundStyle(.white)
                            .shadow(color: .black.opacity(0.3), radius: 4)
                            .lineLimit(1)
                            .minimumScaleFactor(0.65)

                        // Country + duration row
                        HStack(spacing: 12) {
                            HStack(spacing: 5) {
                                Text(flagEmoji(for: item.destination.countryCode))
                                Text(item.destination.countryName)
                            }
                            .font(.subheadline.weight(.medium))
                            .foregroundStyle(.white.opacity(0.85))

                            if let dur = item.destination.formattedDuration {
                                HStack(spacing: 4) {
                                    Image(systemName: "airplane")
                                        .font(.caption)
                                    Text(dur)
                                }
                                .font(.subheadline.weight(.medium))
                                .foregroundStyle(.white.opacity(0.65))
                            }
                        }

                        // Caption
                        if let caption = item.reel.caption {
                            Text(caption)
                                .font(.subheadline)
                                .foregroundStyle(.white.opacity(0.6))
                                .lineLimit(2)
                        }

                        // ── CTA — glass + theme gradient ─────────────────
                        Button(action: onFlightSearch) {
                            HStack(spacing: 8) {
                                Image(systemName: "airplane.departure")
                                    .font(.system(size: 14, weight: .semibold))
                                Text("Find Flights")
                                    .font(.system(size: 15, weight: .bold))
                                Spacer()
                                if let price = item.destination.formattedPrice {
                                    Text("from \(price)")
                                        .font(.system(size: 13, weight: .semibold))
                                        .opacity(0.85)
                                }
                            }
                            .foregroundStyle(.black.opacity(0.75))
                            .padding(.horizontal, 18)
                            .padding(.vertical, 14)
                            .background(
                                LinearGradient(
                                    colors: theme.gradient,
                                    startPoint: .leading, endPoint: .trailing
                                )
                            )
                            .clipShape(RoundedRectangle(cornerRadius: 16))
                            .shadow(color: theme.gradient[0].opacity(0.5), radius: 12, y: 4)
                        }
                        .padding(.top, 4)
                    }

                    // Action column (right, fixed width)
                    VStack(spacing: 18) {
                        // Like
                        ActionPill(
                            icon: likeCount > 0 ? "heart.fill" : "heart",
                            label: likeCount > 0 ? "\(likeCount)" : nil,
                            tint: likeCount > 0 ? .pink : .white
                        ) {
                            likeCount += 1
                            fireLike = true
                            UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                        }

                        // Save
                        ActionPill(
                            icon: isSaved ? "bookmark.fill" : "bookmark",
                            label: isSaved ? "Saved" : "Save",
                            tint: isSaved ? theme.gradient[0] : .white
                        ) {
                            store.toggle(item.destination, theme: theme, imageUrl: item.reel.primaryMedia?.sourceUrl)
                            isSaved = store.isSaved(item.destination.iata)
                            UIImpactFeedbackGenerator(style: .rigid).impactOccurred()
                        }

                        // Share
                        ActionPill(icon: "arrowshape.turn.up.right", label: "Share", tint: .white) {
                            let text = "Check out \(item.destination.cityName) \(theme.emoji) — spontra.vercel.app"
                            let av = UIActivityViewController(activityItems: [text], applicationActivities: nil)
                            UIApplication.shared.connectedScenes
                                .compactMap { $0 as? UIWindowScene }
                                .first?.windows.first?
                                .rootViewController?.present(av, animated: true)
                        }
                    }
                    .padding(.bottom, 4)
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 48)
            }
        }
        .onTapGesture(count: 2) {
            fireLike = true
            likeCount += 1
            UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        }
        .onAppear {
            isSaved = store.isSaved(item.destination.iata)
        }
    }

    private func flagEmoji(for code: String) -> String {
        code.unicodeScalars.compactMap {
            Unicode.Scalar(127397 + $0.value).map(String.init)
        }.joined()
    }
}

// MARK: - Glass Action Pill

private struct ActionPill: View {
    let icon: String
    let label: String?
    let tint: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.system(size: 22, weight: .medium))
                    .foregroundStyle(tint)
                if let label {
                    Text(label)
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundStyle(.white.opacity(0.65))
                }
            }
            .frame(width: 48, height: label != nil ? 52 : 44)
            .background(.ultraThinMaterial)
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .stroke(Color.white.opacity(0.15), lineWidth: 0.5)
            )
            .shadow(color: .black.opacity(0.25), radius: 6, y: 2)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Card Background

private struct CardBackground: View {
    let media: ReelMedia?
    let size: CGSize
    let isActive: Bool

    var body: some View {
        if let media {
            if media.kind == .video, let url = URL(string: media.sourceUrl) {
                VideoPlayerView(url: url, isActive: isActive)
                    .frame(width: size.width, height: size.height)
                    .clipped()
            } else {
                AsyncImage(url: URL(string: media.sourceUrl)) { phase in
                    switch phase {
                    case .success(let image):
                        image.resizable().scaledToFill()
                            .frame(width: size.width, height: size.height).clipped()
                    default:
                        placeholder.frame(width: size.width, height: size.height)
                    }
                }
            }
        } else {
            placeholder.frame(width: size.width, height: size.height)
        }
    }

    private var placeholder: some View {
        LinearGradient(
            colors: [Color(hex: "#1e293b"), Color(hex: "#0f172a")],
            startPoint: .top, endPoint: .bottom
        )
    }
}
