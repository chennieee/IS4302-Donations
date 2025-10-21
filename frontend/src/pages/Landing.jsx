// Landing page - First page users see when they visit the site
// Shows the hero section with "GoFundThem" branding and a Start button

import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="landing-container">
      <div className="landing-content">
        <h1 className="landing-title">GoFundThem</h1>
        <p className="landing-subtitle">
          Where transparency is key
        </p>
        <Link to="/campaigns" className="landing-start-button">
          Start
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="landing-arrow-icon"
          >
            <path
              d="M7.5 15L12.5 10L7.5 5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>
    </div>
  )
}
