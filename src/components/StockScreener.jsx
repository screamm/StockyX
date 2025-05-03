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
  
  // Lägg till nya states för pris, volym, och förändringsprocent
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [volumeMin, setVolumeMin] = useState('');
  const [volumeMax, setVolumeMax] = useState('');
  const [changePercentMin, setChangePercentMin] = useState('');
  const [changePercentMax, setChangePercentMax] = useState('');

  // Extrahera unika sektorer för dropdown
  const sectors = [...new Set(allStocks?.map(stock => stock.sector).filter(Boolean) || [])];

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
      sector: '',
      minPeRatio: '',
      maxPeRatio: '',
      minDividendYield: ''
    });
    setPriceMin('');
    setPriceMax('');
    setVolumeMin('');
    setVolumeMax('');
    setChangePercentMin('');
    setChangePercentMax('');
  };

  const applyFilters = () => {
    // TODO: Implementera den faktiska filtreringslogiken här
    // Just nu visar den bara alla aktier
    console.log("Applicerar filter:", filters);
    console.log("Prisintervall:", priceMin, priceMax);
    console.log("Volymintervall:", volumeMin, volumeMax);
    console.log("Förändringsintervall:", changePercentMin, changePercentMax);
    
    setFilteredStocks(allStocks || []); 
    // Exempel på hur filtrering kan se ut (behöver dock riktig data i allStocks):
    /*
    const result = allStocks.filter(stock => {
      let pass = true;
      if (filters.sector && stock.sector !== filters.sector) pass = false;
      if (filters.minPeRatio && stock.peRatio < parseFloat(filters.minPeRatio)) pass = false;
      if (filters.maxPeRatio && stock.peRatio > parseFloat(filters.maxPeRatio)) pass = false;
      if (filters.minDividendYield && stock.dividendYield < parseFloat(filters.minDividendYield)) pass = false;
      if (priceMin && stock.price < parseFloat(priceMin)) pass = false;
      if (priceMax && stock.price > parseFloat(priceMax)) pass = false;
      if (volumeMin && stock.volume < parseFloat(volumeMin)) pass = false;
      if (volumeMax && stock.volume > parseFloat(volumeMax)) pass = false;
      if (changePercentMin && stock.changePercent < parseFloat(changePercentMin)) pass = false;
      if (changePercentMax && stock.changePercent > parseFloat(changePercentMax)) pass = false;
      return pass;
    });
    setFilteredStocks(result);
    */
  };

  return (
    <div className="p-6 h-full overflow-y-auto bg-gray-100 dark:bg-gray-900/20 text-gray-900 dark:text-white">
      <h2 className="text-xl font-bold flex items-center mb-6">
        <SlidersHorizontal className="mr-2" />
        Aktie-Screener
      </h2>

      {/* Filter Controls */}
      <div className="bg-white dark:bg-gray-800/50 p-4 border border-gray-200 dark:border-gray-700/50 mb-6 shadow">
        <h3 className="text-lg font-semibold mb-4">Filter</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Sektor Filter */}
          <div>
            <label htmlFor="sector" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sektor</label>
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
          
          {/* P/E Ratio Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">P/E-tal (intervall)</label>
            <div className="flex space-x-2">
              <input 
                type="number" 
                name="minPeRatio" 
                placeholder="Min" 
                value={filters.minPeRatio} 
                onChange={handleFilterChange}
                className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
              />
              <input 
                type="number" 
                name="maxPeRatio" 
                placeholder="Max" 
                value={filters.maxPeRatio} 
                onChange={handleFilterChange}
                className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
              />
            </div>
          </div>
          
          {/* Dividend Yield Filter */}
          <div>
            <label htmlFor="minDividendYield" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lägsta direktavkastning (%)</label>
            <input 
              type="number" 
              id="minDividendYield"
              name="minDividendYield" 
              placeholder="Min %" 
              value={filters.minDividendYield} 
              onChange={handleFilterChange}
              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
            />
          </div>
          
          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium mb-1">Kurs (SEK)</label>
            <div className="flex items-center space-x-2">
              <input 
                type="number"
                placeholder="Min"
                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value ? Number(e.target.value) : '')}
              />
              <span className="text-gray-500">-</span>
              <input 
                type="number"
                placeholder="Max"
                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value ? Number(e.target.value) : '')}
              />
            </div>
          </div>
          
          {/* Volume Range */}
          <div>
            <label className="block text-sm font-medium mb-1">Volym</label>
            <div className="flex items-center space-x-2">
              <input 
                type="number"
                placeholder="Min"
                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={volumeMin}
                onChange={(e) => setVolumeMin(e.target.value ? Number(e.target.value) : '')}
              />
              <span className="text-gray-500">-</span>
              <input 
                type="number"
                placeholder="Max"
                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={volumeMax}
                onChange={(e) => setVolumeMax(e.target.value ? Number(e.target.value) : '')}
              />
            </div>
          </div>
          
          {/* Change % Range */}
          <div>
            <label className="block text-sm font-medium mb-1">Förändring %</label>
            <div className="flex items-center space-x-2">
              <input 
                type="number"
                placeholder="Min"
                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={changePercentMin}
                onChange={(e) => setChangePercentMin(e.target.value ? Number(e.target.value) : '')}
              />
              <span className="text-gray-500">-</span>
              <input 
                type="number"
                placeholder="Max"
                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={changePercentMax}
                onChange={(e) => setChangePercentMax(e.target.value ? Number(e.target.value) : '')}
              />
            </div>
          </div>
        </div>
        
        {/* Reset and Apply Buttons */}
        <div className="flex justify-end space-x-3">
          <button 
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50 focus:outline-none"
            onClick={resetFilters}
          >
            Återställ
          </button>
          <button 
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 focus:outline-none"
            onClick={applyFilters}
          >
            Använd filter
          </button>
        </div>
      </div>

      {/* Result Table Placeholder */}
      <div className="bg-white dark:bg-gray-800/50 shadow border border-gray-200 dark:border-gray-700/50">
        <h3 className="text-lg font-semibold p-4 border-b border-gray-200 dark:border-gray-700">Resultat ({filteredStocks.length})</h3>
        {/* TODO: Lägg till en tabell här för att visa 'filteredStocks' */}
        {/* Denna tabell bör likna den i StockApp.jsx men visa data baserat på de filtrerade aktierna */}
        
        {/* Placeholder Content */}
        <div className="p-6 text-center text-gray-500 dark:text-gray-400">
          {filteredStocks.length === 0 ? (
            "Inga aktier matchar dina filterkriterier."
          ) : (
            "Här kommer resultatet att visas."
          )}
        </div>
      </div>
    </div>
  );
};

export default StockScreener; 