export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 border-4 border-white/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-transparent border-t-white rounded-full animate-spin" />
        </div>
        <p className="text-white/60 text-sm">Loading your adventure...</p>
      </div>
    </div>
  )
}
