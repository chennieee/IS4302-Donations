// Home page shows the list of campaigns
// When users click on a campaign, they are brought to the corresponding Campaign page

import { useEffect, useState, useMemo } from 'react'
import { api } from '../lib/api'
import CampaignCard from '../components/CampaignCard'

export default function Home() {
  const [list, setList] = useState([])
  const [status, setStatus] = useState('loading')
  const [errMsg, setErrMsg] = useState('')

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const res = await api.listCampaigns()
        if (!alive) return
        setList(res?.items ?? [])
        setStatus('ok')
      } catch (e) { 
        if (!alive) return
        setErrMsg(e?.message || 'Failed to fetch') 
        setStatus('error')
      }
    })()
    return () => { alive = false }
  }, [])

  const hasItems = useMemo(() => (list?.length ?? 0) > 0, [list])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
        Discover campaigns
      </h1>

      {status === 'error' && (
        <div className="text-sm bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2">
          {errMsg}. Check backend at {import.meta.env.VITE_BACKEND_URL}.
        </div>
      )}

      {status === 'loading' && (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border p-4 h-[320px] animate-pulse bg-gray-50" />
          ))}
        </div>
      )}

      {status === 'ok' && !hasItems && (
        <div className="text-gray-500 text-lg py-10">No campaigns yet!</div>
      )}

      {status === 'ok' && hasItems && (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {list.map(c => <CampaignCard key={c.address} c={c} />)}
        </div>
      )}
    </div>
  )
}