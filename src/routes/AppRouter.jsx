// src/routes/AppRouter.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import HomePage        from '../pages/HomePage'
import LoginPage       from '../pages/LoginPage'
import DashboardPage   from '../pages/DashboardPage'
import MoodTrackingPage from '../pages/MoodTrackingPage'
import SelfHelpPage    from '../pages/SelfHelpPage'
import ChatPage        from '../pages/ChatPage'
import ProfilePage     from '../pages/ProfilePage'
import CommunityPage   from '../pages/CommunityPage'
import AdminDashboard  from '../pages/AdminDashboard'

/**
 * Protected — any signed-in user (including anonymous) can access.
 * If not signed in at all, redirect to /login.
 */
const Protected = ({ children }) => {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

/**
 * GuestOnly — redirect away from /login if already authenticated.
 * This prevents a logged-in user (including anonymous) from seeing the login page.
 */
const GuestOnly = ({ children }) => {
  const { user } = useAuth()
  return user ? <Navigate to="/dashboard" replace /> : children
}

export default function AppRouter() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"         element={<HomePage />} />
      <Route path="/selfhelp" element={<SelfHelpPage />} />
      <Route path="/chat"     element={<ChatPage />} />

      {/* Auth page — redirect away if already logged in */}
      <Route path="/login"    element={<GuestOnly><LoginPage /></GuestOnly>} />

      {/* Protected — works for both anonymous and registered users */}
      <Route path="/dashboard" element={<Protected><DashboardPage /></Protected>} />
      <Route path="/mood"      element={<Protected><MoodTrackingPage /></Protected>} />
      <Route path="/profile"   element={<Protected><ProfilePage /></Protected>} />
      <Route path="/community" element={<Protected><CommunityPage /></Protected>} />
      <Route path="/admin"     element={<Protected><AdminDashboard /></Protected>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
