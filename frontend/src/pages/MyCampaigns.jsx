// My Campaigns page - Shows campaigns created by the current user
// Displays all campaigns organized by the logged-in user

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { api } from '../lib/api'
import CampaignCard from '../components/CampaignCard'
import CreateCampaign from './CreateCampaign'

export default function MyCampaigns() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const { address } = useAccount()

  const fetchMyCampaigns = async () => {
    try {
      setLoading(true)
      const response = await api.listCampaigns()

      // Filter campaigns by organizer if wallet is connected
      if (address) {
        const myCampaigns = response.campaigns.filter(
          c => c.organizer?.toLowerCase() === address.toLowerCase()
        )
        setCampaigns(myCampaigns)
      } else {
        setCampaigns([])
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error)
      setCampaigns([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMyCampaigns()
  }, [address])

  if (loading) {
    return (
      <div className="my-campaigns-container">
        <h1 className="my-campaigns-title">My Campaigns</h1>
        <p>Loading your campaigns...</p>
      </div>
    )
  }

  return (
    <div className="my-campaigns-container">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <h1 className="my-campaigns-title" style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: '1' }}>My Campaigns</h1>
        <button
          aria-label="Create a new campaign"
          onClick={() => setShowCreate(s => !s)}
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

      {showCreate && (
        <div style={{ marginTop: '1rem' }}>
          <CreateCampaign
            /* show embedded form title so it looks like the CreateCampaign page */
            showTitle={true}
            onDone={() => {
              // Close the embedded create form and refresh campaigns
              setShowCreate(false)
              fetchMyCampaigns()
            }}
          />
        </div>
      )}

      {!address ? (
        <div className="empty-state">
          <p>Please connect your wallet to view your campaigns.</p>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="empty-state">
          <p>You haven't created any campaigns yet.</p>
          <p>Start making a difference by creating your first campaign!</p>
        </div>
      ) : (
        <div className="campaigns-grid">
          {campaigns.map(campaign => (
            <CampaignCard key={campaign.address} c={campaign} />
          ))}
        </div>
      )}
    </div>
  )
}
