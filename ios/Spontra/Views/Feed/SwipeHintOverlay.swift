import SwiftUI

/// Shows a brief "swipe up" animation on the first feed view, then hides itself.
struct SwipeHintOverlay: View {
    @State private var opacity: Double = 1
    @State private var offsetY: CGFloat = 0
    @State private var hasShown = false

    private let key = "spontra.hint.swipe.shown"

    var body: some View {
        Group {
            if !hasShown {
                VStack(spacing: 8) {
                    Image(systemName: "chevron.up")
                        .font(.system(size: 20, weight: .semibold))
                    Image(systemName: "chevron.up")
                        .font(.system(size: 20, weight: .semibold))
                        .opacity(0.5)
                    Text("Swipe up to explore")
                        .font(.caption.weight(.semibold))
                }
                .foregroundStyle(.white)
                .padding(.horizontal, 20)
                .padding(.vertical, 12)
                .background(.black.opacity(0.35))
                .clipShape(Capsule())
                .offset(y: offsetY)
                .opacity(opacity)
                .allowsHitTesting(false)
            }
        }
        .onAppear {
            guard !UserDefaults.standard.bool(forKey: key) else {
                hasShown = true
                return
            }

            // Animate: bob up and fade after 2s
            withAnimation(.easeInOut(duration: 0.8).repeatCount(2, autoreverses: true)) {
                offsetY = -10
            }

            DispatchQueue.main.asyncAfter(deadline: .now() + 2.5) {
                withAnimation(.easeOut(duration: 0.4)) { opacity = 0 }
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
                    hasShown = true
                    UserDefaults.standard.set(true, forKey: key)
                }
            }
        }
    }
}
