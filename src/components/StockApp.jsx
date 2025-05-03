import React, { useState, useEffect, useMemo, useRef } from 'react';
import { debounce } from 'lodash';
import { 
  ChevronDown, ChevronUp, RefreshCw, Search, Star, 
  BarChart2, Newspaper, AlertTriangle, Clock, Home, SlidersHorizontal, List, X
} from 'lucide-react';

import {
  fetchStockQuote,
  fetchDailyHistory,
  fetchNews,
  fetchExtendedCompanyInfo,
} from '../services/apiService';

import StockRow from './StockRow';
import StockChart from './StockChart';
import StockInfo from './StockInfo';
import NewsFeed from './NewsFeed';
import Dashboard from './Dashboard';
import StockScreener from './StockScreener';

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

  const quoteUpdateIntervalRef = useRef(null);

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
  
  // Hämta initiala quotes - hämtar nu ALLA från initialStockList om inga favoriter finns
  useEffect(() => {
    const fetchQuoteWithDelay = async (ticker, delay) => {
      return new Promise(resolve => {
        setTimeout(async () => {
          try {
            const quote = await fetchStockQuote(ticker);
            if (quote) {
              setStockQuotes(prev => ({ ...prev, [ticker]: quote }));
            } else {
              // Sätt ett felmeddelande om en specifik aktie misslyckas?
              // Eller låt raden bara vara tom?
              console.warn(`[StockApp] Kunde inte hämta initial quote för ${ticker}`);
            }
          } catch (error) {
            console.error(`[StockApp] Fel vid hämtning av initial quote för ${ticker}:`, error);
            // Kanske sätta ett generellt list-fel?
            setErrorState(prev => ({ ...prev, list: "Fel vid hämtning av initial data."}));
          }
          resolve();
        }, delay);
      });
    };

    const fetchInitialQuotes = async () => {
      setIsLoadingListQuotes(true);
      setErrorState(prev => ({ ...prev, list: null }));
      
      // Bestäm vilka tickers som ska hämtas: favoriter eller alla initiala
      let tickersToFetch = favoriteStocks.length > 0 ? favoriteStocks : initialStockList.map(s => s.ticker);
      
      console.log('[StockApp useEffect] Fetching initial quotes for:', tickersToFetch);
      
      // Skapa en array av promises för att hämta alla quotes parallellt med fördröjning
      const quotePromises = tickersToFetch.map((ticker, index) => 
        fetchQuoteWithDelay(ticker, index * 200) // Liten fördröjning (200ms) mellan varje anrop
      );
      
      // Vänta på att alla anrop ska slutföras
      await Promise.all(quotePromises);
      
      setIsLoadingListQuotes(false);
      console.log('[StockApp useEffect] Finished fetching initial quotes.');
    };
    
    fetchInitialQuotes();
  }, [favoriteStocks, initialStockList]);

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
        if (!stockQuotes[selectedStockTicker]) {
          const quote = await fetchStockQuote(selectedStockTicker);
          if (quote) {
            setStockQuotes(prev => ({ ...prev, [selectedStockTicker]: quote }));
          }
        }

        await new Promise(r => setTimeout(r, 500));
        const history = await fetchDailyHistory(selectedStockTicker);
        setSelectedStockHistory(history || []);

        await new Promise(r => setTimeout(r, 500));
        const extendedInfo = await fetchExtendedCompanyInfo(selectedStockTicker);
        setSelectedStockOverview(extendedInfo);
        
        if (extendedInfo && extendedInfo.marketCap) {
          setStockInfoList(prevList => prevList.map(stock => 
            stock.ticker === selectedStockTicker 
            ? { ...stock, marketCap: extendedInfo.marketCap } 
            : stock
          ));
        }

        const stockName = stockInfoList.find(s => s.ticker === selectedStockTicker)?.name || selectedStockTicker;
        const newsQuery = `${stockName} OR ${selectedStockTicker}`;
        const news = await fetchNews(newsQuery);
        setSelectedStockNews(news);

      } catch (error) {
        console.error("Fel vid hämtning av detaljer:", error);
        setErrorState(prev => ({ ...prev, details: "Kunde inte hämta all detaljinformation." }));
      } finally {
        setIsLoadingDetails(false);
      }
    };

    fetchDetails();
    
    clearInterval(quoteUpdateIntervalRef.current);
    if (selectedStockTicker) {
        setActiveMainView('details');
    } else if (activeMainView === 'details') {
        setActiveMainView('dashboard');
    }

    return () => clearInterval(quoteUpdateIntervalRef.current);
  // Vi måste undanta stockInfoList, activeMainView, och stockQuotes från beroenden
  // för att undvika oönskade återrenderingar och potentiella oändliga loopar
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStockTicker]);

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
  }, [stockInfoList, debouncedSearchQuery, showOnlyFavorites, favoriteStocks, sortConfig, stockQuotes]);

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

  // Åtgärd: Detta är källan till den oändliga loopen - den uppdaterar stockQuotes
  // vilket i sin tur ändrar filteredAndSortedStocks via dependencies.
  useEffect(() => {
    // TEMPORÄRT INAKTIVERAD - För att förhindra oändlig loop
    console.log('[StockApp] Uppdateringsloop för quotes är helt inaktiverad');
    
    // Cleanup för intervall om det tidigare har satts
    return () => {
      if (quoteUpdateIntervalRef.current) {
        clearInterval(quoteUpdateIntervalRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStockTicker]); // Minimalt beroende för att undvika oändlig loop

  const toggleShowOnlyFavorites = () => {
    setShowOnlyFavorites(!showOnlyFavorites);
  };

  const refreshStockPrices = () => {
    // Implementera logiken för att uppdatera alla kurser
    console.log('Uppdatera alla kurser');
  };

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden bg-gray-100 dark:bg-gray-900">
      {/* Vänster kolumn - Lista & Navigation */} 
      <div className="w-full lg:w-1/3 xl:w-1/4 border-r border-gray-300 dark:border-gray-700 flex flex-col bg-white dark:bg-gray-900">
        {/* Navigation & Sök/Filter */} 
        <div className="p-4 border-b border-gray-300 dark:border-gray-700 space-y-3">
          {/* Vy-växlare */} 
          <div className="flex space-x-2 mb-3">
            <button
              onClick={() => setActiveMainView('dashboard')}
              className={`inline-flex items-center justify-center px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${activeMainView === 'dashboard' ? 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600'} flex-1 flex items-center justify-center text-xs py-1 px-2`}
            >
              <Home size={14} className="mr-1" /> Översikt
            </button>
            <button
              onClick={() => setActiveMainView('screener')}
              className={`inline-flex items-center justify-center px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${activeMainView === 'screener' ? 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600'} flex-1 flex items-center justify-center text-xs py-1 px-2`}
            >
              <SlidersHorizontal size={14} className="mr-1" /> Screener
            </button>
          </div>
          
          {/* Sökruta */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search size={16} className="text-gray-500 dark:text-gray-400" />
            </div>
            <input 
              type="text" 
              className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm block w-full pl-10 p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
              placeholder="Sök aktie..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                className="absolute inset-y-0 right-0 flex items-center pr-3"
                onClick={() => setSearchQuery('')}
                aria-label="Rensa sökning"
              >
                <X size={16} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" />
              </button>
            )}
          </div>

          {/* Filter och sortering */}
          <div className="flex items-center">
            <div className="flex space-x-2 text-sm">
              <button 
                className={`p-1 px-2 border ${showOnlyFavorites ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-500 dark:border-blue-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600'} flex items-center text-xs`}
                onClick={toggleShowOnlyFavorites}
              >
                <Star size={14} className="mr-1" />
                Favoriter
              </button>
            </div>
            
            <div className="flex ml-auto space-x-2">
              <button 
                onClick={() => refreshStockPrices()}
                disabled={isLoadingListQuotes}
                className="p-1 px-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 flex items-center text-xs hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-150"
                aria-label="Uppdatera alla kurser"
              >
                <RefreshCw size={14} className={isLoadingListQuotes ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </div>
        
        {/* Aktielista */}
        <div className="flex-grow overflow-auto">
          {errorState.list && (
            <div className="text-red-500 dark:text-red-400 p-4 text-center border-b border-gray-300 dark:border-gray-700 bg-red-50 dark:bg-red-900/10">
              <AlertTriangle size={16} className="mr-1 inline" />
              {errorState.list}
            </div>
          )}

          <div className="border-b border-gray-300 dark:border-gray-700">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300 uppercase text-left">
                <tr>
                  <th className="p-2 pl-4 pr-2 select-none cursor-pointer" onClick={() => requestSort('ticker')}>
                    <div className="flex items-center">
                      Aktie
                      {sortConfig.key === 'ticker' && (
                        <span className="ml-1">
                          {sortConfig.direction === 'ascending' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="p-2 text-right select-none cursor-pointer" onClick={() => requestSort('price')}>
                    <div className="flex items-center justify-end">
                      Kurs
                      {sortConfig.key === 'price' && (
                        <span className="ml-1">
                          {sortConfig.direction === 'ascending' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="p-2 text-right select-none cursor-pointer" onClick={() => requestSort('changePercent')}>
                    <div className="flex items-center justify-end">
                      %
                      {sortConfig.key === 'changePercent' && (
                        <span className="ml-1">
                          {sortConfig.direction === 'ascending' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="p-2 text-right select-none cursor-pointer hidden md:table-cell" onClick={() => requestSort('volume')}>
                    <div className="flex items-center justify-end">
                      Volym
                      {sortConfig.key === 'volume' && (
                        <span className="ml-1">
                          {sortConfig.direction === 'ascending' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="p-2 text-right pr-4 select-none cursor-pointer hidden lg:table-cell" onClick={() => requestSort('marketCap')}>
                    <div className="flex items-center justify-end">
                      Börsv.
                      {sortConfig.key === 'marketCap' && (
                        <span className="ml-1">
                          {sortConfig.direction === 'ascending' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </span>
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="text-gray-700 dark:text-gray-300 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAndSortedStocks.length > 0 ? (
                  filteredAndSortedStocks.map((stockInfo) => (
                    <StockRow
                      key={stockInfo.ticker}
                      stockInfo={stockInfo}
                      quote={stockQuotes[stockInfo.ticker]}
                      onSelect={setSelectedStockTicker}
                      isSelected={stockInfo.ticker === selectedStockTicker}
                      isFavorite={favoriteStocks.includes(stockInfo.ticker)}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-gray-400 dark:text-gray-500">
                      {searchQuery ? (
                        <>
                          <Search size={36} className="inline-block mb-2 opacity-30" />
                          <p>Inga aktier matchade din sökning "{searchQuery}"</p>
                        </>
                      ) : showOnlyFavorites ? (
                        <>
                          <Star size={36} className="inline-block mb-2 opacity-30" />
                          <p>Du har inga favoriter ännu</p>
                          <p className="text-sm mt-1">Klicka på stjärnan bredvid en aktie för att lägga till den.</p>
                        </>
                      ) : (
                        <>
                          <AlertTriangle size={36} className="inline-block mb-2 opacity-30" />
                          <p>Ingen data kunde hämtas</p>
                        </>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Höger kolumn - Detaljer / Dashboard / Screener */} 
      <div className="w-full lg:w-2/3 xl:w-3/4 flex flex-col bg-gray-200/30 dark:bg-gray-800">
        {selectedStockTicker ? ( // Visa ALLTID detaljer om en aktie är vald
          <> 
            {/* Aktie-header */}
            <div className="p-4 border-b border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 relative">
              {isLoadingDetails && (
                <div className="absolute top-4 right-4 text-xs text-gray-500 dark:text-gray-400 flex items-center">
                  <RefreshCw size={12} className="animate-spin mr-1"/> 
                  Laddar detaljer...
                </div>
              )}
              {errorState.details && (
                <div className="absolute top-4 right-4 text-xs text-red-600 dark:text-red-400 flex items-center">
                  <AlertTriangle size={12} className="mr-1"/> 
                  {errorState.details}
                </div>
              )}

              <div className="flex justify-between items-center mb-3">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stockInfoList.find(s => s.ticker === selectedStockTicker)?.name || selectedStockTicker}
                  <span className="text-gray-500 dark:text-gray-400 ml-2 text-sm">
                    {selectedStockTicker}
                  </span>
                </h2>
                <button 
                  onClick={() => toggleFavorite(selectedStockTicker)} 
                  className="text-gray-400 hover:text-yellow-500 dark:text-gray-500 dark:hover:text-yellow-400 focus:outline-none transition-colors duration-150"
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
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                      {currentSelectedQuote.price.toLocaleString('sv-SE', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                    </span>
                    <span className={`text-xl ${currentSelectedQuote.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
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
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex flex-wrap items-center">
                    {selectedStockOverview?.sector && (
                      <span className="mr-3">{selectedStockOverview.sector}</span>
                    )}
                    <span className="mr-3">
                      Uppdaterad: {currentSelectedQuote.lastTradingDay ? new Date(currentSelectedQuote.lastTradingDay).toLocaleDateString('sv-SE') : 'Okänt'}
                    </span>
                    <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-600 dark:text-yellow-100">FÖRDRÖJD DATA</span>
                  </div>
                </>
              ) : (
                <div className="text-gray-500 dark:text-gray-500 flex items-center">
                  <RefreshCw size={14} className="animate-spin mr-1"/> 
                  Laddar prisdata...
                </div>
              )}
            </div>

            {/* Flikar (byter nu activeDetailTab) */} 
            <div className="flex border-b border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/80 text-sm">
              <button 
                className={`px-5 py-3 flex items-center transition-colors duration-150 ${ 
                  activeDetailTab === 'chart' 
                    ? 'border-b-2 border-blue-600 text-gray-900 dark:border-primary dark:text-white font-medium' 
                    : 'text-gray-600 hover:bg-gray-300 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200'
                }`}
                onClick={() => setActiveDetailTab('chart')}
              >
                <BarChart2 size={16} className="mr-2"/> Graf & Info
              </button>
              <button 
                className={`px-5 py-3 flex items-center transition-colors duration-150 ${ 
                  activeDetailTab === 'news' 
                    ? 'border-b-2 border-blue-600 text-gray-900 dark:border-primary dark:text-white font-medium' 
                    : 'text-gray-600 hover:bg-gray-300 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200'
                }`}
                onClick={() => setActiveDetailTab('news')}
              >
                <Newspaper size={16} className="mr-2"/> Nyheter
              </button>
            </div>

            {/* Innehåll (styrs av activeDetailTab) */} 
            <div className="flex-grow p-4 overflow-y-auto space-y-6 bg-gray-100 dark:bg-gray-900/20">
              {activeDetailTab === 'chart' ? (
                <> 
                  {/* Graf */}
                  <div className="border border-gray-300 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800">
                    <StockChart 
                      ticker={selectedStockTicker}
                      historyData={selectedStockHistory}
                      isLoading={isLoadingDetails && selectedStockHistory.length === 0}
                      error={!!errorState.details && selectedStockHistory.length === 0}
                    />
                  </div>
                  
                  {/* Info */}
                  <div className="border border-gray-300 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800">
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
                <div className="border border-gray-300 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800">
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
          <div className="flex-grow p-6 overflow-y-auto bg-gray-100 dark:bg-gray-900/20">
            <Dashboard 
              stockList={stockInfoList} 
            />
          </div>
        ) : activeMainView === 'screener' ? ( // Om ingen aktie vald OCH screener är aktiv
           <StockScreener 
             allStocks={stockInfoList} // Skicka med hela listan för filtrering
           />
        ) : (
            // Fallback om ingen vy matchar (bör inte hända)
            <div className="flex-grow p-6 flex items-center justify-center text-gray-500 dark:text-gray-500">
                Välj en aktie från listan eller en vy ovan.
            </div>
        )} 
      </div>
    </div>
  );
};

export default StockApp; 