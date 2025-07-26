import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AppProvider, useApp } from './contexts/AppContext'
import { AuthForm } from './components/Auth/AuthForm'
import { Navbar } from './components/Layout/Navbar'
import { ExtractPage } from './pages/ExtractPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { HistoryPage } from './pages/HistoryPage'
import { SettingsPage } from './pages/SettingsPage'

function AppContent() {
  const { user, loading } = useAuth()
  const { isDarkMode } = useApp()

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return <AuthForm />
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-200`}>
      <Navbar />
      <main>
        <Routes>
          <Route path="/extract" element={<ExtractPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/" element={<Navigate to="/extract" replace />} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <AppProvider>
      <AuthProvider>
        <Router>
          <AppContent />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </Router>
      </AuthProvider>
    </AppProvider>
  )
}

export default App