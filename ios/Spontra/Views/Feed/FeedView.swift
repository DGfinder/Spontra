import SwiftUI

struct FeedView: View {
    @Environment(AppState.self) private var appState
    let onBack: () -> Void

    @State private var flightSearchDestination: Destination?

    var body: some View {
        ZStack {
            Color.sBackground.ignoresSafeArea()

            if appState.isLoadingFeed {
                FeedLoadingView()
            } else if let error = appState.feedError {
                FeedEmptyView(onBack: onBack) // reuse empty view — error is same UX
                    .overlay(alignment: .top) {
                        Text(error)
                            .font(.caption)
                            .foregroundStyle(.white.opacity(0.4))
                            .padding(.top, 60)
                    }
            } else if appState.feedItems.isEmpty {
                FeedEmptyView(onBack: onBack)
            } else {
                VerticalFeed(
                    items: appState.feedItems,
                    onFlightSearch: { flightSearchDestination = $0 }
                )
                .ignoresSafeArea()

                VStack {
                    FeedHeader(onBack: onBack)
                    Spacer()
                    SwipeHintOverlay()
                        .padding(.bottom, 160)
                }
            }
        }
        .sheet(item: $flightSearchDestination) { destination in
            FlightSearchSheet(destination: destination)
                .environment(appState)
        }
    }
}

// MARK: - Vertical paging feed

private struct VerticalFeed: View {
    let items: [FeedItem]
    let onFlightSearch: (Destination) -> Void

    // scrollPosition(id:) is iOS 17 — the active card is whichever id is in view
    @State private var scrolledID: Int? = 0
    private var activeIndex: Int { scrolledID ?? 0 }

    var body: some View {
        GeometryReader { geo in
            ScrollView(.vertical, showsIndicators: false) {
                LazyVStack(spacing: 0) {
                    ForEach(Array(items.enumerated()), id: \.element.id) { index, item in
                        DestinationCard(
                            item: item,
                            isActive: index == activeIndex,
                            onFlightSearch: { onFlightSearch(item.destination) }
                        )
                        .frame(width: geo.size.width, height: geo.size.height)
                        .id(index)
                    }
                }
                .scrollTargetLayout()
            }
            .scrollTargetBehavior(.paging)
            .scrollPosition(id: $scrolledID)
        }
    }
}

// MARK: - Feed header

private struct FeedHeader: View {
    @Environment(AppState.self) private var appState
    let onBack: () -> Void

    var body: some View {
        HStack {
            Button(action: onBack) {
                Image(systemName: "chevron.left")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(.white)
                    .frame(width: 36, height: 36)
                    .background(.ultraThinMaterial)
                    .clipShape(Circle())
            }

            Spacer()

            // Spontra wordmark — subtle, centred
            Text("spontra")
                .font(.system(size: 16, weight: .black, design: .rounded))
                .foregroundStyle(.white.opacity(0.85))
                .tracking(-0.3)

            Spacer()

            // Theme pill with theme gradient
            if let theme = appState.selectedTheme {
                HStack(spacing: 5) {
                    Text(theme.emoji).font(.system(size: 13))
                    Text(theme.displayName)
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(.white)
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 7)
                .background(
                    LinearGradient(colors: theme.gradient, startPoint: .leading, endPoint: .trailing)
                )
                .clipShape(Capsule())
            }
        }
        .padding(.horizontal, 16)
        .padding(.top, 56)
    }
}


