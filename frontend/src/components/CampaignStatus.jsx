// src/components/CampaignStatus.jsx
export default function CampaignStatus() {
  return (
    <section className="rounded-2xl bg-white shadow-lg ring-1 ring-slate-200 p-6 md:p-8">
      {/* Title + description */}
      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight">Where is my money?</h2>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-3 text-sm">
        <StatRow label="Escrow (locked)" value="1.50 ETH" />
        <StatRow label="Pending release" value="2.00 ETH" />
        <StatRow label="Already released to organizer" value="1.00 ETH" />
        <StatRow label="Your contribution" value="0.50 ETH" />
      </div>

      {/* Progress bar */}
      <div className="mt-5">
        <div className="flex items-center justify-between text-[13px] text-slate-500">
          <span>Progress toward next milestone</span>
          <span className="font-medium text-slate-700">75%</span>
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-slate-200">
          <div className="h-2 rounded-full bg-cyan-500" style={{ width: '75%' }} />
        </div>
      </div>

      {/* CTA row */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          className="inline-flex items-center justify-center rounded-lg bg-cyan-500 px-4 py-2 text-white text-sm font-semibold shadow-sm hover:bg-cyan-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 active:bg-cyan-700 transition"
        >
          Refundable now
        </button>
        <span className="text-xs font-medium text-cyan-700 bg-cyan-50 border border-cyan-200 rounded-md px-2 py-1">
            Deadline: 24 Nov 2025
        </span>
      </div>

      {/* Divider */}
      <hr className="my-8 border-slate-200" />

      {/* Timeline */}
      <h3 className="text-base md:text-lg font-semibold">Event Timeline</h3>
      <Timeline
        items={[
          { label: 'DonationReceived', time: '12 mins ago' },
          { label: 'DonationReceived', time: '7 mins ago' },
          { label: 'MilestoneApproved', time: '5 mins ago' },
          { label: 'MilestoneReleased', time: '3 mins ago' },
        ]}
      />
    </section>
  )
}

function StatRow({ label, value }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-slate-500">{label}:</span>
      <span className="font-semibold tabular-nums tracking-tight">{value}</span>
    </div>
  )
}

function Badge({ children, tone = 'cyan' }) {
  const base =
    'inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1';
  const styles = {
    cyan: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
    slate: 'bg-slate-50 text-slate-700 ring-slate-200',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  }[tone];
  return <span className={`${base} ${styles}`}>{children}</span>;
}

function Timeline({ items }) {
  return (
    <ol className="mt-4 relative border-slate-200">
      <div className="absolute left-2 top-0 bottom-0 w-px bg-slate-200" />
      {items.map((it, i) => (
        <li key={i} className="pl-8 py-3 flex items-center justify-between">
          <div className="relative">
            <span className="absolute -left-6 top-1.5 size-3 rounded-full bg-slate-300 ring-4 ring-white" />
            <span className="font-medium">{it.label}</span>
          </div>
          <span className="text-xs text-slate-500">{it.time}</span>
        </li>
      ))}
    </ol>
  )
}
