import { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../auth'

export default function Layout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth()

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/dashboard" className="brand" aria-label="CareForVets portal home">
          <span className="brand-star">★</span>
          <span><strong>CareForVets</strong><small>Portal</small></span>
        </NavLink>
        <nav aria-label="Portal navigation">
          <NavLink to="/care">Care</NavLink>
          <NavLink to="/careers">Careers</NavLink>
          <NavLink to="/resources">Resources</NavLink>
          <NavLink to="/partners">Partners</NavLink>
          {user ? <NavLink to="/career-profile">My profile</NavLink> : <NavLink to="/login">Sign in</NavLink>}
          {user && <button className="nav-button" onClick={() => void signOut()}>Sign out</button>}
        </nav>
      </header>
      <div className="dev-banner">
        BUILD v2 · non-PHI development environment · do not enter diagnoses, medications, medical records, or other clinical information
      </div>
      <main className="page">{children}</main>
    </div>
  )
}
