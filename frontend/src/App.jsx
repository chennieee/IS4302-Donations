import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import Campaign from './pages/Campaign'
import Donate from './pages/Donate'
import NotificationsBell from './components/NotificationsBell'
//import { useAccountWC } from './hooks/useAccount'
import { useEffect } from 'react'
import { initWallet } from './lib/wallet'

export default function App() {
  // Address of the connected wallet
  //const account = useAccountWC()

  // Ensure Web3Modal is initialized once on app load
  useEffect(() => { initWallet() }, [])

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container" style={{display:'flex',alignItems:'center',justifyContent:'space-between',height:64}}>
          <span className="font-bold">Home</span>
          <div style={{display:'flex',gap:12,alignItems:'center'}}>
            <w3m-button />
          </div>
        </div>
      </header>

      <main>
        <div className="container" style={{padding:'16px 0'}}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/campaign/:address" element={<Campaign />} />
            <Route path="/campaign/:address/donate" element={<Donate />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}