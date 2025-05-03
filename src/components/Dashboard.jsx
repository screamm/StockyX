import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart2, TrendingUp, TrendingDown, DollarSign, 
  RefreshCw, AlertTriangle, Clock, ArrowUpRight, ArrowDownRight 
} from 'lucide-react';
import { 
  fetchMarketIndex,
  fetchCurrencyRate,
  fetchTopMovers,
  formatNumber
} from '../services/apiService';

const Dashboard = ({ stockList }) => {
  // State
  const [indices, setIndices] = useState({}); 
  const [currencies, setCurrencies] = useState({}); 
  const [topMovers, setTopMovers] = useState({ gainers: [], losers: [] }); 
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Definitionsdata - Nu memoizerade för att undvika ESLint exhaustive-deps varningar
  const indexSymbols = useMemo(() => [
    { symbol: '^OMXS30', name: 'OMXS30', description: 'Stockholmsbörsens 30 mest omsatta aktier' },
    { symbol: '^GSPC', name: 'S&P 500', description: 'Standard & Poor\'s 500 index' },
    { symbol: '^IXIC', name: 'Nasdaq', description: 'Nasdaq Composite Index' },
    { symbol: '^DJI', name: 'Dow Jones', description: 'Dow Jones Industrial Average' },
  ], []);
  
  const currencyPairs = useMemo(() => [
    { from: 'USD', to: 'SEK', name: 'USD/SEK' },
    { from: 'EUR', to: 'SEK', name: 'EUR/SEK' },
    { from: 'GBP', to: 'SEK', name: 'GBP/SEK' },
    { from: 'NOK', to: 'SEK', name: 'NOK/SEK' },
  ], []);

  // Hämta alla data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // --- Hämta indexdata ---
        const indexData = {};
        for (let i = 0; i < indexSymbols.length; i++) {
          try {
            // Vi anropar utan apiKey eftersom det hanteras i proxy
            const data = await fetchMarketIndex(indexSymbols[i].symbol);
            if (data) {
              indexData[indexSymbols[i].symbol] = { 
                ...data, 
                name: indexSymbols[i].name, 
                description: indexSymbols[i].description 
              };
            }
            // Liten fördröjning för att inte överbelasta APIet
            if (i < indexSymbols.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 300));
            }
          } catch (err) {
            console.warn(`Kunde inte hämta index ${indexSymbols[i].symbol}:`, err);
          }
        }
        setIndices(indexData);

        // --- Hämta valutakurser ---
        // Notera: fetchCurrencyRate behöver implementeras på backend
        const currencyData = {};
        for (let i = 0; i < currencyPairs.length; i++) {
          try {
            const pair = currencyPairs[i];
            const data = await fetchCurrencyRate(pair.from, pair.to);
            if (data) {
              currencyData[`${pair.from}${pair.to}`] = { 
                ...data, 
                name: pair.name 
              };
            }
            // Liten fördröjning för att inte överbelasta APIet
            if (i < currencyPairs.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 300));
            }
          } catch (err) {
            console.warn(`Kunde inte hämta valutakurs ${currencyPairs[i].from}/${currencyPairs[i].to}:`, err);
          }
        }
        setCurrencies(currencyData);

        // --- Hämta top movers ---
        // Notera: fetchTopMovers behöver implementeras på backend
        if (stockList && stockList.length > 0) {
          try {
            const movers = await fetchTopMovers(stockList);
            setTopMovers(movers);
          } catch (err) {
            console.warn('Kunde inte hämta top movers:', err);
          }
        }
      } catch (err) {
        console.error("Fel vid hämtning av dashboarddata:", err);
        setError("Kunde inte hämta all data. Försök igen senare.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [stockList, indexSymbols, currencyPairs]); // Lagt till indexSymbols och currencyPairs som beroenden

  // Ladda/Fel-visning
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
        <RefreshCw className="animate-spin mx-auto mb-3 text-blue-500" size={24} />
        <p className="text-gray-500 dark:text-gray-400">Laddar översikt...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
        <AlertTriangle className="mx-auto mb-3 text-amber-500" size={24} />
        <p className="text-red-500 dark:text-red-400">{error}</p>
      </div>
    );
  }

  // Huvud-renderering
  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold flex items-center mb-4 text-blue-600 dark:text-blue-500">
        <BarChart2 className="mr-2 text-blue-500 dark:text-blue-400" />
        Marknadsöversikt
      </h2>

      {/* Index section */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-200">Marknadsindex</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {indexSymbols.map(indexInfo => {
            const indexData = indices[indexInfo.symbol];
            return (
              <div key={indexInfo.symbol} className="dashboard-placeholder bg-white dark:bg-gray-800 p-5 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-300">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-gray-800 dark:text-gray-200">{indexInfo.name}</h4>
                  {indexData ? (
                    <span className={`text-sm ${indexData.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {indexData.price && formatNumber(indexData.price)}
                    </span>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500 text-sm">--</span>
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-gray-500 dark:text-gray-400 text-xs truncate">{indexInfo.description}</p>
                  {indexData && indexData.changePercent && (
                    <span className={`text-xs flex items-center ${indexData.changePercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {indexData.changePercent >= 0 ? (
                        <ArrowUpRight size={12} className="mr-1" />
                      ) : (
                        <ArrowDownRight size={12} className="mr-1" />
                      )}
                      {indexData.changePercent >= 0 ? '+' : ''}
                      {formatNumber(indexData.changePercent)}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Currencies section */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-200">Valutor</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {currencyPairs.map(currencyInfo => {
            const currencyKey = `${currencyInfo.from}${currencyInfo.to}`;
            const currencyData = currencies[currencyKey];
            return (
              <div key={currencyKey} className="dashboard-placeholder bg-white dark:bg-gray-800 p-5 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-300">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-gray-800 dark:text-gray-200">{currencyInfo.name}</h4>
                  {currencyData ? (
                    <span className="text-gray-800 dark:text-gray-200 text-sm">
                      {currencyData.rate && formatNumber(currencyData.rate)}
                    </span>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500 text-sm">--</span>
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {currencyData ? 
                      `Uppdaterad: ${new Date(currencyData.lastUpdate).toLocaleString('sv-SE', { hour: '2-digit', minute: '2-digit' })}` : 
                      'Data ej tillgänglig (API)'
                    }
                  </span>
                  {currencyData && currencyData.changePercent && (
                    <span className={`text-xs flex items-center ${currencyData.changePercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {currencyData.changePercent >= 0 ? (
                        <ArrowUpRight size={12} className="mr-1" />
                      ) : (
                        <ArrowDownRight size={12} className="mr-1" />
                      )}
                      {currencyData.changePercent >= 0 ? '+' : ''}
                      {formatNumber(currencyData.changePercent)}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top movers section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gainers */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center text-gray-700 dark:text-gray-200">
            <TrendingUp size={18} className="mr-2 text-green-500" />
            Dagens vinnare
          </h3>
          <div className="dashboard-placeholder bg-white dark:bg-gray-800 p-5 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-300">
            {topMovers.gainers && topMovers.gainers.length > 0 ? (
              <div className="space-y-3">
                {topMovers.gainers.slice(0, 5).map(stock => (
                  <div key={stock.ticker} className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2 last:border-0 last:pb-0">
                    <div>
                      <div className="font-medium text-gray-800 dark:text-gray-200">{stock.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{stock.ticker}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-600 dark:text-green-400 font-medium">
                        +{formatNumber(stock.changePercent)}%
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {formatNumber(stock.price)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center">
                <span className="text-gray-500 dark:text-gray-400 text-sm">Data ej tillgänglig (API)</span>
              </div>
            )}
          </div>
        </div>
        {/* Losers */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center text-gray-700 dark:text-gray-200">
            <TrendingDown size={18} className="mr-2 text-red-500" />
            Dagens förlorare
          </h3>
          <div className="dashboard-placeholder bg-white dark:bg-gray-800 p-5 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-300">
            {topMovers.losers && topMovers.losers.length > 0 ? (
              <div className="space-y-3">
                {topMovers.losers.slice(0, 5).map(stock => (
                  <div key={stock.ticker} className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2 last:border-0 last:pb-0">
                    <div>
                      <div className="font-medium text-gray-800 dark:text-gray-200">{stock.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{stock.ticker}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-red-600 dark:text-red-400 font-medium">
                        {formatNumber(stock.changePercent)}%
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {formatNumber(stock.price)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center">
                <span className="text-gray-500 dark:text-gray-400 text-sm">Data ej tillgänglig (API)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center">
        <Clock size={12} className="mr-1"/> 
        Marknadsdata från Alpha Vantage (fördröjd)
      </div>
    </div>
  );
};

export default Dashboard; 