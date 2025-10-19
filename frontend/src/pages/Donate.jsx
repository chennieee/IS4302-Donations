// Donation page: sends a donation request to backend.
// Backend performs contract interactions and indexer updates DB.
// Amount is ETH (string). Backend should convert to wei and call a payable function.

import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { useAccountWC } from '../hooks/useAccount'

export default function Donate() {
  const { address: campaignAddress } = useParams()
  const account = useAccountWC()
  const [amountEth, setAmountEth] = useState('')  // keep as string, e.g., "0.1"
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setBusy(true); setMsg('')
    try {
      // Tell backend to execute a payable donate on-chain (ETH-based)
      await api.donate({ fromAddress: account, campaignAddress, amountEth })
      setMsg('Donation submitted. It will appear once backend confirms on-chain.')
      setAmountEth('')
    } catch (e) {
      setMsg(e.message)
    } finally { setBusy(false) }
  }

  return (
    <div className="p-6 space-y-3 max-w-sm">
      <h1 className="text-xl font-semibold">Donate</h1>

      <form onSubmit={onSubmit} className="space-y-2">
        <input
          className="w-full border rounded-xl p-2"
          placeholder="Amount (ETH)"
          value={amountEth}
          onChange={e=>setAmountEth(e.target.value)}
          required
        />
        <button disabled={busy || !account} className="px-4 py-2 rounded-xl border hover:shadow-sm">
          {busy ? 'Submitting…' : account ? 'Donate' : 'Connect wallet first'}
        </button>
      </form>

      {msg && <div className="text-sm">{msg}</div>}
    </div>
  )
}