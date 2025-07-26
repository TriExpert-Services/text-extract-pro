import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useApp } from '../../contexts/AppContext'
import { FileText, BarChart3, History, Settings, LogOut, Moon, Sun } from 'lucide-react'

export function Navbar() {
  const { user, signOut } = useAuth()
  const { isDarkMode, toggleDarkMode } = useApp()
  const location = useLocation()

  const navigation = [
    { name: 'Extract', href: '/extract', icon: FileText },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'History', href: '/history', icon: History },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className={`${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border-b transition-colors duration-200`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/extract" className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-blue-600" />
              <span className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                TextExtract Pro
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isActive(item.href)
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : isDarkMode
                      ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-md transition-colors duration-200 ${
                isDarkMode
                  ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            <div className="flex items-center space-x-3">
              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {user?.email}
              </span>
              <button
                onClick={signOut}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  isDarkMode
                    ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}