import React, { createContext, useContext, useState } from 'react'

interface AppContextType {
  openaiApiKey: string
  setOpenaiApiKey: (key: string) => void
  isDarkMode: boolean
  toggleDarkMode: () => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [openaiApiKey, setOpenaiApiKey] = useState(
    localStorage.getItem('openai_api_key') || ''
  )
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem('dark_mode') === 'true'
  )

  const handleSetOpenaiApiKey = (key: string) => {
    setOpenaiApiKey(key)
    localStorage.setItem('openai_api_key', key)
  }

  const toggleDarkMode = () => {
    const newMode = !isDarkMode
    setIsDarkMode(newMode)
    localStorage.setItem('dark_mode', newMode.toString())
  }

  const value = {
    openaiApiKey,
    setOpenaiApiKey: handleSetOpenaiApiKey,
    isDarkMode,
    toggleDarkMode
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}