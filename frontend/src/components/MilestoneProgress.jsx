// Renders milestone progress based on backend fields
// Backend flips approved/released when the oracle validates and funds are released

export default function MilestoneProgress({ milestones = [] }) {
    const done = milestones.filter(m => m.approved).length
    const total = milestones.length || 1
    const pct = Math.round((done / total) * 100)

  return (
    <div className="rounded-2xl border p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">Milestones</h3>
        <span className="text-sm opacity-70">{done}/{total} ({pct}%)</span>
      </div>

      <div className="w-full h-2 rounded bg-gray-200 mb-3 overflow-hidden">
        <div className="h-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#9be,#6ad)" }} />
      </div>

      <ul className="space-y-2">
        {milestones.map(m => (
          <li key={m.id ?? m.title} className="flex items-center gap-3">
            <span className={`w-2 h-2 rounded-full ${m.approved ? "bg-green-500" : "bg-gray-400"}`} />
            <div className="flex-1">
              <div className="text-sm font-medium">{m.title}</div>
              <div className="text-xs opacity-70">
                Target: {m.targetAmount}
                {m.approved ? " • Approved" : " • Pending"}
                {m.released ? " • Released" : ""}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}