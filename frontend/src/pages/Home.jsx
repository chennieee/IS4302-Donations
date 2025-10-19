// Home page shows the list of campaigns
// When users click on a campaign, they are brought to the corresponding Campaign page

import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import CampaignCard from '../components/CampaignCard'

export default function Home() {
  const [list, setList] = useState([])
  const [err, setErr] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const res = await api.listCampaigns()
        setList(res?.items ?? [])
      } catch (e) { setErr(e.message) }
    })()
  }, [])

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Campaigns</h1>
      {err && <div className="text-red-600">{err}</div>}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {list.map(c => <CampaignCard key={c.address} c={c} />)}
      </div>
    </div>
  )
}