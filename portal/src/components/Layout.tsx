import { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../auth'

export default function Layout({ children }: { children: ReactNode }) {
  const { user, accountType, demo, signOut } = useAuth()
  const signedIn = Boolean(user || demo)
  const showPartnerOnboarding = demo || accountType === 'partner'
  const showCareerProfile = demo || !accountType || accountType === 'veteran'
  const showStaffVerification = demo || accountType === 'staff'
  const previewHost = window.location.hostname.includes('deploy-preview') || window.location.hostname === 'localhost'

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/dashboard" className="brand portal-brand" aria-label="CareForVets portal home">
          <img src="/careforvets-logo.png" alt="CareForVets" className="portal-logo" />
          <span className="portal-label">Portal</span>
        </NavLink>
        <nav aria-label="Portal navigation">
          <NavLink to="/care">Care</NavLink>
          <NavLink to="/careers">Careers</NavLink>
          <NavLink to="/resources">Resources</NavLink>
          <NavLink to="/partners">Partners</NavLink>
          {signedIn && showPartnerOnboarding && <NavLink to="/partner/onboarding">Partner onboarding</NavLink>}
          {signedIn && showStaffVerification && <NavLink to="/admin/partner-verification">Verification</NavLink>}
          {signedIn && showCareerProfile && <NavLink to="/career-profile">My profile</NavLink>}
          {!signedIn && <NavLink to="/login">Sign in</NavLink>}
          {signedIn && <button className="nav-button" onClick={() => void signOut()}>{demo ? 'Exit test mode' : 'Sign out'}</button>}
        </nav>
      </header>
      <div className="dev-banner">
        {demo
          ? 'TEST MODE · synthetic browser-local data · do not enter real personal, tax, or clinical information'
          : previewHost
            ? 'BUILD v2 PREVIEW · non-PHI environment · do not enter diagnoses, medications, medical records, or real tax documents'
            : 'CareForVets Portal · non-PHI workflow · clinical records do not belong in this system'}
      </div>
      <main className="page">{children}</main>
    </div>
  )
}
