// All Campaigns page - Shows the list of campaigns with sidebar navigation
// Includes: All Campaigns, My Donations, Create a campaign, My Profile navigation items

import { useEffect, useState, useMemo } from 'react'
import { useAccount } from 'wagmi'
import { api } from '../lib/api'
import CampaignCard from '../components/CampaignCard'
import SidebarLayout from '../components/SidebarLayout'

export default function AllCampaigns() {
  const [list, setList] = useState([])
  const [status, setStatus] = useState('loading')
  const [errMsg, setErrMsg] = useState('')
  const { address } = useAccount()

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const res = await api.listCampaigns()
        if (!alive) return
        setList(res?.campaigns ?? [])
        setStatus('ok')
      } catch (e) {
        if (!alive) return
        setErrMsg(e?.message || 'Failed to fetch')
        setStatus('error')
      }
    })()
    return () => { alive = false }
  }, [])

  // Show only campaigns created by others (exclude current user's own campaigns)
  const filteredList = useMemo(() => {
    if (!address) return list
    return (list ?? []).filter(
      c => c.organizer?.toLowerCase() !== address.toLowerCase()
    )
  }, [list, address])

  const hasItems = useMemo(
    () => (filteredList?.length ?? 0) > 0, 
    [filteredList]
  )

  return (
    <SidebarLayout>
      <div className="page-content">
        <h1 className="page-title">Find a cause that speaks to you</h1>

        {status === 'error' && (
          <div className="error-message">
            {errMsg}. Check backend at {import.meta.env.VITE_BACKEND_URL}.
          </div>
        )}

        {status === 'loading' && (
          <div className="campaigns-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="campaign-card-skeleton" />
            ))}
          </div>
        )}

        {status === 'ok' && !hasItems && (
          <div className="empty-state">No campaigns yet!</div>
        )}

        {status === 'ok' && hasItems && (
          <div className="campaigns-grid">
            {filteredList.map(c => (
              <CampaignCard key={c.address} c={c} />
            ))}
          </div>
        )}
      </div>
    </SidebarLayout>
  )
}
