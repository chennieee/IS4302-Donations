// My Profile page - User profile management
// Shows username and wallet address fields
// Includes profile picture with change option

import { useState, useEffect } from 'react'

export default function MyProfile() {
  const [profile, setProfile] = useState({
    username: '',
    walletAddress: ''
  })

  // Load profile from localStorage or wallet
  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile')
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile))
    }
  }, [])

  const handleChange = (field, value) => {
    setProfile({ ...profile, [field]: value })
  }

  const handleSaveDetails = () => {
    localStorage.setItem('userProfile', JSON.stringify(profile))
    alert('Profile details saved successfully!')
  }

  const handleProfilePictureChange = () => {
    // TODO: Implement profile picture upload
    alert('Profile picture upload will be implemented')
  }

  return (
    <div className="profile-container">
      <h1 className="profile-title">My Profile</h1>

      <div className="profile-content">
        {/* Left Side - Profile Picture */}
        <div className="profile-picture-section">
          <div className="profile-avatar-large">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            <div className="profile-verified-badge">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
          </div>
          <button className="change-picture-btn" onClick={handleProfilePictureChange}>
            Change Profile Picture
          </button>
        </div>

        {/* Right Side - Profile Form */}
        <div className="profile-form-section">
          <div className="profile-field">
            <label className="profile-label">Username</label>
            <input
              type="text"
              className="profile-input"
              value={profile.username}
              onChange={(e) => handleChange('username', e.target.value)}
              placeholder="Enter your username"
            />
          </div>

          <div className="profile-field">
            <label className="profile-label">Wallet Address</label>
            <input
              type="text"
              className="profile-input"
              value={profile.walletAddress}
              placeholder="0x..."
              readOnly
              style={{
                cursor: 'default',
                fontFamily: 'monospace',
                fontSize: '0.9em'
              }}
            />
          </div>

          <button className="save-details-btn" onClick={handleSaveDetails}>
            Save Details
          </button>
        </div>
      </div>
    </div>
  )
}
