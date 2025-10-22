import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import DonateButton from '../components/DonateButton'

export default function Donate() {
  const { address } = useParams()
  const [amount, setAmount] = useState('')
  const [err, setErr] = useState('')

  return (
    <div className="donation-page">
      <Link to={`/campaign/${address}`} className="campaign-back-button">
        ← Back to campaign
      </Link>

      <h1 className="donation-title">Donate</h1>

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
          onSuccess={() => setErr('')}
        />
      </div>

      {err && <div className="error-text">{err}</div>}
    </div>
  )
}
