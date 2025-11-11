import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function SidebarLayout({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const location = useLocation()

  const navItems = [
  { path: '/campaigns', label: 'All Campaigns' },
  { path: '/my-donations', label: 'My Donations' },
  { path: '/my-campaigns', label: 'My Campaigns' },
  { path: '/notifications', label: 'Notifications' }, 
  { path: '/profile', label: 'My Profile' }
  ]

  const isActive = (path) => location.pathname === path

  return (
    <div className="sidebar-layout">
      {/* Collapsible Sidebar */}
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <button
          className="sidebar-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {isCollapsed ? (
              <path d="M9 18l6-6-6-6" />
            ) : (
              <path d="M15 18l-6-6 6-6" />
            )}
          </svg>
        </button>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-nav-item ${isActive(item.path) ? 'active' : ''}`}
              title={isCollapsed ? item.label : undefined}
            >
              {!isCollapsed && item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="sidebar-main-content">
        {children}
      </main>
    </div>
  )
}
