// My Campaigns page - Shows campaigns created by the current user
// Displays all campaigns organized by the logged-in user

import { useState, useEffect } from 'react'

export default function MyCampaigns() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)

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
      <h1 className="my-campaigns-title">My Campaigns</h1>

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
