export default function ModerationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Moderation queue</h1>
        <p className="text-sm text-slate-600">Flagged content will appear here.</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">
          No items pending moderation. Integrate with reporting service when ready.
        </p>
      </div>
    </div>
  )
}
