import SwiftUI

struct OnboardingView: View {
    @Binding var isComplete: Bool
    @State private var page = 0

    private let pages: [OnboardPage] = [
        OnboardPage(
            emoji: "✈️",
            title: "Travel\nSpontaneously",
            body: "Stop scrolling flight prices. Pick a vibe, pick how long you've got, and we'll show you where to go.",
            gradient: [Color(hex: "#f97316"), Color(hex: "#dc2626")]
        ),
        OnboardPage(
            emoji: "🎬",
            title: "See It\nBefore You Go",
            body: "Swipe through real destination videos and photos. Double-tap to save the ones that spark something.",
            gradient: [Color(hex: "#a855f7"), Color(hex: "#7c3aed")]
        ),
        OnboardPage(
            emoji: "💸",
            title: "Find the\nCheapest Dates",
            body: "Our price calendar shows you the lowest fare windows at a glance — like Skyscanner, but actually beautiful.",
            gradient: [Color(hex: "#22c55e"), Color(hex: "#15803d")]
        ),
        OnboardPage(
            emoji: "🔖",
            title: "Save &\nCompare",
            body: "Bookmark destinations as you swipe. When you're ready, search flights for all of them in one tap.",
            gradient: [Color(hex: "#3b82f6"), Color(hex: "#1d4ed8")]
        ),
    ]

    var body: some View {
        ZStack {
            // Dynamic background gradient
            LinearGradient(
                colors: pages[page].gradient + [Color.sBackground],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            .animation(.easeInOut(duration: 0.5), value: page)

            VStack(spacing: 0) {
                // Skip button
                HStack {
                    Spacer()
                    Button("Skip") {
                        complete()
                    }
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.white.opacity(0.7))
                    .padding(.horizontal, 24)
                    .padding(.top, 60)
                }

                Spacer()

                // Page cards via TabView
                TabView(selection: $page) {
                    ForEach(0..<pages.count, id: \.self) { i in
                        OnboardCard(page: pages[i])
                            .tag(i)
                    }
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
                .frame(height: 420)

                Spacer()

                // Progress dots
                HStack(spacing: 8) {
                    ForEach(0..<pages.count, id: \.self) { i in
                        Capsule()
                            .fill(i == page ? .white : .white.opacity(0.35))
                            .frame(width: i == page ? 24 : 8, height: 8)
                            .animation(.spring(response: 0.3), value: page)
                    }
                }

                // Next / Get Started button
                Button {
                    if page < pages.count - 1 {
                        withAnimation { page += 1 }
                    } else {
                        complete()
                    }
                } label: {
                    Text(page < pages.count - 1 ? "Next" : "Let's Go →")
                        .font(.title3.weight(.bold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 18)
                        .background(.white.opacity(0.2))
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                        .overlay(
                            RoundedRectangle(cornerRadius: 16)
                                .stroke(.white.opacity(0.4), lineWidth: 1)
                        )
                }
                .padding(.horizontal, 24)
                .padding(.top, 24)
                .padding(.bottom, 50)
            }
        }
    }

    private func complete() {
        UserDefaults.standard.set(true, forKey: "spontra.onboarding.complete")
        withAnimation(.spring(response: 0.4)) { isComplete = true }
    }
}

// MARK: - Page model

struct OnboardPage {
    let emoji: String
    let title: String
    let body: String
    let gradient: [Color]
}

// MARK: - Card

private struct OnboardCard: View {
    let page: OnboardPage

    var body: some View {
        VStack(spacing: 24) {
            Text(page.emoji)
                .font(.system(size: 80))

            Text(page.title)
                .font(.system(size: 40, weight: .black, design: .rounded))
                .foregroundStyle(.white)
                .multilineTextAlignment(.center)
                .lineSpacing(2)

            Text(page.body)
                .font(.body)
                .foregroundStyle(.white.opacity(0.85))
                .multilineTextAlignment(.center)
                .lineSpacing(4)
                .padding(.horizontal, 12)
        }
        .padding(.horizontal, 32)
    }
}
