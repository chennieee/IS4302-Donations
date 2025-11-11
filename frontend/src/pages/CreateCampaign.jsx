// Create Campaign page - Form to create a new campaign
// Includes image upload, campaign details, and milestone settings

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { api } from '../lib/api'
import ConnectWalletButton from '../components/ConnectWalletButton'
import './CreateCampaign.css'

export default function CreateCampaign({ onDone, showTitle = true }) {
  const navigate = useNavigate()
  const { address: walletAddress, isConnected } = useAccount()
  const [formData, setFormData] = useState({
    campaignTitle: '',
    description: '',
    overallGoal: '',
    deadline: '',
    milestone1: '',
  })
  const [imagePreview, setImagePreview] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // ---------- helpers ----------
  const parseAmount = (val) => {
    if (val == null || val === '') return 0
    const n = Number(val)
    return Number.isFinite(n) ? n : 0
  }

  const toMidnightUTC = (y, m, d) => Date.UTC(y, m - 1, d) // months 1..12

  // Date parser for both YYYY-MM-DD and DD/MM/YYYY
  function parseDateStrict(s) {
    if (!s) return null
    if (s.includes('-')) {
      const [Y, M, D] = s.split('-').map(Number)
      if (!Y || !M || !D) return null
      return toMidnightUTC(Y, M, D)
    }
    if (s.includes('/')) {
      const [D, M, Y] = s.split('/').map(Number)
      if (!D || !M || !Y) return null
      return toMidnightUTC(Y, M, D)
    }
    return null
  }



  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('') // Clear error on change
  }

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    if (!isConnected || !walletAddress) {
      setError('Please connect your wallet before creating a campaign')
      setIsSubmitting(false)
      return
    }

    // Require completed profile (username + wallet address) before creating campaign
    try {
      const user = await api.getUser(walletAddress.toLowerCase())
      if (!user?.username) {
        setIsSubmitting(false)
        setError('Please set up your profile before creating a campaign')
        navigate('/profile')
        return
      }
    } catch {
      setIsSubmitting(false)
      setError('Please set up your profile before creating a campaign')
      navigate('/profile')
      return
    }

    try {
      // Parse overall goal
      const overallGoal = parseAmount(formData.overallGoal)
      if (overallGoal < 1) {
        setError('Overall goal must be at least 1 ETH')
        setIsSubmitting(false)
        return
      }

      // Parse milestones from form data
      const milestones = []
      if (formData.milestone1) {
        const amount = parseAmount(formData.milestone1)
        if (amount > 0) {
          if (amount > overallGoal) {
            setError('Milestone 1 cannot exceed the overall goal')
            setIsSubmitting(false)
            return
          }
          milestones.push(amount)
        }
      }

      // Deadline validation
      const deadlineDate = parseDateStrict(formData.deadline)
      if (!deadlineDate) {
        setError("Please choose a valid deadline")
        setIsSubmitting(false)
        return
      }

      // Add overall goal as the final milestone if not already included
      if (!milestones.includes(overallGoal)) {
        milestones.push(overallGoal)
      }

      // Milestone 1 amount validation
      if (formData.milestone1) {
        const m1 = parseAmount(formData.milestone1)
        if (m1 <= 0) {
          setError('Milestone 1 must be greater than 0')
          setIsSubmitting(false); return
        }
        if (m1 > overallGoal) {
          setError('Milestone 1 cannot exceed the overall goal')
          setIsSubmitting(false); return
        }
      }

      // Convert deadline to Unix timestamp
      const deadlineTimestamp = Math.floor(deadlineDate / 1000)

      // Organizer's connected wallet address
      const organizerAddress = walletAddress.toLowerCase()

      const campaignData = {
        name: formData.campaignTitle,
        description: formData.description,
        image: imagePreview || null, // Include base64 image
        organizer: organizerAddress,
        deadline: deadlineTimestamp,
        milestones: milestones
      }

      console.log('Creating campaign:', campaignData)

      const response = await api.createCampaign(campaignData)

      console.log('Campaign created:', response)

      // Show success message
      alert(`Campaign "${formData.campaignTitle}" created successfully!`)

      // If embedded, call the provided callback instead of navigation
      if (onDone) {
        onDone(response)
      } else {
        // Navigate to campaigns page
        navigate('/campaigns')
      }
    } catch (err) {
      console.error('Error creating campaign:', err)
      setError(err.message || 'Failed to create campaign. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClear = () => {
    setFormData({
      campaignTitle: '',
      description: '',
      overallGoal: '',
      deadline: '',
      milestone1: '',
    })
    setImagePreview(null)
    // Clear file input
    const fileInput = document.getElementById('image-upload')
    if (fileInput) fileInput.value = ''
  }

  return (
    <div className="create-campaign-container">
      {showTitle && <h1 className="create-campaign-title">Create a Campaign</h1>}

      {error && (
        <div className="error-message" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <form className="create-campaign-form" onSubmit={handleSubmit}>
        {/* Image Upload */}
        <div className="form-row">
          <label className="form-label">Attach an Image:</label>
          <div className="image-upload-container">
            <input
              type="file"
              id="image-upload"
              className="image-upload-input"
              accept="image/*"
              onChange={handleImageUpload}
            />
            <label htmlFor="image-upload" className="image-upload-dropzone">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="upload-preview-img" />
              ) : (
                <span className="upload-placeholder">Attach a file</span>
              )}
            </label>
          </div>
        </div>

        {/* Campaign Title */}
        <div className="form-row">
          <label className="form-label">Campaign Title:</label>
          <input
            type="text"
            className="form-input"
            value={formData.campaignTitle}
            onChange={(e) => handleChange('campaignTitle', e.target.value)}
            required
          />
        </div>

        {/* Campaign Description */}
        <div className="form-row">
          <label className="form-label">Description:</label>
          <textarea
            className="form-input form-textarea"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Describe your campaign..."
            rows="4"
            required
          />
        </div>

        {/* Overall Goal */}
        <div className="form-row">
          <label className="form-label">Overall Goal (ETH):</label>
          <input
            type="text"
            className="form-input"
            value={formData.overallGoal}
            onChange={(e) => handleChange('overallGoal', e.target.value)}
            placeholder="e.g., 100 ETH"
            required
          />
        </div>

        {/* Deadline */}
        <div className="form-row">
          <label className="form-label">Deadline:</label>
          <input
            type="date"
            className="form-input"
            value={formData.deadline}
            onChange={(e) => handleChange('deadline', e.target.value)}
            required
          />
        </div>

        {/* Milestone 1 */}
        <div className="form-row">
          <label className="form-label">
            Milestone 1:<br />
            <span className="form-label-optional">(optional)</span>
          </label>
          <input
            type="text"
            className="form-input"
            value={formData.milestone1}
            onChange={(e) => handleChange('milestone1', e.target.value)}
            placeholder="e.g., 100 ETH"
          />
        </div>

        {/* Action Buttons */}
        <div className="form-actions">
          {(!isConnected || !walletAddress) && (
            <div className="notice">
              Connect your wallet to continue.
              <span style={{ marginLeft: 8 }}><ConnectWalletButton /></span>
            </div>
          )}

          <button 
            type="submit" 
            className="form-btn form-btn-submit"
            disabled={!isConnected || !walletAddress || isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Save and confirm'}
          </button>
          <button type="button" className="form-btn form-btn-clear" onClick={handleClear} disabled={isSubmitting}>
            Clear
          </button>
        </div>
      </form>
    </div>
  )
}