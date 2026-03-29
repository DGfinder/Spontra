import SwiftUI

@main
struct SpontraApp: App {
    @State private var appState   = AppState()
    @State private var savedStore = SavedStore.shared
    @State private var onboardingComplete = UserDefaults.standard.bool(forKey: "spontra.onboarding.complete")

    var body: some Scene {
        WindowGroup {
            if onboardingComplete {
                ContentView()
                    .environment(appState)
                    .environment(savedStore)
                    .preferredColorScheme(.dark)
            } else {
                OnboardingView(isComplete: $onboardingComplete)
                    .preferredColorScheme(.dark)
            }
        }
    }
}
