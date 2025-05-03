import React, { useState /*, useEffect*/ } from 'react';
import { 
  BarChart2, TrendingUp, TrendingDown, DollarSign, 
  RefreshCw, AlertTriangle, Clock, ArrowUpRight, ArrowDownRight 
} from 'lucide-react';
import { 
  // fetchMarketIndex, // Borttagen
  // fetchCurrencyRate, // Borttagen
  // fetchTopMovers, // Borttagen
  // formatNumber // Borttagen då den inte används nu
} from '../services/apiService';

const Dashboard = () => {
  // State (Kommentera bort oanvända states)
  // const [indices, setIndices] = useState({}); 
  // const [currencies, setCurrencies] = useState({}); 
  // const [topMovers, setTopMovers] = useState({ gainers: [], losers: [] }); 
  const [isLoading, /*setIsLoading*/] = useState(false); // Behåll isLoading, kommentera bort setter
  const [error, /*setError*/] = useState(null); // Behåll error, kommentera bort setter

  // Definitionsdata (behålls för rendering)
  const indexSymbols = [
    { symbol: '^OMXS30', name: 'OMXS30', description: 'Stockholmsbörsens 30 mest omsatta aktier' },
    { symbol: '^GSPC', name: 'S&P 500', description: 'Standard & Poor\'s 500 index' },
    { symbol: '^IXIC', name: 'Nasdaq', description: 'Nasdaq Composite Index' },
    { symbol: '^DJI', name: 'Dow Jones', description: 'Dow Jones Industrial Average' },
  ];
  const currencyPairs = [
    { from: 'USD', to: 'SEK', name: 'USD/SEK' },
    { from: 'EUR', to: 'SEK', name: 'EUR/SEK' },
    { from: 'GBP', to: 'SEK', name: 'GBP/SEK' },
    { from: 'NOK', to: 'SEK', name: 'NOK/SEK' },
  ];

  // Hämta alla data - HELA useEffect ÄR UTKOMMENTERAD
  /*
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
        // --- Hämta indexdata ---
        // const indexData = {};
        // for (let i = 0; i < indexSymbols.length; i++) {
        //   const data = await fetchMarketIndex(indexSymbols[i].symbol, apiKey);
        //   if (data) { indexData[indexSymbols[i].symbol] = { ...data, name: indexSymbols[i].name, description: indexSymbols[i].description }; }
        //   if (i < indexSymbols.length - 1) await new Promise(resolve => setTimeout(resolve, 1500));
        // }
        // setIndices(indexData);

        // --- Hämta valutakurser ---
        // const currencyData = {};
        // for (let i = 0; i < currencyPairs.length; i++) {
        //   const pair = currencyPairs[i];
        //   const data = await fetchCurrencyRate(pair.from, pair.to, apiKey);
        //   if (data) { currencyData[`${pair.from}${pair.to}`] = { ...data, name: pair.name }; }
        //   if (i < currencyPairs.length - 1) await new Promise(resolve => setTimeout(resolve, 1500));
        // }
        // setCurrencies(currencyData);

        // --- Hämta top movers ---
        // if (stockList && stockList.length > 0) {
        //   const movers = await fetchTopMovers(stockList, apiKey);
        //   setTopMovers(movers);
        // }
      } catch (err) {
        console.error("Fel vid hämtning av dashboarddata:", err);
        setError("Kunde inte hämta all data. Försök igen senare.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []); // Tom dependency array om useEffect skulle användas utan props
  */

  // Ladda/Fel-visning (behålls)
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 shadow-sm rounded-lg text-center">
        <RefreshCw className="animate-spin mx-auto mb-3 text-blue-500" size={24} />
        <p className="text-gray-500 dark:text-gray-400">Laddar översikt...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 shadow-sm rounded-lg text-center">
        <AlertTriangle className="mx-auto mb-3 text-amber-500" size={24} />
        <p className="text-red-500 dark:text-red-400">{error}</p>
      </div>
    );
  }

  // Huvud-renderering (behålls)
  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold flex items-center mb-4 text-blue-600 dark:text-blue-500">
        <BarChart2 className="mr-2 text-blue-500 dark:text-blue-400" />
        Marknadsöversikt
      </h2>

      {/* Index section - Visar nu bara platshållare */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-200">Marknadsindex</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {indexSymbols.map(indexInfo => (
            <div key={indexInfo.symbol} className="dashboard-placeholder bg-white dark:bg-gray-800 p-5 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-300">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-gray-800 dark:text-gray-200">{indexInfo.name}</h4>
                <span className="text-gray-400 dark:text-gray-500 text-sm">--</span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-2 truncate">{indexInfo.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Currencies section - Visar nu bara platshållare */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-200">Valutor</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {currencyPairs.map(currencyInfo => (
            <div key={`${currencyInfo.from}${currencyInfo.to}`} className="dashboard-placeholder bg-white dark:bg-gray-800 p-5 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-300">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-gray-800 dark:text-gray-200">{currencyInfo.name}</h4>
                <span className="text-gray-400 dark:text-gray-500 text-sm">--</span>
              </div>
              <div className="mt-2 flex items-center">
                <span className="text-xs text-gray-500 dark:text-gray-400">Data ej tillgänglig (API)</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top movers section - Visar nu bara platshållare */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gainers */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center text-gray-700 dark:text-gray-200">
            <TrendingUp size={18} className="mr-2 text-green-500" />
            Dagens vinnare
          </h3>
          <div className="dashboard-placeholder bg-white dark:bg-gray-800 p-5 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-300">
            <div className="p-4 text-center">
              <span className="text-gray-500 dark:text-gray-400 text-sm">Data ej tillgänglig (API)</span>
            </div>
          </div>
        </div>
        {/* Losers */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center text-gray-700 dark:text-gray-200">
            <TrendingDown size={18} className="mr-2 text-red-500" />
            Dagens förlorare
          </h3>
          <div className="dashboard-placeholder bg-white dark:bg-gray-800 p-5 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-300">
            <div className="p-4 text-center">
              <span className="text-gray-500 dark:text-gray-400 text-sm">Data ej tillgänglig (API)</span>
            </div>
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