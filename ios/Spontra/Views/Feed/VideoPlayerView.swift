import SwiftUI
import AVKit

/// A looping, muted AVPlayer that plays inline in cards (like Instagram Reels / TikTok).
struct VideoPlayerView: UIViewRepresentable {
    let url: URL
    let isActive: Bool

    func makeUIView(context: Context) -> VideoPlayerUIView {
        let view = VideoPlayerUIView()
        view.configure(url: url)
        return view
    }

    func updateUIView(_ uiView: VideoPlayerUIView, context: Context) {
        if isActive {
            uiView.play()
        } else {
            uiView.pause()
        }
    }

    static func dismantleUIView(_ uiView: VideoPlayerUIView, coordinator: ()) {
        uiView.tearDown()
    }
}

final class VideoPlayerUIView: UIView {
    private var player: AVPlayer?
    private var playerLayer: AVPlayerLayer?
    private var loopObserver: NSObjectProtocol?

    override func layoutSubviews() {
        super.layoutSubviews()
        playerLayer?.frame = bounds
    }

    func configure(url: URL) {
        let item  = AVPlayerItem(url: url)
        let p     = AVPlayer(playerItem: item)
        p.isMuted = true
        p.volume  = 0

        let layer = AVPlayerLayer(player: p)
        layer.videoGravity = .resizeAspectFill
        layer.frame = bounds
        self.layer.addSublayer(layer)

        player      = p
        playerLayer = layer

        // Loop
        loopObserver = NotificationCenter.default.addObserver(
            forName: .AVPlayerItemDidPlayToEndTime,
            object: item,
            queue: .main
        ) { [weak p] _ in
            p?.seek(to: .zero)
            p?.play()
        }

        // Avoid interrupting ambient audio
        try? AVAudioSession.sharedInstance().setCategory(.ambient, mode: .default)
    }

    func play()  { player?.play() }
    func pause() { player?.pause() }

    func tearDown() {
        player?.pause()
        playerLayer?.removeFromSuperlayer()
        if let obs = loopObserver { NotificationCenter.default.removeObserver(obs) }
        player = nil
    }
}
