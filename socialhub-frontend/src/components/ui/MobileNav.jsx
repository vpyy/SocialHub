import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

/**
 * Mobile Navigation Component
 * Bottom tab bar for mobile screens (shown only on mobile)
 */
export default function MobileNav({ navItems, profilePath }) {
  const location = useLocation()
  const isActive = (path) => location.pathname === path

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 z-40">
      <div className="flex justify-around items-center h-16">
        {navItems.slice(0, 5).map((item) => {
          const path = item.path === 'PROFILE' ? profilePath : item.path
          return (
            <Link
              key={path}
              to={path}
              className={`
                flex flex-col items-center justify-center gap-1 w-full h-full
                transition-colors duration-150
                ${isActive(path)
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }
              `}
              title={item.label}
            >
              <span className="material-symbols-outlined text-[24px]">
                {item.icon}
              </span>
              <span className="text-[10px] font-medium truncate">
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
