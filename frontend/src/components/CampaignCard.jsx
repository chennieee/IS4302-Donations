// Campaign card to show details of Campaign

import { Link } from 'react-router-dom'

export default function CampaignCard({ c }) {
    const pct = c?.target
        ? Math.min(100, Math.round((Number(c.totalRaised || 0) / Math.max(1, Number(c.target))) * 100))
        : 0

    // Map status to a quick colour badge
    const statusColour = c?.status === "success" ? "bg-green-500"
                       : c?.status === "failed" ? "bg-red-500"
                       : "bg-yellow-500"

    return (
        <div className="rounded-2xl border shadow-sm overflow-hidden">
        {c?.image && <img src={c.image} alt="" className="h-40 w-full object-cover" />}

        <div className="p-4 space-y-2">
            <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">{c?.title ?? 'Campaign'}</h2>
            <span className={`text-xs text-white px-2 py-0.5 rounded ${statusColour}`}>
                {c?.status ?? "in-progress"}
            </span>
            </div>

            <p className="text-sm opacity-80 line-clamp-2">{c?.summary}</p>

            <div className="text-sm">
            <div className="w-full h-2 bg-gray-200 rounded mb-1 overflow-hidden">
                <div
                className="h-full"
                style={{ width: `${pct}%`, background: "linear-gradient(90deg,#9be,#6ad)" }}
                />
            </div>
            <div className="flex justify-between text-xs opacity-70">
                <span>Raised: {c?.totalRaised ?? 0}</span>
                <span>Target: {c?.target ?? 0}</span>
                <span>Donors: {c?.donors ?? 0}</span>
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