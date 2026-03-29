import SwiftUI

struct ContentView: View {
    @Environment(AppState.self) private var appState
    @State private var showFeed  = false
    @State private var activeTab = 0

    private var themeAccent: Color {
        appState.selectedTheme?.gradient.first ?? Color.sOrange
    }

    var body: some View {
        ZStack(alignment: .bottom) {
            // ── Active screen ──────────────────────────────────────────────
            Group {
                switch activeTab {
                case 0:  discoverTab
                default: SavedView()
                }
            }
            .ignoresSafeArea()

            // ── Floating glass tab bar ─────────────────────────────────────
            if !showFeed {
                FloatingTabBar(activeTab: $activeTab, accent: themeAccent)
                    .padding(.bottom, 28)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
        .preferredColorScheme(.dark)
        .animation(.spring(response: 0.35), value: showFeed)
    }

    @ViewBuilder
    private var discoverTab: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            if showFeed {
                FeedView(onBack: {
                    withAnimation(.spring(response: 0.45, dampingFraction: 0.85)) {
                        showFeed = false
                    }
                    appState.reset()
                })
                .transition(.opacity.combined(with: .scale(scale: 1.04)))
            } else {
                HomeView(onExplore: {
                    Task { await appState.loadFeed() }
                    withAnimation(.spring(response: 0.45, dampingFraction: 0.85)) {
                        showFeed = true
                    }
                })
                .transition(.opacity)
            }
        }
        .animation(.spring(response: 0.45, dampingFraction: 0.85), value: showFeed)
    }
}

// MARK: - Floating Glass Tab Bar

private struct FloatingTabBar: View {
    @Binding var activeTab: Int
    let accent: Color

    private let tabs: [(icon: String, activeIcon: String, label: String)] = [
        ("airplane.circle",  "airplane.circle.fill",  "Discover"),
        ("bookmark",         "bookmark.fill",          "Saved"),
    ]

    var body: some View {
        HStack(spacing: 0) {
            ForEach(tabs.indices, id: \.self) { i in
                let isActive = activeTab == i
                Button {
                    if activeTab != i {
                        UIImpactFeedbackGenerator(style: .light).impactOccurred()
                        withAnimation(.spring(response: 0.3)) { activeTab = i }
                    }
                } label: {
                    HStack(spacing: isActive ? 7 : 0) {
                        Image(systemName: isActive ? tabs[i].activeIcon : tabs[i].icon)
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundStyle(isActive ? .black.opacity(0.75) : .white.opacity(0.6))

                        if isActive {
                            Text(tabs[i].label)
                                .font(.system(size: 14, weight: .bold))
                                .foregroundStyle(.black.opacity(0.75))
                                .transition(.scale.combined(with: .opacity))
                        }
                    }
                    .padding(.horizontal, isActive ? 20 : 16)
                    .padding(.vertical, 13)
                    .background(
                        Group {
                            if isActive {
                                LinearGradient(
                                    colors: [accent, accent.opacity(0.8)],
                                    startPoint: .topLeading, endPoint: .bottomTrailing
                                )
                                .shadow(color: accent.opacity(0.5), radius: 10, y: 4)
                            } else {
                                Color.clear
                            }
                        }
                    )
                    .clipShape(Capsule())
                }
                .buttonStyle(.plain)

                if i < tabs.count - 1 { Spacer() }
            }
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 10)
        .background(.ultraThinMaterial)
        .background(Color.black.opacity(0.4))
        .clipShape(Capsule())
        .overlay(Capsule().stroke(Color.white.opacity(0.12), lineWidth: 0.5))
        .shadow(color: .black.opacity(0.4), radius: 20, y: 6)
        .padding(.horizontal, 60)
    }
}
