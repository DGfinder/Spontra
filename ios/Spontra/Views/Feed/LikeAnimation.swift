import SwiftUI

/// Drop this overlay on any view. Call `trigger()` to fire the heart burst.
struct LikeAnimationOverlay: View {
    @State private var showHeart = false
    @State private var scale: CGFloat = 0.1
    @State private var opacity: Double = 0

    let trigger: Binding<Bool>

    var body: some View {
        ZStack {
            if showHeart {
                Image(systemName: "heart.fill")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 100)
                    .foregroundStyle(.white)
                    .shadow(color: .black.opacity(0.4), radius: 8)
                    .scaleEffect(scale)
                    .opacity(opacity)
            }
        }
        .onChange(of: trigger.wrappedValue) { _, fired in
            guard fired else { return }
            animate()
            trigger.wrappedValue = false
        }
        .allowsHitTesting(false)
    }

    private func animate() {
        showHeart = true
        scale = 0.1
        opacity = 1

        withAnimation(.spring(response: 0.3, dampingFraction: 0.55)) {
            scale = 1.1
        }

        withAnimation(.spring(response: 0.15).delay(0.3)) {
            scale = 0.9
        }

        withAnimation(.easeOut(duration: 0.4).delay(0.6)) {
            opacity = 0
            scale   = 1.3
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 1.1) {
            showHeart = false
            scale = 0.1
        }
    }
}
