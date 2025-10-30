// My Profile page - User profile management
// Shows username and wallet address fields
// Includes profile picture with change option

import { useState, useEffect, useRef } from 'react'
import { useAccount } from 'wagmi'
const API_BASE = import.meta.env.VITE_BACKEND_URL

export default function MyProfile() {
  const { address, isConnected } = useAccount()
  const [profile, setProfile] = useState({
    username: '',
    walletAddress: '',
    avatarUrl: ''
  })
  const [statusMsg, setStatusMsg] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingUser, setIsLoadingUser] = useState(false)
  const fileInputRef = useRef(null)

  // Load profile
  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile')
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile)
        setProfile(prev => ({
          ...prev,
          username: parsed.username || '',
          walletAddress: parsed.walletAddress || prev.walletAddress,
          avatarUrl: parsed.avatarUrl || ''
        }))
      } catch (e) {
        console.warn('Bad userProfile in localStorage, ignoring', e)
      }
    }
  }, [])

  // Sync wallet + Fetch user profile from backend (whenever wallet connection changes)
  useEffect(() => {
    async function syncWalletAndFetch() {
      if (!isConnected || !address) {
        // no wallet connected
        setProfile(prev => ({
          ...prev,
          walletAddress: ''
        }))
        return
      }

      // put wallet address in state
      setProfile(prev => ({
        ...prev,
        walletAddress: address
      }))

      try {
        setIsLoadingUser(true)
        setStatusMsg('')

        const res = await fetch(`${API_BASE}/api/users/${address}`)
        if (res.ok) {
          const data = await res.json()
          setProfile(prev => ({
            ...prev,
            username: data.username || prev.username || '',
            walletAddress: data.wallet_addr || address,
            avatarUrl: data.avatar_url || prev.avatarUrl || ''
          }))
        } else if (res.status === 404) {
          //profile not created yet
        } else {
          console.error('GET /api/users failed', res.status)
          setStatusMsg('Could not load profile from server.')
        }
      } catch (err) {
        console.error('Error fetching user:', err)
        setStatusMsg('Error loading profile.')
      } finally {
        setIsLoadingUser(false)
      }
    }

    syncWalletAndFetch()
  }, [isConnected, address])


  const handleUsernameChange = (e) => {
    setProfile(prev => ({
      ...prev,
      username: e.target.value
    }))
  }

  const handleProfilePictureChange = () => {
    if (!isConnected) return // don't allow if wallet not connected
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileSelected = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const dataUrl = reader.result
      setProfile(prev => ({
        ...prev,
        avatarUrl: dataUrl
      }))
    }
    reader.readAsDataURL(file)
  }

  const handleSaveDetails = async () => {
    setStatusMsg('')
    setIsSaving(true)

    if (!profile.walletAddress) {
      setStatusMsg('Please connect your wallet before saving.')
      setIsSaving(false)
      return
    }

    try {
      const res = await fetch(
        `${API_BASE}/api/users/${profile.walletAddress}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: profile.username,
            avatar_url: profile.avatarUrl || null
          })
        }
      )

      if (!res.ok) {
        console.error('PUT /api/users failed with', res.status)
        setStatusMsg('Failed to save profile to server.')
      } else {
        const saved = await res.json()
        setProfile(prev => ({
          ...prev,
          username: saved.username || prev.username,
          walletAddress: saved.wallet_addr || prev.walletAddress,
          avatarUrl: saved.avatar_url || prev.avatarUrl
        }))

        localStorage.setItem(
          'userProfile',
          JSON.stringify({
            username: saved.username || profile.username,
            walletAddress: saved.wallet_addr || profile.walletAddress,
            avatarUrl: saved.avatar_url || profile.avatarUrl
          })
        )

        setStatusMsg('Saved!')
        alert('Profile details saved successfully!')
      }
    } catch (err) {
      console.error('Error saving user:', err)
      setStatusMsg('Network error saving profile.')
    } finally {
      setIsSaving(false)
    }
  }

  // derived wallet display string
  const walletDisplay = profile.walletAddress
    ? profile.walletAddress
    : 'No wallet connected'

  // avatar preview element
  const avatarNode = profile.avatarUrl ? (
    <img
      src={profile.avatarUrl}
      alt="avatar"
      style={{
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        objectFit: 'cover'
      }}
    />
  ) : (
    <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
    </svg>
  )  

  return (
    <div className="profile-container">
      <h1 className="profile-title">My Profile</h1>

      <div className="profile-content">
        {/* LEFT: avatar + button */}
        <div className="profile-picture-section">
          <div className="profile-avatar-large">
            {avatarNode}

            <div className="profile-verified-badge">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
          </div>

          <button
            className="change-picture-btn"
            onClick={handleProfilePictureChange}
            disabled={!isConnected}
            style={{
              opacity: isConnected ? 1 : 0.5,
              cursor: isConnected ? 'pointer' : 'not-allowed'
            }}
          >
            Change Profile Picture
          </button>

          {/* hidden file input, triggered by the button above */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileSelected}
          />
        </div>

        {/* RIGHT: username + wallet + save */}
        <div className="profile-form-section">
          <div className="profile-field">
            <label className="profile-label">Username</label>
            <input
              type="text"
              className="profile-input"
              value={profile.username}
              onChange={handleUsernameChange}
              placeholder="Enter your username"
              disabled={isLoadingUser && !profile.username}
            />
          </div>

          <div className="profile-field">
            <label className="profile-label">Wallet Address</label>
            <input
              type="text"
              className="profile-input"
              value={walletDisplay}
              readOnly
              style={{
                cursor: 'default',
                fontFamily: 'monospace',
                fontSize: '0.9em',
                color: '#000'
              }}
            />
          </div>

          <button
            className="save-details-btn"
            onClick={handleSaveDetails}
            disabled={isSaving}
            style={{
              opacity: isSaving ? 0.6 : 1,
              cursor: isSaving ? 'wait' : 'pointer'
            }}
          >
            {isSaving ? 'Saving...' : 'Save Details'}
          </button>

          {statusMsg && (
            <div
              style={{
                marginTop: '12px',
                fontSize: '0.9rem',
                color: statusMsg === 'Saved!' ? '#0a7a0a' : '#a00'
              }}
            >
              {statusMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}