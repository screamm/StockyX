import React, { useState, useEffect, useMemo, useRef } from 'react';
import { debounce } from 'lodash';
import { 
  ChevronDown, ChevronUp, RefreshCw, Search, Star, 
  BarChart2, Newspaper, AlertTriangle, Clock, Home, SlidersHorizontal, List
} from 'lucide-react';

import {
  fetchStockQuote,
  fetchDailyHistory,
  fetchCompanyOverview,
  fetchNews,
  fetchExtendedCompanyInfo
} from '../services/apiService';

import StockRow from './StockRow';
import StockChart from './StockChart';
import StockInfo from './StockInfo';
import NewsFeed from './NewsFeed';
import Dashboard from './Dashboard';
import StockScreener from './StockScreener';

// Läser API-nycklar från .env-filen
const ALPHA_VANTAGE_API_KEY = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY || 'YOUR_ALPHA_VANTAGE_KEY';
const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY || 'YOUR_NEWSAPI_KEY';

// LOG: Skriv ut värdena direkt efter inläsning
console.log('[StockApp] Alpha Vantage Key loaded:', ALPHA_VANTAGE_API_KEY);
console.log('[StockApp] NewsAPI Key loaded:', NEWS_API_KEY);

const StockApp = () => {
  // Initial lista med aktier
  const initialStockList = useMemo(() => [
    { ticker: 'VOLV-B.ST', name: 'Volvo B', marketCap: 498e9 },
    { ticker: 'ERIC-B.ST', name: 'Ericsson B', marketCap: 210e9 },
    { ticker: 'HM-B.ST', name: 'H&M B', marketCap: 285e9 },
    { ticker: 'ATCO-A.ST', name: 'Atlas Copco A', marketCap: 405e9 },
    { ticker: 'INVE-B.ST', name: 'Investor B', marketCap: 715e9 },
    { ticker: 'NDA-SE.ST', name: 'Nordea Bank', marketCap: 450e9 },
    { ticker: 'AAPL', name: 'Apple Inc.', marketCap: 2800e9 },
    { ticker: 'MSFT', name: 'Microsoft Corp.', marketCap: 2500e9 },
    { ticker: 'GOOGL', name: 'Alphabet Inc. (Google)', marketCap: 1800e9 },
    { ticker: 'TSLA', name: 'Tesla, Inc.', marketCap: 800e9 },
  ], []);

  // State
  const [stockInfoList, setStockInfoList] = useState(initialStockList);
  const [stockQuotes, setStockQuotes] = useState({});
  const [selectedStockTicker, setSelectedStockTicker] = useState(null);
  const [selectedStockHistory, setSelectedStockHistory] = useState([]);
  const [selectedStockOverview, setSelectedStockOverview] = useState(null);
  const [selectedStockNews, setSelectedStockNews] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'marketCap', direction: 'descending' });
  const [favoriteStocks, setFavoriteStocks] = useState(() => {
    const saved = localStorage.getItem('favoriteStocks');
    return saved ? JSON.parse(saved) : [];
  });
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState('chart');
  const [activeMainView, setActiveMainView] = useState('dashboard');

  // Laddnings- och felstate
  const [isLoadingListQuotes, setIsLoadingListQuotes] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [errorState, setErrorState] = useState({ list: null, details: null });

  // API nycklar
  const [apiKeyAV, setApiKeyAV] = useState(ALPHA_VANTAGE_API_KEY);
  const [apiKeyNews, setApiKeyNews] = useState(NEWS_API_KEY);

  const quoteUpdateIntervalRef = useRef(null);
  const rateLimitDelay = 15000; // 15 sekunder mellan anrop

  // Debounce sökning
  useEffect(() => {
    const handler = debounce(() => setDebouncedSearchQuery(searchQuery), 300);
    handler();
    return () => handler.cancel();
  }, [searchQuery]);

  // Spara favoriter
  useEffect(() => {
    localStorage.setItem('favoriteStocks', JSON.stringify(favoriteStocks));
  }, [favoriteStocks]);
  
  // Hämta initiala quotes för favoriter
  useEffect(() => {
    const fetchQuoteWithDelay = async (ticker, delay) => {
      return new Promise(resolve => {
        setTimeout(async () => {
          try {
            const quote = await fetchStockQuote(ticker, apiKeyAV);
            if (quote) {
              setStockQuotes(prev => ({ ...prev, [ticker]: quote }));
            }
          } catch (error) {
            console.error('Fel vid hämtning:', error);
          }
          resolve();
        }, delay);
      });
    };

    const fetchInitialQuotes = async () => {
      // LOG: Skriv ut värdet av apiKeyAV precis innan kontrollen
      console.log('[StockApp useEffect] Checking apiKeyAV before fetch:', apiKeyAV);
      
      if (!apiKeyAV || apiKeyAV === 'YOUR_ALPHA_VANTAGE_KEY') {
        // LOG: Om vi hamnar här betyder det att nyckeln fortfarande ses som ogiltig
        console.error('[StockApp useEffect] API Key check failed! apiKeyAV:', apiKeyAV);
        setErrorState(prev => ({ ...prev, list: "Alpha Vantage API-nyckel saknas eller är ogiltig." })); // Tydligare felmeddelande
        return;
      }

      setIsLoadingListQuotes(true);
      setErrorState(prev => ({ ...prev, list: null }));
      
      const tickersToFetch = [...favoriteStocks];
      
      // Lägg till de första i listan som inte är favoriter
      const nonFavorites = stockInfoList
        .filter(s => !tickersToFetch.includes(s.ticker))
        .slice(0, 5)
        .map(s => s.ticker);
      
      tickersToFetch.push(...nonFavorites);
      
      for (let i = 0; i < tickersToFetch.length; i++) {
        await fetchQuoteWithDelay(tickersToFetch[i], i * rateLimitDelay);
      }
      
      setIsLoadingListQuotes(false);
    };
    
    fetchInitialQuotes();
  }, [apiKeyAV, favoriteStocks, stockInfoList]);

  // Hämta detaljer när en aktie väljs
  useEffect(() => {
    const fetchDetails = async () => {
      if (!selectedStockTicker) return;

      setIsLoadingDetails(true);
      setErrorState(prev => ({ ...prev, details: null }));
      setSelectedStockHistory([]);
      setSelectedStockOverview(null);
      setSelectedStockNews([]);

      try {
        // Hämta quote om den inte redan finns
        if (!stockQuotes[selectedStockTicker]) {
          const quote = await fetchStockQuote(selectedStockTicker, apiKeyAV);
          if (quote) {
            setStockQuotes(prev => ({ ...prev, [selectedStockTicker]: quote }));
          }
        }

        // Historisk data (med fördröjning för rate limit)
        await new Promise(r => setTimeout(r, rateLimitDelay));
        const history = await fetchDailyHistory(selectedStockTicker, apiKeyAV);
        setSelectedStockHistory(history || []);

        // Hämta utökad företagsinformation istället för bara overview
        await new Promise(r => setTimeout(r, rateLimitDelay));
        const extendedInfo = await fetchExtendedCompanyInfo(selectedStockTicker, apiKeyAV);
        setSelectedStockOverview(extendedInfo);
        
        // Uppdatera marketCap i huvudlistan om vi fick en nyare
        if (extendedInfo && extendedInfo.marketCap) {
          setStockInfoList(prevList => prevList.map(stock => 
            stock.ticker === selectedStockTicker 
            ? { ...stock, marketCap: extendedInfo.marketCap } 
            : stock
          ));
        }

        // Nyheter
        const stockName = stockInfoList.find(s => s.ticker === selectedStockTicker)?.name || selectedStockTicker;
        const newsQuery = `${stockName} OR ${selectedStockTicker}`;
        const news = await fetchNews(newsQuery, apiKeyNews);
        setSelectedStockNews(news);

      } catch (error) {
        console.error("Fel vid hämtning av detaljer:", error);
        setErrorState(prev => ({ ...prev, details: "Kunde inte hämta all detaljinformation." }));
      } finally {
        setIsLoadingDetails(false);
      }
    };

    fetchDetails();
    
    // Uppdatera den valda aktiens kurs regelbundet
    clearInterval(quoteUpdateIntervalRef.current);
    if (selectedStockTicker && apiKeyAV && apiKeyAV !== 'YOUR_ALPHA_VANTAGE_KEY') {
      quoteUpdateIntervalRef.current = setInterval(async () => {
        try {
          const quote = await fetchStockQuote(selectedStockTicker, apiKeyAV);
          if (quote) {
            setStockQuotes(prev => ({ ...prev, [selectedStockTicker]: quote }));
          }
        } catch (error) {
          console.error('Fel vid uppdatering:', error);
        }
      }, 60 * 1000); // En gång per minut
    }

    // Nollställ huvudvyn när en aktie väljs för att visa detaljer
    if (selectedStockTicker) {
        setActiveMainView('details');
    } else if (activeMainView === 'details') {
        // Återgå till dashboard om aktien avmarkeras
        setActiveMainView('dashboard');
    }

    return () => clearInterval(quoteUpdateIntervalRef.current);
  }, [selectedStockTicker, apiKeyAV, apiKeyNews, stockInfoList]);

  // Filtrering och sortering
  const filteredAndSortedStocks = useMemo(() => {
    let result = [...stockInfoList];

    if (showOnlyFavorites) {
      result = result.filter(stock => favoriteStocks.includes(stock.ticker));
    }

    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      result = result.filter(stock => 
        stock.name.toLowerCase().includes(query) || 
        stock.ticker.toLowerCase().includes(query)
      );
    }
    
    // Sortering
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aValue, bValue;

        if (['price', 'change', 'changePercent'].includes(sortConfig.key)) {
          aValue = stockQuotes[a.ticker]?.[sortConfig.key];
          bValue = stockQuotes[b.ticker]?.[sortConfig.key];
        } else {
          aValue = a[sortConfig.key];
          bValue = b[sortConfig.key];
        }

        // Hantera undefined/null
        const aUndefined = aValue === undefined || aValue === null;
        const bUndefined = bValue === undefined || bValue === null;

        if (aUndefined && bUndefined) return 0;
        if (aUndefined) return 1;
        if (bUndefined) return -1;

        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();

        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    
    return result;
  }, [stockInfoList, stockQuotes, debouncedSearchQuery, showOnlyFavorites, favoriteStocks, sortConfig]);

  // Sortering
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    } else if (sortConfig.key === key && sortConfig.direction === 'descending') {
      key = 'marketCap';
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Hantera favoriter
  const toggleFavorite = (ticker) => {
    setFavoriteStocks(prev => 
      prev.includes(ticker) 
        ? prev.filter(t => t !== ticker) 
        : [...prev, ticker]
    );
  };

  // Hämta aktuell quote för vald aktie
  const currentSelectedQuote = stockQuotes[selectedStockTicker];

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden bg-dark-900">
      {/* Vänster kolumn - Lista & Navigation */} 
      <div className="w-full lg:w-1/3 xl:w-1/4 border-r border-gray-700 flex flex-col bg-gray-900">
        {/* Navigation & Sök/Filter */} 
        <div className="p-4 border-b border-gray-700 space-y-3">
          {/* Vy-växlare */} 
          <div className="flex space-x-2 mb-3">
            <button
              onClick={() => setActiveMainView('dashboard')}
              className={`btn ${activeMainView === 'dashboard' ? 'btn-primary' : 'btn-secondary'} flex-1 flex items-center justify-center text-xs py-1 px-2`}
            >
              <Home size={14} className="mr-1" /> Översikt
            </button>
            <button
              onClick={() => setActiveMainView('screener')}
              className={`btn ${activeMainView === 'screener' ? 'btn-primary' : 'btn-secondary'} flex-1 flex items-center justify-center text-xs py-1 px-2`}
            >
              <SlidersHorizontal size={14} className="mr-1" /> Screener
            </button>
          </div>
          
          {/* API nyckel varning */}
          {(!apiKeyAV || apiKeyAV === 'YOUR_ALPHA_VANTAGE_KEY') && (
            <div className="badge badge-error p-2 mb-2 flex items-center">
              <AlertTriangle size={14} className="mr-1"/> Alpha Vantage API-nyckel saknas. Data kan ej hämtas.
            </div>
          )}
          {(!apiKeyNews || apiKeyNews === 'YOUR_NEWSAPI_KEY') && (
            <div className="badge badge-warning p-2 mb-2 flex items-center">
              <AlertTriangle size={14} className="mr-1"/> NewsAPI-nyckel saknas. Nyheter kan ej hämtas.
            </div>
          )}
          
          {/* Sökfält & Favoritfilter (visas bara om inte screener är aktiv?) Kanske alltid? */}
          {/* Vi behåller dem synliga tills vidare */}
          <div className="relative">
            <input 
              type="text" 
              placeholder="Sök aktie..." 
              className="form-input pl-8" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
            <Search size={16} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500" />
          </div>
          <div className="flex justify-between items-center text-xs">
            <button 
              onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
              className={`btn ${showOnlyFavorites ? 'btn-primary' : 'btn-secondary'} py-1 px-3 flex items-center`}
            >
              <Star size={14} className="mr-1" /> Favoriter
            </button>
            <span className="text-gray-400">
              {isLoadingListQuotes && <RefreshCw size={14} className="inline animate-spin mr-1"/>}
              {filteredAndSortedStocks.length} träffar
            </span>
          </div>
          
          {errorState.list && <p className="text-xs text-red-400 mt-1">{errorState.list}</p>}
        </div>

        {/* Aktielista (visas alltid under nav/filter) */} 
        <div className="flex-grow overflow-y-auto">
          <table className="w-full text-sm table-fixed">
            <thead className="sticky top-0 bg-gray-800 z-10 shadow-sm">
              <tr>
                <th 
                  className="table-header w-2/6 rounded-tl-md" 
                  onClick={() => requestSort('name')}
                >
                  Namn
                  {sortConfig.key === 'name' && (
                    <span className="ml-1">
                      {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
                <th 
                  className="table-header w-1/6" 
                  onClick={() => requestSort('price')}
                >
                  Pris
                  {sortConfig.key === 'price' && (
                    <span className="ml-1">
                      {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
                <th 
                  className="table-header w-1/6" 
                  onClick={() => requestSort('changePercent')}
                >
                  +/- %
                  {sortConfig.key === 'changePercent' && (
                    <span className="ml-1">
                      {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
                <th 
                  className="table-header w-1/6 hidden md:table-cell" 
                  onClick={() => requestSort('volume')}
                >
                  Volym
                  {sortConfig.key === 'volume' && (
                    <span className="ml-1">
                      {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
                <th 
                  className="table-header w-1/6 hidden lg:table-cell rounded-tr-md" 
                  onClick={() => requestSort('marketCap')}
                >
                  Börsv.
                  {sortConfig.key === 'marketCap' && (
                    <span className="ml-1">
                      {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedStocks.map(stockInfo => (
                <StockRow 
                  key={stockInfo.ticker} 
                  stockInfo={stockInfo} 
                  quote={stockQuotes[stockInfo.ticker]} 
                  onSelect={setSelectedStockTicker}
                  isSelected={selectedStockTicker === stockInfo.ticker}
                  isFavorite={favoriteStocks.includes(stockInfo.ticker)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
              {filteredAndSortedStocks.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    Inga aktier hittades
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer */} 
        <div className="p-2 text-xs text-gray-500 border-t border-gray-700 text-center flex items-center justify-center bg-gray-800">
          <Clock size={12} className="mr-1"/> Data från Alpha Vantage & NewsAPI (kan vara fördröjd)
        </div>
      </div>

      {/* Höger kolumn - Detaljer / Dashboard / Screener */} 
      <div className="w-full lg:w-2/3 xl:w-3/4 flex flex-col bg-gray-800/30">
        {selectedStockTicker ? ( // Visa ALLTID detaljer om en aktie är vald
          <> 
            {/* Aktie-header */}
            <div className="p-4 border-b border-gray-700 bg-gray-800 relative">
              {isLoadingDetails && (
                <div className="absolute top-4 right-4 text-xs text-gray-400 flex items-center">
                  <RefreshCw size={12} className="animate-spin mr-1"/> 
                  Laddar detaljer...
                </div>
              )}
              {errorState.details && (
                <div className="absolute top-4 right-4 text-xs text-red-400 flex items-center">
                  <AlertTriangle size={12} className="mr-1"/> 
                  {errorState.details}
                </div>
              )}

              <div className="flex justify-between items-center mb-3">
                <h2 className="text-2xl font-semibold">
                  {stockInfoList.find(s => s.ticker === selectedStockTicker)?.name || selectedStockTicker}
                  <span className="text-gray-400 ml-2 text-sm">
                    {selectedStockTicker}
                  </span>
                </h2>
                <button 
                  onClick={() => toggleFavorite(selectedStockTicker)} 
                  className="text-gray-500 hover:text-yellow-400 focus:outline-none transition-colors duration-150"
                  aria-label={favoriteStocks.includes(selectedStockTicker) ? "Ta bort från favoriter" : "Lägg till i favoriter"}
                >
                  <Star 
                    size={22} 
                    fill={favoriteStocks.includes(selectedStockTicker) ? 'currentColor' : 'none'} 
                    className={favoriteStocks.includes(selectedStockTicker) ? 'text-yellow-400' : ''} 
                  />
                </button>
              </div>
              
              {currentSelectedQuote ? (
                <>
                  <div className="flex items-baseline space-x-4">
                    <span className="text-3xl font-bold">
                      {currentSelectedQuote.price.toLocaleString('sv-SE', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                    </span>
                    <span className={`text-xl ${currentSelectedQuote.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {currentSelectedQuote.change >= 0 ? '+' : ''}
                      {currentSelectedQuote.change.toLocaleString('sv-SE', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })} 
                      <span className="text-sm">
                        ({currentSelectedQuote.changePercent >= 0 ? '+' : ''}
                        {currentSelectedQuote.changePercent.toLocaleString('sv-SE', { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })}%)
                      </span>
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1 flex flex-wrap items-center">
                    {selectedStockOverview?.sector && (
                      <span className="mr-3">{selectedStockOverview.sector}</span>
                    )}
                    <span className="mr-3">
                      Uppdaterad: {currentSelectedQuote.lastTradingDay ? new Date(currentSelectedQuote.lastTradingDay).toLocaleDateString('sv-SE') : 'Okänt'}
                    </span>
                    <span className="badge badge-warning">FÖRDRÖJD DATA</span>
                  </div>
                </>
              ) : (
                <div className="text-gray-500 flex items-center">
                  <RefreshCw size={14} className="animate-spin mr-1"/> 
                  Laddar prisdata...
                </div>
              )}
            </div>

            {/* Flikar (byter nu activeDetailTab) */} 
            <div className="flex border-b border-gray-700 bg-gray-800/80 text-sm">
              <button 
                className={`px-5 py-3 flex items-center transition-colors duration-150 ${ 
                  activeDetailTab === 'chart' 
                    ? 'border-b-2 border-primary text-white font-medium' 
                    : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                }`}
                onClick={() => setActiveDetailTab('chart')}
              >
                <BarChart2 size={16} className="mr-2"/> Graf & Info
              </button>
              <button 
                className={`px-5 py-3 flex items-center transition-colors duration-150 ${ 
                  activeDetailTab === 'news' 
                    ? 'border-b-2 border-primary text-white font-medium' 
                    : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                }`}
                onClick={() => setActiveDetailTab('news')}
              >
                <Newspaper size={16} className="mr-2"/> Nyheter
              </button>
            </div>

            {/* Innehåll (styrs av activeDetailTab) */} 
            <div className="flex-grow p-4 overflow-y-auto space-y-6 bg-gray-900/20">
              {activeDetailTab === 'chart' ? (
                <> 
                  {/* Graf */}
                  <div className="card">
                    <StockChart 
                      ticker={selectedStockTicker}
                      historyData={selectedStockHistory}
                      isLoading={isLoadingDetails && selectedStockHistory.length === 0}
                      error={!!errorState.details && selectedStockHistory.length === 0}
                    />
                  </div>
                  
                  {/* Info */}
                  <div className="card">
                    <StockInfo 
                      ticker={selectedStockTicker}
                      overviewData={selectedStockOverview}
                      quoteData={currentSelectedQuote}
                      isLoading={isLoadingDetails && !selectedStockOverview}
                      error={!!errorState.details && !selectedStockOverview}
                    />
                  </div>
                </>
              ) : (
                /* Nyheter */
                <div className="card">
                  <NewsFeed 
                    ticker={selectedStockTicker}
                    newsData={selectedStockNews}
                    isLoading={isLoadingDetails && selectedStockNews.length === 0}
                    error={!!errorState.details && selectedStockNews.length === 0}
                  />
                </div>
              )}
            </div>
          </>
        ) : activeMainView === 'dashboard' ? ( // Om ingen aktie vald OCH dashboard är aktiv
          <div className="flex-grow p-6 overflow-y-auto">
            <Dashboard 
              apiKey={apiKeyAV} 
              stockList={stockInfoList} 
            />
          </div>
        ) : activeMainView === 'screener' ? ( // Om ingen aktie vald OCH screener är aktiv
           <StockScreener 
             allStocks={stockInfoList} // Skicka med hela listan för filtrering
            // TODO: Behöver vi skicka med quotes också för att filtrera på P/E etc?
           />
        ) : (
            // Fallback om ingen vy matchar (bör inte hända)
            <div className="flex-grow p-6 flex items-center justify-center text-gray-500">
                Välj en aktie från listan eller en vy ovan.
            </div>
        )} 
      </div>
    </div>
  );
};

export default StockApp; 