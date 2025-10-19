import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import Campaign from './pages/Campaign'
import Donate from './pages/Donate'
import NotificationsBell from './components/NotificationsBell'
import { useAccountWC } from './hooks/useAccount'
import { useEffect } from 'react'
import { initWallet } from './lib/wallet'

export default function App() {
  // Address of the connected wallet
  const account = useAccountWC()

  // Ensure Web3Modal is initialized once on app load
  useEffect(() => { initWallet() }, [])

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between p-4 border-b">
        <Link to="/" className="font-bold">Donations App</Link>
        <div className="flex items-center gap-3">
          <NotificationsBell account={account} />
          <w3m-button />
        </div>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/campaign/:address" element={<Campaign />} />
          <Route path="/campaign/:address/donate" element={<Donate />} />
        </Routes>
      </main>
    </div>
  )
}