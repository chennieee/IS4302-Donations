import { Routes, Route, Link, useLocation } from 'react-router-dom'
import Landing from './pages/Landing'
import AllCampaigns from './pages/AllCampaigns'
import Campaign from './pages/Campaign'
import Donate from './pages/Donate'
import MyProfile from './pages/MyProfile'
import MyCampaigns from './pages/MyCampaigns'
import CreateCampaign from './pages/CreateCampaign'
import SidebarLayout from './components/SidebarLayout'
import ConnectWalletButton from './components/ConnectWalletButton'
import './index.css'

export default function App() {
  const location = useLocation()
  const isLandingPage = location.pathname === '/'

  return (
    <div className="app-container">
      {/* Only show header on non-landing pages */}
      {!isLandingPage && (
        <header className="app-header">
          <div className="header-content">
            <Link to="/" className="app-logo">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              </svg>
            </Link>
            <div className="header-actions">
              <ConnectWalletButton className="btn btn-primary" />
            </div>
          </div>
        </header>
      )}

      <main className={isLandingPage ? 'main-landing' : 'main-content'}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/campaigns" element={<AllCampaigns />} />
          <Route path="/campaign/:address" element={<Campaign />} />
          <Route path="/campaign/:address/donate" element={<Donate />} />
          <Route path="/my-donations" element={
            <SidebarLayout>
              <div className="placeholder-page">My Donations - Coming Soon</div>
            </SidebarLayout>
          } />
          <Route path="/my-campaigns" element={
            <SidebarLayout>
              <MyCampaigns />
            </SidebarLayout>
          } />
          <Route path="/create-campaign" element={
            <SidebarLayout>
              <CreateCampaign />
            </SidebarLayout>
          } />
          <Route path="/profile" element={
            <SidebarLayout>
              <MyProfile />
            </SidebarLayout>
          } />
        </Routes>
      </main>
    </div>
  )
}