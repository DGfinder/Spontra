import { AlertTriangle, CheckCircle, Inbox, Shield } from 'lucide-react'

const EMPTY_STATE = [
  {
    icon: Shield,
    title: 'AI scanning',
    message: 'Rekognition hooks will surface auto-flagged videos here.',
  },
  {
    icon: AlertTriangle,
    title: 'Manual reports',
    message: 'Creator and traveller reports flow into this queue once the moderation service is online.',
  },
  {
    icon: CheckCircle,
    title: 'Resolution history',
    message: 'Completed actions will render in the audit trail below for compliance review.',
  },
]

export default function ModerationPage() {
  return (
    <div className='space-y-8'>
      <header className='space-y-1'>
        <h1 className='text-2xl font-semibold text-slate-900'>Moderation queue</h1>
        <p className='text-sm text-slate-600'>Flagged creator submissions will land here for triage.</p>
      </header>

      <section className='rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm'>
        <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-500'>
          <Inbox size={28} />
        </div>
        <h2 className='text-lg font-semibold text-slate-900'>No items to moderate</h2>
        <p className='mt-2 text-sm text-slate-600'>Plug in the reporting pipeline or seed data to exercise the workflow.</p>
      </section>

      <section className='grid gap-4 md:grid-cols-3'>
        {EMPTY_STATE.map(({ icon: Icon, title, message }) => (
          <article key={title} className='rounded-xl border border-slate-200 bg-white p-6 shadow-sm'>
            <Icon size={20} className='text-slate-400' />
            <h3 className='mt-3 text-sm font-semibold text-slate-900'>{title}</h3>
            <p className='mt-2 text-sm text-slate-600'>{message}</p>
          </article>
        ))}
      </section>
    </div>
  )
}