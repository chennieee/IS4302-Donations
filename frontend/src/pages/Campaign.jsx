// Campaign page shows campaign details such as name and milestone progress
// Campaign page contains a button for users to donate
// When users click on the donate button, they are brought to the Donation page

import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../lib/api'
import CampaignCard from '../components/CampaignCard'
import MilestoneProgress from '../components/MilestoneProgress'
import { useAccountWC } from '../hooks/useAccount'

export default function Campaign() {
  const { address } = useParams()
  const [c, setC] = useState(null)
  const [err, setErr] = useState('')

  // For refund action
  const account = useAccountWC()
  const [refMsg, setRefMsg] = useState('')
  const [refBusy, setRefBusy] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const res = await api.getCampaign(address)
        setC(res)
      } catch (e) { setErr(e.message) }
    })()
  }, [address])

  // Ask backend to execute a refund for this user (if allowed)
  async function requestRefund() {
    if (!account) { setRefMsg('Connect your wallet first.'); return }
    setRefBusy(true); setRefMsg('')
    try {
      await api.refund({ fromAddress: account, campaignAddress: address })
      setRefMsg('Refund requested. You will see it once backend confirms.')
    } catch (e) {
      setRefMsg(e.message)
    } finally { setRefBusy(false) }
  }

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

        {/* Show "Request Refund" only when backend says refunds are open */}
        {c.refundOpen && (
          <button onClick={requestRefund} disabled={refBusy} className="px-4 py-2 rounded-xl border hover:shadow-sm">
            {refBusy ? 'Requesting…' : 'Request Refund'}
          </button>
        )}
      </div>

      {refMsg && <div className="text-sm">{refMsg}</div>}
    </div>
  )
}
