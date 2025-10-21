// Campaign card to show details of Campaign

import { Link } from 'react-router-dom'

export default function CampaignCard({ c }) {
    // Calculate target from milestones (highest milestone)
    const target = c?.milestones && c.milestones.length > 0
        ? Math.max(...c.milestones.map(m => typeof m === 'number' ? m : parseFloat(m) || 0))
        : 0

    const raised = parseFloat(c?.totalRaised || 0)
    const pct = target > 0
        ? Math.min(100, Math.round((raised / target) * 100))
        : 0

    // Determine status based on deadline and progress
    const now = Math.floor(Date.now() / 1000)
    const isExpired = c?.deadline && c.deadline < now
    const isCompleted = pct >= 100
    const status = isCompleted ? "completed" : isExpired ? "expired" : "in-progress"

    // Map status to a quick colour badge
    const statusColour = status === "completed" ? "bg-green-500"
                       : status === "expired" ? "bg-red-500"
                       : "bg-yellow-500"

    return (
        <div className="rounded-2xl border shadow-sm overflow-hidden">
        {c?.image && <img src={c.image} alt="" className="h-40 w-full object-cover" />}

        <div className="p-4 space-y-2">
            <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">{c?.name ?? 'Campaign'}</h2>
            <span className={`text-xs text-white px-2 py-0.5 rounded ${statusColour}`}>
                {status}
            </span>
            </div>

            <p className="text-sm opacity-80 line-clamp-2">{c?.description || 'No description available'}</p>

            <div className="text-sm">
            <div className="w-full h-2 bg-gray-200 rounded mb-1 overflow-hidden">
                <div
                className="h-full"
                style={{ width: `${pct}%`, background: "linear-gradient(90deg,#9be,#6ad)" }}
                />
            </div>
            <div className="flex justify-between text-xs opacity-70">
                <span>Raised: {raised} ETH</span>
                <span>Target: {target} ETH</span>
                <span>Donors: {c?.donorCount ?? 0}</span>
            </div>
            </div>

            <div className="pt-1 flex gap-2">
            <Link to={`/campaign/${c.address}`} className="px-3 py-1 rounded-xl border hover:shadow-sm">View</Link>
            <Link to={`/campaign/${c.address}/donate`} className="px-3 py-1 rounded-xl border hover:shadow-sm">Donate</Link>
            </div>
        </div>
        </div>
    )
}