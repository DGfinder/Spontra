export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-600">Quick insight into platform health.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-medium text-slate-600">Destinations ready</h2>
          <p className="mt-2 text-2xl font-semibold text-slate-900">--</p>
          <p className="text-xs text-slate-500">Ready count populated from search service (todo).</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-medium text-slate-600">Search uptime</h2>
          <p className="mt-2 text-2xl font-semibold text-slate-900">--</p>
          <p className="text-xs text-slate-500">Hook into monitoring once available.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-medium text-slate-600">Queued actions</h2>
          <p className="mt-2 text-2xl font-semibold text-slate-900">--</p>
          <p className="text-xs text-slate-500">Placeholder for moderation/backfill queues.</p>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-medium text-slate-600">Recent activity</h2>
        <p className="mt-2 text-sm text-slate-500">Audit feed wiring pending.</p>
      </div>
    </div>
  )
}
