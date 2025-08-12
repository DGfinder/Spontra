'use client'

export default function AdminDirectPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Direct Admin Test</h1>
          <p className="text-slate-400">This page bypasses admin layout completely</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Email Address
              </label>
              <input
                type="email"
                className="w-full px-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50"
                placeholder="admin@spontra.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Password
              </label>
              <input
                type="password"
                className="w-full px-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 px-4 rounded-lg"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}