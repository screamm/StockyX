import React from 'react'
import './App.css'
import StockApp from './components/StockApp'
import { LineChart, Sun, Moon } from 'lucide-react'
import { useTheme } from './components/ThemeProvider'

function App() {
  const { theme, toggleTheme } = useTheme();
  
  // Bestäm vilken ikon som ska visas baserat på aktuellt tema
  const getThemeIcon = () => {
    return theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />;
  };

  // Anpassad toggle som bara växlar mellan ljust och mörkt
  const handleToggleTheme = () => {
    toggleTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="app-container bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen flex flex-col w-full">
      <header className="app-header bg-gray-100 dark:bg-gray-800 shadow-md z-10 sticky top-0 border-b dark:border-gray-700">
        <div className="logo-container flex items-center">
          <div className="logo">
            <LineChart size={28} className="text-blue-600 dark:text-blue-500" />
          </div>
          <div className="app-header-content">
            <h1 className="text-gray-900 dark:text-white">StockyX</h1>
            <p className="tagline text-gray-600 dark:text-gray-400">Aktiemarknaden i realtid</p>
          </div>
        </div>
        <div className="app-header-buttons">
          <button 
            onClick={handleToggleTheme}
            className="p-2 cursor-pointer transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
            aria-label="Byt tema"
            title={`Nuvarande tema: ${theme}`}
          >
            {getThemeIcon()}
          </button>
        </div>
      </header>
      <main className="app-content flex-grow overflow-auto">
        <StockApp />
      </main>
      <footer className="app-footer bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-t dark:border-gray-700 p-3 text-xs text-center">
        © {new Date().getFullYear()} StockyX - Aktieinformation via Backend Proxy
      </footer>
    </div>
  )
}

export default App
