import { useEffect, useState, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { useNavigate } from 'react-router-dom'
import CampaignCard from '../components/CampaignCard'
import { api } from '../lib/api'

export default function MyCampaigns() {
  const { address, isConnected } = useAccount()
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('loading')
  const navigate = useNavigate()

  const organizer = (address || '').toLowerCase()

  const fetchMine = useCallback(async () => {
    try {
      if (!isConnected || !organizer) {
        setItems([])
        setStatus('ok')
        return
      }
      setStatus('loading')
      const res = await api.listCampaigns({ organizer })
      const mine = (res?.campaigns ?? []).filter(
        (c) => (c?.organizer || '').toLowerCase() === organizer
      )
      setItems(mine)
      setStatus('ok')
    } catch (e) {
      console.error(e)
      setItems([])
      setStatus('error')
    }
  }, [isConnected, organizer])

  useEffect(() => {
    let alive = true
    ;(async () => {
      await fetchMine()
    })()
    return () => { alive = false }
  }, [fetchMine])

  if (status === 'loading') return <div className="p-4">Loading…</div>
  if (!isConnected) return <div className="p-4">Connect your wallet to see your campaigns.</div>

  const hasItems = items.length > 0

  return (
    <div className="my-campaigns-container">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <h1
          className="my-campaigns-title"
          style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1 }}
        >
          {hasItems ? 'My Campaigns' : "You haven’t created any campaigns yet."}
        </h1>
        <button
          aria-label="Create a new campaign"
          onClick={() => navigate('/create')}
          style={{
            width: '40px',
            height: '40px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            background: '#0f172a',
            color: '#fff',
            fontSize: '28px',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            transform: 'translateY(-4px)'
          }}
        >
          +
        </button>
      </div>
      <div style={{ height: 20 }} />

      {status === 'error' && (
        <div className="p-4 text-red-600">Failed to fetch campaigns. Check your backend/API URL.</div>
      )}

      {hasItems && (
        <div className="campaigns-grid" style={{ marginTop: 20 }}>
          {items.map(c => (
            <CampaignCard key={c.address} c={c} />
          ))}
        </div>
      )}
    </div>
  )
}
