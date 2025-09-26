import { Activity, ClipboardList, MapPin, ShieldCheck, Video } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface MetricCard {
  id: string
  title: string
  value: string
  helper: string
  icon: LucideIcon
}

const METRICS: MetricCard[] = [
  {
    id: 'destinations',
    title: 'Ready destinations',
    value: '--',
    helper: 'Populated once the search index is connected.',
    icon: MapPin,
  },
  {
    id: 'themes',
    title: 'Theme readiness',
    value: '--',
    helper: 'Tracks theme gating across active cities.',
    icon: Activity,
  },
  {
    id: 'moderation',
    title: 'Moderation queue',
    value: '0',
    helper: 'Connect to the reporting service to surface items here.',
    icon: ShieldCheck,
  },
  {
    id: 'media',
    title: 'Media awaiting review',
    value: '--',
    helper: 'Pulls from /api/admin/reel-media when wired up.',
    icon: Video,
  },
]

const TODO_ITEMS: string[] = [
  'Hook search readiness metrics to the destination index.',
  'Expose the moderation feed once the reporting service ships.',
  'Stream reel analytics into this overview to monitor volatility.',
]

export default function AdminDashboardPage() {
  return (
    <div className='space-y-8'>
      <header className='space-y-1'>
        <h1 className='text-2xl font-semibold text-slate-900'>Admin overview</h1>
        <p className='text-sm text-slate-600'>High level status for the travel curation surface.</p>
      </header>

      <section className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        {METRICS.map(({ id, title, value, helper, icon: Icon }) => (
          <article key={id} className='rounded-xl border border-slate-200 bg-white p-6 shadow-sm'>
            <div className='flex items-start justify-between'>
              <div>
                <p className='text-xs uppercase tracking-wide text-slate-500'>{title}</p>
                <p className='mt-2 text-2xl font-semibold text-slate-900'>{value}</p>
              </div>
              <Icon size={20} className='text-slate-400' />
            </div>
            <p className='mt-4 text-sm text-slate-500'>{helper}</p>
          </article>
        ))}
      </section>

      <section className='rounded-xl border border-slate-200 bg-white p-6 shadow-sm'>
        <h2 className='text-sm font-medium text-slate-700'>Deployment checklist</h2>
        <ul className='mt-4 space-y-3 text-sm text-slate-600'>
          {TODO_ITEMS.map((item) => (
            <li key={item} className='flex items-start gap-3'>
              <ClipboardList size={16} className='mt-0.5 text-blue-500' />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}