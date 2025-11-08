// Campaign card to show details of Campaign
import { Link } from 'react-router-dom'
import { useAccount } from 'wagmi'

export default function CampaignCard({ c }) {
    const { address } = useAccount()
    const isMine = address && c?.organizer && address.toLowerCase() === c.organizer.toLowerCase()

    // Helper to convert amount to number
    // Backend now stores amounts in ETH units (not wei)
    const toEth = (amount) => {
        const amountStr = typeof amount === 'string' ? amount : String(amount || 0)
        return parseFloat(amountStr) || 0
    }

    // Calculate target from milestones (highest milestone) - already in ETH
    const target = c?.milestones && c.milestones.length > 0
        ? Math.max(...c.milestones.map(m => toEth(m)))
        : 0

    const raised = toEth(c?.totalRaised)
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
        <div className="rounded-2xl border border-gray-300 shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
            {c?.image && <img src={c.image} alt="" className="h-40 w-full object-cover" />}

            <div className="p-4 space-y-2">
                <div className="items-center justify-between">
                    <h2 className="font-semibold text-lg">{c?.name ?? 'Campaign'}</h2>
                    <span className={`inline-block text-xs text-white px-2 py-1 rounded ${statusColour}`}>
                        {status}
                    </span>
                </div>

                <p className="text-sm opacity-80 line-clamp-2">{c?.description || 'No description available'}</p>

                <div className="text-sm">
                    <div className="w-full h-2 bg-gray-200 rounded mb-1 overflow-hidden">
                        <div
                            className="h-full bg-green-500"
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs opacity-70">
                        <span>Raised: {raised.toFixed(2)} ETH</span>
                        <span>Target: {target.toFixed(2)} ETH</span>
                        <span>Donors: {c?.donorCount ?? 0}</span>
                    </div>
                </div>

                <div className="pt-1 flex gap-2">
                    <Link to={`/campaign/${c.address}`} className="flex-1 text-center bg-gray-200 text-gray-900 font-medium py-2 rounded-xl transition-colors shadow-sm hover:bg-gray-300">View</Link>
                    {isMine ? (<div className="px-3 py-2 rounded-full bg-green-100 text-green-700 font-semibold text-sm inline-flex items-center justify-center select-none">My campaign</div>)
                            : (<Link to={`/campaign/${c.address}/donate`} className="flex-1 text-center bg-gray-200 text-gray-900 font-medium py-2 rounded-xl transition-colors shadow-sm hover:bg-gray-300">Donate</Link>)}
                </div>
            </div>
        </div>
    )
}