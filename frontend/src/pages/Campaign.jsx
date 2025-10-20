// Campaign page shows campaign details such as name and milestone progress
// Campaign page contains a button for users to donate
// When users click on the donate button, they are brought to the Donation page

import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../lib/api'
import CampaignCard from '../components/CampaignCard'
import MilestoneProgress from '../components/MilestoneProgress'

export default function Campaign() {
  const { address } = useParams()
  const [c, setC] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const res = await api.getCampaign(address)
        setC(res)
      } catch (e) { setErr(e.message) }
    })()
  }, [address])

  if (err) return <div className="p-6 text-red-600">{err}</div>
  if (!c)  return <div className="p-6">Loading…</div>

  return (
    <div className="p-6 space-y-4">
      <CampaignCard c={c} />
      <MilestoneProgress milestones={c.milestones || []} />

      <div className="flex gap-3">
        <Link to={`/campaign/${address}/donate`} className="px-4 py-2 rounded-xl border hover:shadow-sm">
          Donate
        </Link>
      </div>
    </div>
  )
}
