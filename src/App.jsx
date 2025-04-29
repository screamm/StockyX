import { useState } from 'react'
import './App.css'
import StockApp from './components/StockApp'
import { LineChart, BarChart2 } from 'lucide-react'

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo-container">
          <div className="logo">
            <LineChart size={28} color="#3b82f6" />
          </div>
          <div className="app-header-content">
            <h1>StockyX</h1>
            <p className="tagline">Aktiemarknaden i realtid</p>
          </div>
        </div>
        <div className="app-header-buttons">
          <button className="btn btn-secondary">
            <BarChart2 size={16} className="mr-1 inline" />
            <span>Översikt</span>
          </button>
        </div>
      </header>
      <main className="app-content">
        <StockApp />
      </main>
      <footer className="app-footer">
        © {new Date().getFullYear()} StockyX - Aktieinformation med data från Alpha Vantage & NewsAPI
      </footer>
    </div>
  )
}

export default App
