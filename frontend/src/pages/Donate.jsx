import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import DonateButton from '../components/DonateButton'

export default function Donate() {
  const { address } = useParams()
  const navigate = useNavigate()
  const [amount, setAmount] = useState('')
  const [err, setErr] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSuccess = () => {
    setErr('')
    setSuccess(true)

    // Show success message briefly, then redirect to campaign page
    setTimeout(() => {
      navigate(`/campaign/${address}`)
    }, 2000)
  }

  return (
    <div className="donation-page">
      <Link to={`/campaign/${address}`} className="campaign-back-button">
        ← Back to campaign
      </Link>

      <h1 className="donation-title">Donate</h1>

      {success ? (
        <div className="success-message" style={{
          padding: '1rem',
          backgroundColor: '#86efac',
          borderRadius: '0.5rem',
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          <p style={{ margin: 0, fontWeight: 600 }}>✓ Donation successful!</p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
            Redirecting to campaign page...
          </p>
        </div>
      ) : (
        <>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount in ETH"
            className="input"
          />

          <div className="mt-2">
            <DonateButton
              campaignAddr={address}
              amountEth={amount}
              className="btn btn-primary"
              onError={setErr}
              onSuccess={handleSuccess}
            />
          </div>

          {err && <div className="error-text">{err}</div>}
        </>
      )}
    </div>
  )
}
