import React, { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';

const StockScreener = ({ allStocks }) => {
  const [filters, setFilters] = useState({
    sector: '',
    minPeRatio: '',
    maxPeRatio: '',
    minDividendYield: '',
  });
  const [filteredStocks, setFilteredStocks] = useState(allStocks || []);

  // Extrahera unika sektorer för dropdown
  const sectors = [...new Set(allStocks?.map(stock => stock.sector).filter(Boolean) || [])];

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    // TODO: Implementera den faktiska filtreringslogiken här
    // Just nu visar den bara alla aktier
    console.log("Applicerar filter:", filters);
    setFilteredStocks(allStocks || []); 
    // Exempel på hur filtrering kan se ut (behöver dock riktig data i allStocks):
    /*
    const result = allStocks.filter(stock => {
      let pass = true;
      if (filters.sector && stock.sector !== filters.sector) pass = false;
      if (filters.minPeRatio && stock.peRatio < parseFloat(filters.minPeRatio)) pass = false;
      if (filters.maxPeRatio && stock.peRatio > parseFloat(filters.maxPeRatio)) pass = false;
      if (filters.minDividendYield && stock.dividendYield < parseFloat(filters.minDividendYield)) pass = false;
      return pass;
    });
    setFilteredStocks(result);
    */
  };

  return (
    <div className="p-6 h-full overflow-y-auto bg-gray-900/20 text-white">
      <h2 className="text-xl font-bold flex items-center mb-6">
        <SlidersHorizontal className="mr-2" />
        Aktie-screener
      </h2>

      {/* Filter Controls */}
      <div className="bg-gray-800/50 p-4 rounded-lg shadow border border-gray-700/50 mb-6">
        <h3 className="text-lg font-semibold mb-4">Filter</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          {/* Sektor */}
          <div>
            <label htmlFor="sector" className="block text-gray-400 text-xs mb-1">Sektor</label>
            <select 
              id="sector" 
              name="sector" 
              value={filters.sector} 
              onChange={handleFilterChange}
              className="form-select"
            >
              <option value="">Alla sektorer</option>
              {sectors.map(sector => <option key={sector} value={sector}>{sector}</option>)}
            </select>
          </div>
          
          {/* P/E Ratio */}
          <div>
            <label className="block text-gray-400 text-xs mb-1">P/E-tal (intervall)</label>
            <div className="flex gap-2">
              <input 
                type="number" 
                name="minPeRatio" 
                placeholder="Min" 
                value={filters.minPeRatio} 
                onChange={handleFilterChange}
                className="form-input"
              />
              <input 
                type="number" 
                name="maxPeRatio" 
                placeholder="Max" 
                value={filters.maxPeRatio} 
                onChange={handleFilterChange}
                className="form-input"
              />
            </div>
          </div>
          
          {/* Direktavkastning */}
          <div>
            <label htmlFor="minDividendYield" className="block text-gray-400 text-xs mb-1">Lägsta direktavkastning (%)</label>
            <input 
              type="number" 
              id="minDividendYield"
              name="minDividendYield" 
              placeholder="T.ex. 2.5" 
              value={filters.minDividendYield} 
              onChange={handleFilterChange}
              className="form-input"
            />
          </div>
          
          {/* Apply Button */}
          <div className="flex items-end">
            <button 
              onClick={applyFilters} 
              className="btn btn-primary w-full"
            >
              Applicera filter
            </button>
          </div>
        </div>
      </div>

      {/* Result Table Placeholder */}
      <div className="bg-gray-800/50 rounded-lg shadow border border-gray-700/50">
        <h3 className="text-lg font-semibold p-4 border-b border-gray-700">Resultat ({filteredStocks.length})</h3>
        {/* TODO: Lägg till en tabell här för att visa 'filteredStocks' */}
        {/* Denna tabell bör likna den i StockApp.jsx men visa data baserat på de filtrerade aktierna */}
        <div className="p-4 text-gray-400">
          Tabell med filtrerade aktier kommer här...
        </div>
      </div>
    </div>
  );
};

export default StockScreener; 