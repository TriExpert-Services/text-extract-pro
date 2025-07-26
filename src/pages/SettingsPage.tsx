import React, { useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { useAuth } from '../contexts/AuthContext'
import { Key, User, Palette, Database, Shield, Save } from 'lucide-react'
import toast from 'react-hot-toast'

export function SettingsPage() {
  const { openaiApiKey, setOpenaiApiKey, isDarkMode, toggleDarkMode } = useApp()
  const { user } = useAuth()
  const [apiKey, setApiKey] = useState(openaiApiKey)
  const [showApiKey, setShowApiKey] = useState(false)

  const handleSaveApiKey = () => {
    setOpenaiApiKey(apiKey)
    toast.success('OpenAI API key saved successfully!')
  }

  const maskApiKey = (key: string) => {
    if (!key) return ''
    if (key.length <= 8) return key
    return key.substring(0, 8) + '•'.repeat(Math.min(key.length - 8, 20))
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Settings
        </h1>
        <p className={`mt-2 text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Manage your account preferences and API configurations
        </p>
      </div>

      <div className="space-y-6">
        {/* User Profile */}
        <div className={`rounded-xl shadow-sm p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center space-x-3 mb-4">
            <User className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              User Profile
            </h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Email Address
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className={`mt-1 block w-full px-3 py-3 border rounded-lg shadow-sm ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-gray-300'
                    : 'bg-gray-50 border-gray-300 text-gray-500'
                } cursor-not-allowed`}
              />
            </div>
          </div>
        </div>

        {/* OpenAI API Configuration */}
        <div className={`rounded-xl shadow-sm p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center space-x-3 mb-4">
            <Key className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              OpenAI API Configuration
            </h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                API Key
              </label>
              <div className="mt-1 relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className={`block w-full px-3 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className={`absolute right-3 top-3 text-sm ${
                    isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {showApiKey ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Your OpenAI API key is required for text extraction from images and text enhancement.
                {openaiApiKey && (
                  <span className="block mt-1">
                    Current key: {maskApiKey(openaiApiKey)}
                  </span>
                )}
              </p>
            </div>
            
            <button
              onClick={handleSaveApiKey}
              disabled={!apiKey}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <Save className="h-4 w-4" />
              <span>Save API Key</span>
            </button>
          </div>
        </div>

        {/* Appearance */}
        <div className={`rounded-xl shadow-sm p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center space-x-3 mb-4">
            <Palette className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Appearance
            </h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Dark Mode
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Toggle between light and dark theme
                </p>
              </div>
              <button
                onClick={toggleDarkMode}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  isDarkMode ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isDarkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Database Status */}
        <div className={`rounded-xl shadow-sm p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center space-x-3 mb-4">
            <Database className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Database Connection
            </h2>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="h-3 w-3 bg-green-400 rounded-full"></div>
            </div>
            <div>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-green-300' : 'text-green-600'}`}>
                Connected to Supabase
              </p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Your extractions and analytics are being saved securely
              </p>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className={`rounded-xl shadow-sm p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center space-x-3 mb-4">
            <Shield className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Security & Privacy
            </h2>
          </div>
          
          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Data Protection
              </h3>
              <ul className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} space-y-1`}>
                <li>• Your files and extracted text are stored securely in Supabase</li>
                <li>• API keys are stored locally in your browser</li>
                <li>• All data transmission is encrypted with HTTPS</li>
                <li>• You can delete your extractions at any time</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}