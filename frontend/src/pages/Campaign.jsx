import { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../lib/api'

export default function Campaign() {
  const { address } = useParams()
  const [c, setC] = useState(null)
  const [err, setErr] = useState('')
  const [donations, setDonations] = useState([])
  const [creator, setCreator] = useState(null)
  const [donorProfiles, setDonorProfiles] = useState({})

  // Helper to convert amount to number
  // Backend now stores amounts in ETH units (not wei)
  const toEth = (amount) => {
    const amountStr = typeof amount === 'string' ? amount : String(amount || 0)
    return parseFloat(amountStr) || 0
  }

  // Format UNIX timestamp (seconds) into a readable date
  const formatDate = (timestamp) => {
    if (!timestamp) return ''
    const tsNum = Number(timestamp)
    if (!Number.isFinite(tsNum)) return ''
    const d = new Date(tsNum * 1000)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  useEffect(() => {
    ;(async () => {
      try {
        const res = await api.getCampaign(address)
        setC(res)

        // Load creator profile
        if (res.organizer) {
          try {
            const user = await api.getUser(res.organizer.toLowerCase())
            setCreator(user)
          } catch (e) {
            console.error('Failed to load creator profile', e)
          }
        }

        // Use real recent activity from API
        if (res.recentActivity && res.recentActivity.length > 0) {
          const donationEvents = res.recentActivity
            .filter(activity => activity.eventName === 'DonationReceived')
            .map(activity => ({
              donor: activity.args.donor || 'Anonymous',
              amount: `${toEth(activity.args.amount).toFixed(4)} ETH`
            }))
          setDonations(donationEvents)
        }
      } catch (e) { setErr(e.message) }
    })()
  }, [address])

  // Load donor profiles for recent activity
  useEffect(() => {
    if (!donations.length) return;
    (async () => {
      try {
        const addresses = Array.from(
          new Set(
            donations
              .map(d => d.donor)
              .filter(addr => typeof addr === 'string' && /^0x[a-fA-F0-9]{40}$/.test(addr))
              .map(addr => addr.toLowerCase())
          )
        )

        if (!addresses.length) return

        const results = {}
        await Promise.all(
          addresses.map(async (addr) => {
            try {
              const user = await api.getUser(addr)
              results[addr] = user
            } catch (e) {
              console.error('Failed to load donor profile', addr, e)
            }
          })
        )
        setDonorProfiles(results)
      } catch (e) {
        console.error('Failed to load donor profiles', e)
      }
    })()
  }, [donations])


  // Calculate donation progress
  const donationStats = useMemo(() => {
    if (!c) return { donated: 0, goal: 0, percentage: 0, donorCount: 0 }
    const donated = toEth(c.totalRaised)
    const goal = c.milestones && c.milestones.length > 0 ?
      Math.max(...c.milestones.map(m => toEth(typeof m === 'number' ? m : m.targetAmount || 0))) : 100
    const percentage = goal > 0 ? Math.round((donated / goal) * 100) : 0
    const donorCount = c.donorCount || 0
    return { donated, goal, percentage, donorCount }
  }, [c])

  // Calculate milestone data
  const milestones = useMemo(() => {
    if (!c || !c.milestones || c.milestones.length === 0) {
      return []
    }

    const totalRaised = toEth(c.totalRaised)
    return c.milestones.map((amount, idx) => {
      const milestoneAmount = toEth(typeof amount === 'number' ? amount : amount.targetAmount || 0)
      return {
        label: `Milestone ${idx + 1}`,
        amount: `${milestoneAmount.toFixed(2)} ETH`,
        reached: totalRaised >= milestoneAmount
      }
    })
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
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>Back to All Campaigns</span>
        </Link>

        <h1 className="campaign-detail-title">{c.name || 'Campaign Title'}</h1>

        {/* Campaign Image */}
        <div className="campaign-image-placeholder">
          {c.image ? (
            <img src={c.image} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span>image</span>
          )}
        </div>

        {/* Creator Info */}
        <div className="campaign-creator">
          <div className="creator-avatar">
            {creator?.avatar_url ? (
              <img 
                src={creator.avatar_url}
                alt={creator.username || c.organizer || 'Creator avatar'}
                style={{ width: 24, height: 24, borderRadius: '9999px', objectFit: 'cover' }}
              />
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            )}
          </div>
          <span className="creator-name">Created by {creator?.username || c.organizer || 'Unknown'}</span>
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
            <div className="amount-donated">{donationStats.donated.toFixed(2)} ETH Donated</div>
            <div className="amount-goal">{donationStats.goal.toFixed(2)} ETH Goal</div>
          </div>

          {c.deadline && (
            <div className="campaign-deadline">
              Deadline: {formatDate(c.deadline)}
            </div>
          )}

          <div className="donor-count">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="donor-icon">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
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
            {donations.map((donation, idx) => {
              const donorAddr = typeof donation.donor === 'string' ? donation.donor.toLowerCase() : ''
              const donorProfile = donorAddr ? donorProfiles[donorAddr] : null
              const donorName = donorProfile?.username || donation.donor
              const donorAvatar = donorProfile?.avatar_url
            
              return (
                <div key={idx} className="activity-item">
                  <div className="activity-avatar">
                    {donorAvatar ? (
                      <img
                        src={donorAvatar}
                        alt={donorName || 'Donor Avatar'}
                        style={{ width: 20, height: 20, borderRadius: '9999px', objectFit: 'cover', }}
                      />
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    )}
                  </div>
                  <div className="activity-info">
                    <div className="activity-donor">{donorName}</div>
                    <div className="activity-amount">{donation.amount}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
