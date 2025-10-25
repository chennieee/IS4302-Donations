// My Campaigns page - Shows campaigns created by the current user
// Displays all campaigns organized by the logged-in user

import { useState, useEffect } from 'react'
import CreateCampaign from './CreateCampaign'

export default function MyCampaigns() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    // TODO: Fetch campaigns created by the current user
    // This will be implemented when wallet connection is integrated
    setLoading(false)
  }, [])

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
              // Close the embedded create form and trigger a simple state update.
              // TODO: replace with a real refresh of campaigns from backend/wallet.
              setShowCreate(false)
              setCampaigns(prev => prev)
            }}
          />
        </div>
      )}

      {campaigns.length === 0 ? (
        <div className="empty-state">
          <p>You haven't created any campaigns yet.</p>
          <p>Start making a difference by creating your first campaign!</p>
        </div>
      ) : (
        <div className="campaigns-grid">
          {campaigns.map(campaign => (
            <div key={campaign.id} className="campaign-card">
              <h3>{campaign.name}</h3>
              <p>{campaign.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
