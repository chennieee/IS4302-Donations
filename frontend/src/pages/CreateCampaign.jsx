// Create Campaign page - Form to create a new campaign
// Includes image upload, campaign details, and milestone settings

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAccountWallet } from '../hooks/useAccount'

export default function CreateCampaign() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    campaignTitle: '',
    description: '',
    overallGoal: '',
    dateline: '',
    milestone1: '',
    milestone1Deadline: '',
    milestone2: '',
    milestone2Deadline: ''
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('') // Clear error on change
  }

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      // Create preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const parseAmount = (amountStr) => {
    // Remove "ETH" and any non-numeric characters except decimal point
    const cleaned = amountStr.replace(/[^0-9.]/g, '')
    return parseFloat(cleaned) || 0
  }

  const walletAddress = useAccountWallet()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    if (!walletAddress) {
      setError('Please connect your wallet to create a campaign')
      setIsSubmitting(false)
      return
    }

    try {
      // Parse overall goal
      const overallGoal = parseAmount(formData.overallGoal)
      if (overallGoal <= 0) {
        setError('Overall goal must be greater than 0 ETH')
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
      if (formData.milestone2) {
        const amount = parseAmount(formData.milestone2)
        if (amount > 0) {
          if (amount > overallGoal) {
            setError('Milestone 2 cannot exceed the overall goal')
            setIsSubmitting(false)
            return
          }
          milestones.push(amount)
        }
      }

      // Add overall goal as the final milestone if not already included
      if (!milestones.includes(overallGoal)) {
        milestones.push(overallGoal)
      }

      // Sort milestones in ascending order
      milestones.sort((a, b) => a - b)

      // Convert deadline to Unix timestamp
      const deadlineTimestamp = Math.floor(new Date(formData.dateline).getTime() / 1000)

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

      // Navigate to campaigns page
      navigate('/campaigns')
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
      dateline: '',
      milestone1: '',
      milestone1Deadline: '',
      milestone2: '',
      milestone2Deadline: ''
    })
    setImageFile(null)
    setImagePreview(null)
    // Clear file input
    const fileInput = document.getElementById('image-upload')
    if (fileInput) fileInput.value = ''
  }

  return (
    <div className="create-campaign-container">
      <h1 className="create-campaign-title">Create a Campaign</h1>

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

        {/* Dateline */}
        <div className="form-row">
          <label className="form-label">Dateline:</label>
          <input
            type="date"
            className="form-input"
            value={formData.dateline}
            onChange={(e) => handleChange('dateline', e.target.value)}
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

        {/* Milestone 1 Deadline */}
        <div className="form-row">
          <label className="form-label">Milestone 1 deadline:</label>
          <input
            type="date"
            className="form-input"
            value={formData.milestone1Deadline}
            onChange={(e) => handleChange('milestone1Deadline', e.target.value)}
            disabled={!formData.milestone1}
          />
        </div>

        {/* Milestone 2 */}
        <div className="form-row">
          <label className="form-label">
            Milestone 2:<br />
            <span className="form-label-optional">(optional)</span>
          </label>
          <input
            type="text"
            className="form-input"
            value={formData.milestone2}
            onChange={(e) => handleChange('milestone2', e.target.value)}
            placeholder="e.g., 200 ETH"
          />
        </div>

        {/* Milestone 2 Deadline */}
        <div className="form-row">
          <label className="form-label">Milestone 2 deadline:</label>
          <input
            type="date"
            className="form-input"
            value={formData.milestone2Deadline}
            onChange={(e) => handleChange('milestone2Deadline', e.target.value)}
            disabled={!formData.milestone2}
          />
        </div>

        {/* Action Buttons */}
        <div className="form-actions">
          <button type="submit" className="form-btn form-btn-submit" disabled={isSubmitting}>
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
