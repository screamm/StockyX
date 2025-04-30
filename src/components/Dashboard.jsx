import React, { useState, useEffect } from 'react';
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

const Dashboard = ({ apiKey, stockList }) => {
  // State
  const [indices, setIndices] = useState({});
  const [currencies, setCurrencies] = useState({});
  const [topMovers, setTopMovers] = useState({ gainers: [], losers: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // De index vi vill visa
  const indexSymbols = [
    { symbol: '^OMXS30', name: 'OMXS30', description: 'Stockholmsbörsens 30 mest omsatta aktier' },
    { symbol: '^GSPC', name: 'S&P 500', description: 'Standard & Poor\'s 500 index' },
    { symbol: '^IXIC', name: 'Nasdaq', description: 'Nasdaq Composite Index' },
    { symbol: '^DJI', name: 'Dow Jones', description: 'Dow Jones Industrial Average' },
  ];

  // De valutor vi vill visa
  const currencyPairs = [
    { from: 'USD', to: 'SEK', name: 'USD/SEK' },
    { from: 'EUR', to: 'SEK', name: 'EUR/SEK' },
    { from: 'GBP', to: 'SEK', name: 'GBP/SEK' },
    { from: 'NOK', to: 'SEK', name: 'NOK/SEK' },
  ];

  // Hämta alla data
  useEffect(() => {
    const fetchData = async () => {
      if (!apiKey || apiKey === 'YOUR_ALPHA_VANTAGE_KEY') {
        setError("Alpha Vantage API-nyckel saknas");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Hämta indexdata
        const indexData = {};
        for (let i = 0; i < indexSymbols.length; i++) {
          const data = await fetchMarketIndex(indexSymbols[i].symbol, apiKey);
          if (data) {
            indexData[indexSymbols[i].symbol] = {
              ...data,
              name: indexSymbols[i].name,
              description: indexSymbols[i].description
            };
          }
          
          // Fördröj för att inte nå API-gränser
          if (i < indexSymbols.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
        }
        setIndices(indexData);

        // Hämta valutakurser
        const currencyData = {};
        for (let i = 0; i < currencyPairs.length; i++) {
          const pair = currencyPairs[i];
          const data = await fetchCurrencyRate(pair.from, pair.to, apiKey);
          if (data) {
            currencyData[`${pair.from}${pair.to}`] = {
              ...data,
              name: pair.name
            };
          }
          
          // Fördröj för att inte nå API-gränser
          if (i < currencyPairs.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
        }
        setCurrencies(currencyData);

        // Hämta top movers
        if (stockList && stockList.length > 0) {
          const movers = await fetchTopMovers(stockList, apiKey);
          setTopMovers(movers);
        }

      } catch (err) {
        console.error("Fel vid hämtning av dashboarddata:", err);
        setError("Kunde inte hämta all data. Försök igen senare.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [apiKey, stockList]);

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 shadow text-center">
        <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
        <p className="text-gray-400">Laddar översikt...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 shadow text-center text-red-400">
        <AlertTriangle className="mx-auto mb-2" size={24} />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold flex items-center mb-4">
        <BarChart2 className="mr-2" />
        Marknadsöversikt
      </h2>

      {/* Index section */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Marknadsindex</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {indexSymbols.map(indexInfo => {
            const index = indices[indexInfo.symbol];
            
            if (!index) return (
              <div key={indexInfo.symbol} className="bg-gray-800/50 rounded-lg p-4 shadow border border-gray-700/50">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">{indexInfo.name}</h4>
                  <span className="text-gray-400 text-sm">--</span>
                </div>
                <p className="text-gray-400 text-xs mt-1 truncate">Data saknas</p>
              </div>
            );
            
            return (
              <div key={indexInfo.symbol} className="bg-gray-800/50 rounded-lg p-4 shadow border border-gray-700/50 hover:bg-gray-700/50 transition-colors duration-200">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">{index.name}</h4>
                  <span className={`flex items-center ${index.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {index.changePercent >= 0 ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
                    {formatNumber(index.changePercent)}%
                  </span>
                </div>
                <div className="flex justify-between items-baseline mt-2">
                  <span className="text-xl font-semibold">{formatNumber(index.price, 1)}</span>
                  <span className={`${index.changePercent >= 0 ? 'text-green-400' : 'text-red-400'} text-sm`}>
                    {formatNumber(index.change, 1)}
                  </span>
                </div>
                <p className="text-gray-400 text-xs mt-2 truncate">{index.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Currencies section */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Valutor</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {currencyPairs.map(currencyInfo => {
            const key = `${currencyInfo.from}${currencyInfo.to}`;
            const currency = currencies[key];
            
            if (!currency) return (
              <div key={key} className="bg-gray-800/50 rounded-lg p-4 shadow border border-gray-700/50">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">{currencyInfo.name}</h4>
                  <span className="text-gray-400 text-sm">--</span>
                </div>
                <p className="text-gray-400 text-xs mt-1">Data saknas</p>
              </div>
            );
            
            return (
              <div key={key} className="bg-gray-800/50 rounded-lg p-4 shadow border border-gray-700/50 hover:bg-gray-700/50 transition-colors duration-200">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">{currency.name}</h4>
                  <DollarSign size={14} className="text-gray-400" />
                </div>
                <div className="mt-2">
                  <span className="text-xl font-semibold">{formatNumber(currency.rate, 3)}</span>
                </div>
                <p className="text-gray-400 text-xs mt-2">
                  Uppdaterad: {new Date(currency.lastUpdated).toLocaleString('sv-SE')}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top movers section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gainers */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <TrendingUp size={18} className="mr-2 text-green-400" />
            Dagens vinnare
          </h3>
          <div className="bg-gray-800/50 rounded-lg shadow border border-gray-700/50">
            {topMovers.gainers.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                Ingen data tillgänglig
              </div>
            ) : (
              <table className="w-full">
                <thead className="text-gray-400 text-xs">
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-3">Aktie</th>
                    <th className="text-right p-3">Pris</th>
                    <th className="text-right p-3">Förändring</th>
                  </tr>
                </thead>
                <tbody>
                  {topMovers.gainers.map(stock => (
                    <tr key={stock.ticker} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors duration-150">
                      <td className="p-3">
                        <div className="font-medium">{stock.ticker}</div>
                        <div className="text-xs text-gray-400 truncate max-w-40">{stock.name}</div>
                      </td>
                      <td className="text-right p-3">{formatNumber(stock.price)}</td>
                      <td className="text-right p-3 text-green-400">
                        <div className="flex items-center justify-end">
                          <ArrowUpRight size={14} className="mr-1" />
                          <span>{formatNumber(stock.changePercent)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Losers */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <TrendingDown size={18} className="mr-2 text-red-400" />
            Dagens förlorare
          </h3>
          <div className="bg-gray-800/50 rounded-lg shadow border border-gray-700/50">
            {topMovers.losers.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                Ingen data tillgänglig
              </div>
            ) : (
              <table className="w-full">
                <thead className="text-gray-400 text-xs">
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-3">Aktie</th>
                    <th className="text-right p-3">Pris</th>
                    <th className="text-right p-3">Förändring</th>
                  </tr>
                </thead>
                <tbody>
                  {topMovers.losers.map(stock => (
                    <tr key={stock.ticker} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors duration-150">
                      <td className="p-3">
                        <div className="font-medium">{stock.ticker}</div>
                        <div className="text-xs text-gray-400 truncate max-w-40">{stock.name}</div>
                      </td>
                      <td className="text-right p-3">{formatNumber(stock.price)}</td>
                      <td className="text-right p-3 text-red-400">
                        <div className="flex items-center justify-end">
                          <ArrowDownRight size={14} className="mr-1" />
                          <span>{formatNumber(Math.abs(stock.changePercent))}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <div className="mt-2 text-xs text-gray-500 flex items-center justify-center">
        <Clock size={12} className="mr-1"/> 
        Marknadsdata från Alpha Vantage (fördröjd)
      </div>
    </div>
  );
};

export default Dashboard; 