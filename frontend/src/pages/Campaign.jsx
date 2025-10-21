// Campaign page shows campaign details such as name and milestone progress
// Campaign page contains a button for users to donate
// When users click on the donate button, they are brought to the Donation page

import { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../lib/api'

export default function Campaign() {
  const { address } = useParams()
  const [c, setC] = useState(null)
  const [err, setErr] = useState('')
  const [donations, setDonations] = useState([])

  useEffect(() => {
    (async () => {
      try {
        const res = await api.getCampaign(address)
        setC(res)
        // Use real recent activity from API
        if (res.recentActivity && res.recentActivity.length > 0) {
          const donationEvents = res.recentActivity
            .filter(activity => activity.eventName === 'Donated')
            .map(activity => ({
              donor: activity.args.donor || 'Anonymous',
              amount: `${activity.args.amount || 0} ETH`
            }))
          setDonations(donationEvents)
        }
      } catch (e) { setErr(e.message) }
    })()
  }, [address])

  // Calculate donation progress
  const donationStats = useMemo(() => {
    if (!c) return { donated: 0, goal: 0, percentage: 0, donorCount: 0 }
    const donated = parseFloat(c.totalRaised) || 0
    const goal = c.milestones && c.milestones.length > 0 ?
      Math.max(...c.milestones.map(m => typeof m === 'number' ? m : parseFloat(m.targetAmount) || 0)) : 100
    const percentage = goal > 0 ? Math.round((donated / goal) * 100) : 0
    const donorCount = c.donorCount || 0
    return { donated, goal, percentage, donorCount }
  }, [c])

  // Calculate milestone data
  const milestones = useMemo(() => {
    if (!c || !c.milestones || c.milestones.length === 0) {
      return []
    }

    const totalRaised = parseFloat(c.totalRaised) || 0
    return c.milestones.map((amount, idx) => ({
      label: `Milestone ${idx + 1}`,
      amount: `${typeof amount === 'number' ? amount : parseFloat(amount.targetAmount) || 0} ETH`,
      reached: totalRaised >= (typeof amount === 'number' ? amount : parseFloat(amount.targetAmount) || 0)
    }))
  }, [c])

  if (err) return <div className="campaign-error">{err}</div>
  if (!c) return <div className="campaign-loading">Loading…</div>

  return (
    <div className="campaign-detail-layout">
      {/* Left Column - Campaign Info */}
      <div className="campaign-left">
        {/* Back Button */}
        <Link to="/campaigns" className="campaign-back-button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          <span>Back to All Campaigns</span>
        </Link>

        <h1 className="campaign-detail-title">{c.name || 'Campaign Title'}</h1>

        {/* Campaign Image */}
        <div className="campaign-image-placeholder">
          {c.image ? (
            <img src={c.image} alt={c.name} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          ) : (
            <span>image</span>
          )}
        </div>

        {/* Creator Info */}
        <div className="campaign-creator">
          <div className="creator-avatar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
          <span className="creator-name">Created by {c.organizer || 'Unknown'}</span>
        </div>

        {/* Campaign Description */}
        <p className="campaign-description">
          {c.description || 'No description provided for this campaign.'}
        </p>

        {/* Action Buttons */}
        <div className="campaign-actions">
          <Link to={`/campaign/${address}/donate`} className="campaign-btn campaign-btn-donate">
            Donate
          </Link>
          <button className="campaign-btn campaign-btn-share">
            Share
          </button>
        </div>
      </div>

      {/* Right Column - Stats and Activity */}
      <div className="campaign-right">
        {/* Donation Progress */}
        <div className="campaign-stats-card">
          <div className="donation-progress">
            <svg className="progress-ring" width="120" height="120">
              <circle
                className="progress-ring-bg"
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="10"
              />
              <circle
                className="progress-ring-fill"
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="#86efac"
                strokeWidth="10"
                strokeDasharray={`${donationStats.percentage * 3.14} 314`}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div className="progress-text">
              <div className="progress-percentage">{donationStats.percentage}%</div>
            </div>
          </div>

          <div className="donation-amount">
            <div className="amount-donated">{donationStats.donated} ETH Donated</div>
            <div className="amount-goal">{donationStats.goal} ETH Goal</div>
          </div>

          <div className="donor-count">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="donor-icon">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
            <span>{donationStats.donorCount} people are donating to this cause</span>
          </div>
        </div>

        {/* Milestone Progress */}
        <div className="milestones-timeline">
          {milestones.map((milestone, idx) => (
            <div key={idx} className="milestone-item">
              <div className={`milestone-dot ${milestone.reached ? 'reached' : ''}`} />
              {idx < milestones.length - 1 && (
                <div className={`milestone-line ${milestone.reached ? 'reached' : ''}`} />
              )}
              <div className="milestone-label">
                <div className="milestone-name">{milestone.label}:</div>
                <div className="milestone-amount">{milestone.amount}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="recent-activity">
          <h3 className="activity-title">Recent Activity</h3>
          <div className="activity-list">
            {donations.map((donation, idx) => (
              <div key={idx} className="activity-item">
                <div className="activity-avatar">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
                <div className="activity-info">
                  <div className="activity-donor">{donation.donor}</div>
                  <div className="activity-amount">{donation.amount}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
