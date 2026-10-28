import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from '../components/common/Sidebar'
import { MobileNav } from '../components/ui'

/**
 * Responsive Layout
 * - Sidebar visible on md+ screens
 * - Mobile bottom nav visible on mobile
 */
export default function ResponsiveLayout({ children, user, navigate }) {
  const location = useLocation()

  const profilePath = user?.username ? `/profile/${user.username}` : '/profile/me'

  const navItems = [
    { icon: 'home', label: 'Home', path: '/', fill: true },
    { icon: 'tag', label: 'Explore', path: '/search', fill: false },
    { icon: 'notifications', label: 'Notifications', path: '/notifications', fill: false },
    { icon: 'chat_bubble', label: 'Messages', path: '/messages', fill: false },
    { icon: 'bookmark', label: 'Bookmarks', path: '/bookmarks', fill: false },
    { icon: 'person', label: 'Profile', path: 'PROFILE', fill: false },
    { icon: 'settings', label: 'Settings', path: '/settings', fill: false },
  ]

  return (
    <div className="flex h-screen bg-white dark:bg-slate-950 overflow-hidden">
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden md:block md:w-64 md:flex-shrink-0 md:border-r md:border-gray-200 md:dark:border-slate-700">
        <Sidebar user={user} navigate={navigate} location={location} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden mb-16 md:mb-0">
        {children}
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav navItems={navItems} profilePath={profilePath} />
    </div>
  )
}
