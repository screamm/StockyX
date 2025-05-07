import axios from 'axios';

// Basadress till din nya backend-proxy
const PROXY_BASE_URL = 'http://localhost:3001/api'; // Standardport 3001 för servern

// Klientsidans cache (in-memory) - behålls för data som inte behöver localStorage
let clientSideApiCache = {};

// Hjälpfunktion för att kontrollera in-memory cachens giltighet
const isClientCacheValid = (cacheKey, duration) => {
  if (!clientSideApiCache[cacheKey]) return false;
  const now = Date.now();
  return (now - clientSideApiCache[cacheKey].timestamp < duration);
};

// Ny hjälpfunktion för localStorage-cache
const getLocalStorageCache = (key) => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;
    return JSON.parse(item);
  } catch (error) {
    console.error('[Cache] Fel vid läsning från localStorage:', key, error);
    return null;
  }
};

const setLocalStorageCache = (key, data, timestamp) => {
  try {
    localStorage.setItem(key, JSON.stringify({ data, timestamp }));
  } catch (error) {
    console.error('[Cache] Fel vid skrivning till localStorage:', key, error);
  }
};

// Hämta aktiekurs - Anropar nu backend-proxyn och använder localStorage-cache
export const fetchStockQuote = async (ticker) => {
  const localStorageKey = `quote_ls_${ticker}`;
  const MIN_UPDATE_INTERVAL = 60 * 1000; // 60 sekunder

  // 1. Kontrollera localStorage först
  const cachedItem = getLocalStorageCache(localStorageKey);
  if (cachedItem && (Date.now() - cachedItem.timestamp < MIN_UPDATE_INTERVAL)) {
    console.log(`[Frontend/LS_Cache] Använder localStorage-cachat kursdata för: ${ticker}`);
    return cachedItem.data;
  }
  
  // Om inte i localStorage eller för gammal, fortsätt som tidigare men spara i localStorage
  console.log(`[Frontend] Hämtar färsk kursdata för ${ticker} från proxy (localStorage var ${cachedItem ? 'för gammal' : 'tom'})`);
  try {
    const response = await axios.get(`${PROXY_BASE_URL}/quote/${ticker}`);
    
    if (response.data) {
      setLocalStorageCache(localStorageKey, response.data, Date.now());
      // Vi kan också uppdatera in-memory cachen om den används parallellt för andra saker
      // clientSideApiCache[cacheKeyForInMemory] = { data: response.data, timestamp: Date.now() }; 
      return response.data;
    } else {
      console.warn(`[Frontend] Ingen kursdata returnerades från proxy för ${ticker}`);
      // Om API-anrop misslyckas, men vi har gammal data i cache, kan vi överväga att returnera den?
      // För nu returnerar vi null, men detta är en möjlig förbättring.
      if(cachedItem) {
        console.log(`[Frontend] API-anrop misslyckades för ${ticker}, returnerar gammal (men existerande) localStorage-data.`);
        return cachedItem.data;
      }
      return null;
    }
  } catch (error) {
    console.error(`[Frontend] Fel vid hämtning av kursdata från proxy för ${ticker}:`,
                  error.response ? error.response.data : error.message);
    // Om API-anrop misslyckas, returnera gammal data från localStorage om den finns.
    if(cachedItem) {
        console.log(`[Frontend] API-anrop misslyckades (catch) för ${ticker}, returnerar gammal localStorage-data.`);
        return cachedItem.data;
    }
    return null; 
  }
};

// Hämta historisk data - Anropar nu backend-proxyn (behåller in-memory cache för nu)
export const fetchDailyHistory = async (ticker) => {
  const cacheKey = `history_${ticker}`; // Använder clientSideApiCache
  const CACHE_DURATION = 60 * 60 * 1000; // 1 timme
  
  if (isClientCacheValid(cacheKey, CACHE_DURATION)) {
    console.log(`[Frontend/Client_Cache] Använder cachad historik för: ${ticker}`);
    return clientSideApiCache[cacheKey].data;
  }
  
   console.log(`[Frontend] Hämtar historik för ${ticker} från proxy`);
  try {
    const response = await axios.get(`${PROXY_BASE_URL}/history/${ticker}`);
    
    if (response.data && Array.isArray(response.data)) {
        clientSideApiCache[cacheKey] = { 
          data: response.data, 
          timestamp: Date.now() 
        };
       return response.data;
    } else {
       console.warn(`[Frontend] Ingen historik returnerades från proxy för ${ticker}`);
       return [];
    }
  } catch (error) {
     console.error(`[Frontend] Fel vid hämtning av historik från proxy för ${ticker}:`,
                  error.response ? error.response.data : error.message);
    return [];
  }
};

// Hämta företagsinformation - Anropar nu backend-proxyn
export const fetchCompanyOverview = async (ticker) => {
  const cacheKey = `overview_${ticker}`; // Använder clientSideApiCache
  const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 timmar 
  
  if (isClientCacheValid(cacheKey, CACHE_DURATION)) {
    console.log(`[Frontend/Client_Cache] Använder cachad företagsinfo för: ${ticker}`);
    return clientSideApiCache[cacheKey].data;
  }
  
   console.log(`[Frontend] Hämtar företagsinfo för ${ticker} från proxy`);
   try {
      const response = await axios.get(`${PROXY_BASE_URL}/overview/${ticker}`);
      if (response.data) {
        clientSideApiCache[cacheKey] = { 
          data: response.data, 
          timestamp: Date.now() 
        };
        return response.data;
      } else {
         console.warn(`[Frontend] Ingen företagsinfo returnerades från proxy för ${ticker}`);
         return null;
      }
   } catch (error) {
       console.error(`[Frontend] Fel vid hämtning av företagsinfo från proxy för ${ticker}:`,
                    error.response ? error.response.data : error.message);
       return null;
   }
};

// Hämta nyheter - Anropar nu backend-proxyn
export const fetchNews = async (query) => { // apiKey behövs inte längre här
  const cacheKey = `news_${query}`;
  const CACHE_DURATION = 30 * 60 * 1000; // 30 minuter
  
  if (isClientCacheValid(cacheKey, CACHE_DURATION)) {
    console.log(`[Frontend] Använder cachade nyheter för: ${query}`);
    return clientSideApiCache[cacheKey].data;
  }
  
  console.log(`[Frontend] Hämtar nyheter för ${query} från proxy`);
  try {
      // Anropa din backend-proxy
      const response = await axios.get(`${PROXY_BASE_URL}/news`, { params: { q: query } });
      
      if (response.data && Array.isArray(response.data)) {
           clientSideApiCache[cacheKey] = { 
              data: response.data, 
              timestamp: Date.now() 
            };
          return response.data;
      } else {
          console.warn(`[Frontend] Inga nyheter returnerades från proxy för ${query}`);
          return [];
      }
  } catch (error) {
     console.error(`[Frontend] Fel vid hämtning av nyheter från proxy för ${query}:`, 
                  error.response ? error.response.data : error.message);
    return [];
  }
};

// Ny funktion för att specifikt hämta företagsnyheter från Finnhub (via vår proxy)
// Denna kan användas om man vill ha enbart Finnhub-nyheter eller som ett komplement.
export const fetchFinnhubCompanyNews = async (ticker) => {
  const cacheKey = `finnhub_company_news_${ticker}`;
  const CACHE_DURATION = 30 * 60 * 1000; // 30 minuter

  if (isClientCacheValid(cacheKey, CACHE_DURATION)) {
    console.log(`[Frontend] Använder cachade Finnhub företagsnyheter för: ${ticker}`);
    return clientSideApiCache[cacheKey].data;
  }

  console.log(`[Frontend] Hämtar Finnhub företagsnyheter för ${ticker} från proxy`);
  try {
    // Backend-endpointen /api/news hanterar nu fallback till Finnhub om query är en ticker.
    // Vi kan anropa samma endpoint, backend avgör källan.
    // Om du vill ha en *separat* endpoint på backend enbart för Finnhub-nyheter,
    // skulle det behöva läggas till där och anropas här.
    // För nu, återanvänder vi /api/news.
    const response = await axios.get(`${PROXY_BASE_URL}/news`, { params: { q: ticker } });

    if (response.data && Array.isArray(response.data)) {
      // Filtrera för att bara få nyheter där källan indikerar Finnhub (om backend lägger till den infon)
      // Eller så litar vi på att backend skickar det vi vill ha.
      // För enkelhetens skull antar vi att backendens /api/news?q=TICKER
      // prioriterar eller inkluderar Finnhub-nyheter för en ticker.
      const newsFromFinnhub = response.data.filter(article => article.apiSource === 'Finnhub' || !article.apiSource); // Anpassa vid behov

      clientSideApiCache[cacheKey] = {
        data: newsFromFinnhub, // Spara potentiellt filtrerad lista
        timestamp: Date.now()
      };
      return newsFromFinnhub;
    } else {
      console.warn(`[Frontend] Inga Finnhub företagsnyheter returnerades från proxy för ${ticker}`);
      return [];
    }
  } catch (error) {
    console.error(`[Frontend] Fel vid hämtning av Finnhub företagsnyheter för ${ticker}:`,
                 error.response ? error.response.data : error.message);
    return [];
  }
};

// NYA FUNKTIONER (Dessa behöver också uppdateras eller tas bort om de inte används)

// Hämta marknadsindex - Behöver uppdateras för att använda proxy
export const fetchMarketIndex = async (symbol) => {
   const cacheKey = `index_${symbol}`;
   const CACHE_DURATION = 15 * 60 * 1000; // 15 minuter

   if (isClientCacheValid(cacheKey, CACHE_DURATION)) {
     console.log(`[Frontend] Använder cachad indexdata för: ${symbol}`);
     return clientSideApiCache[cacheKey].data;
   }

   console.log(`[Frontend] Hämtar indexdata för ${symbol} från proxy`);
   try {
     // Anropa proxyns quote-endpoint (eftersom servern hanterar både aktier och index där)
     const response = await axios.get(`${PROXY_BASE_URL}/quote/${symbol}`);
     if (response.data) {
       // Servern returnerar redan det format vi behöver för quote,
       // men vi kanske vill lägga till symbol här om det behövs
       const indexData = { ...response.data, symbol: symbol }; 
       clientSideApiCache[cacheKey] = { 
         data: indexData, 
         timestamp: Date.now() 
       };
       return indexData;
     } else {
       console.warn(`[Frontend] Ingen indexdata returnerades från proxy för ${symbol}`);
       return null;
     }
   } catch (error) {
     console.error(`[Frontend] Fel vid hämtning av indexdata från proxy för ${symbol}:`, 
                   error.response ? error.response.data : error.message);
     return null;
   }
};

// Hämta valutakurser - Behöver uppdateras för att använda proxy
// TODO: Skapa en /api/currency endpoint på servern om denna funktion behövs.
export const fetchCurrencyRate = async (fromCurrency, toCurrency) => {
   const cacheKey = `currency_${fromCurrency}_${toCurrency}`;
   const CACHE_DURATION = 30 * 60 * 1000; // 30 minuter

   if (isClientCacheValid(cacheKey, CACHE_DURATION)) {
     console.log(`[Frontend] Använder cachad valutakurs för: ${fromCurrency}/${toCurrency}`);
     return clientSideApiCache[cacheKey].data;
   }

   console.log(`[Frontend] Hämtar valutakurs för ${fromCurrency}/${toCurrency} från proxy`);
   try {
     const response = await axios.get(`${PROXY_BASE_URL}/currency/${fromCurrency}/${toCurrency}`);
     
     if (response.data) {
       clientSideApiCache[cacheKey] = { 
         data: response.data, 
         timestamp: Date.now() 
       };
       return response.data;
     } else {
       console.warn(`[Frontend] Ingen valutakursdata returnerades från proxy för ${fromCurrency}/${toCurrency}`);
       return null;
     }
   } catch (error) {
     console.error(`[Frontend] Fel vid hämtning av valutakursdata för ${fromCurrency}/${toCurrency}:`, 
                  error.response ? error.response.data : error.message);
     return null;
   }
};

// Hämta dagens vinnare/förlorare - Behöver uppdateras för att använda proxy
// TODO: Skapa en /api/topmovers endpoint på servern om denna funktion behövs.
export const fetchTopMovers = async (stockList) => {
   const cacheKey = 'top_movers';
   const CACHE_DURATION = 15 * 60 * 1000; // 15 minuter

   if (isClientCacheValid(cacheKey, CACHE_DURATION)) {
     console.log(`[Frontend] Använder cachade top movers`);
     return clientSideApiCache[cacheKey].data;
   }

   console.log(`[Frontend] Hämtar top movers från proxy`);
   try {
     // Konvertera stockList till rätt format
     const stocksForPost = stockList.map(stock => {
       if (typeof stock === 'object') {
         return { ticker: stock.ticker, name: stock.name };
       }
       return stock;
     });
     
     const response = await axios.post(`${PROXY_BASE_URL}/topmovers`, { stocks: stocksForPost });
     
     if (response.data) {
       clientSideApiCache[cacheKey] = { 
         data: response.data, 
         timestamp: Date.now() 
       };
       return response.data;
     } else {
       console.warn(`[Frontend] Inga top movers returnerades från proxy`);
       return { gainers: [], losers: [] };
     }
   } catch (error) {
     console.error(`[Frontend] Fel vid hämtning av top movers:`, 
                  error.response ? error.response.data : error.message);
     return { gainers: [], losers: [] };
   }
};

// Utökad företagsinformation - Anropas nu via fetchCompanyOverview
export const fetchExtendedCompanyInfo = async (ticker) => {
  // Denna funktion är nu samma som fetchCompanyOverview eftersom servern
  // förväntas returnera all data (både grundläggande och "utökad") från /api/overview/:ticker
  console.log(`[Frontend] fetchExtendedCompanyInfo anropar fetchCompanyOverview för ${ticker}`);
  return await fetchCompanyOverview(ticker);
};

// Ny funktion för att hämta flera kurser samtidigt
export const fetchMultipleStockQuotes = async (tickers) => {
  if (!tickers || tickers.length === 0) {
    return {};
  }
  
  console.log(`[Frontend] Hämtar ${tickers.length} kurser:`, tickers);

  try {
    // Skapa en array av promises för att hämta varje quote
    const quotePromises = tickers.map(ticker => fetchStockQuote(ticker));

    // Vänta på att alla promises ska slutföras (även om några misslyckas)
    const results = await Promise.allSettled(quotePromises);

    const quotes = {};
    results.forEach((result, index) => {
      const ticker = tickers[index];
      if (result.status === 'fulfilled' && result.value) {
        quotes[ticker] = result.value;
      } else if (result.status === 'rejected') {
        console.warn(`[Frontend] Kunde inte hämta kurs för ${ticker} i batch:`, result.reason);
        // Eventuellt sätta null eller behålla gamla värdet om det fanns?
        // För nu sätter vi inget för misslyckade anrop.
      }
    });

    console.log(`[Frontend] Hämtade ${Object.keys(quotes).length} av ${tickers.length} kurser.`);
    return quotes;

  } catch (error) {
    // Detta block bör teoretiskt sett inte nås med allSettled, 
    // men finns här som en säkerhetsåtgärd.
    console.error('[Frontend] Oväntat fel vid hämtning av flera kurser:', error);
    return {};
  }
};

// Hjälpfunktioner för formatering (behålls på klienten)
export const formatNumber = (num, decimals = 2) => {
  if (num === null || num === undefined || isNaN(num)) return '-';
  return num.toLocaleString('sv-SE', { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  });
};

export const formatLargeNumber = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '-';
  if (Math.abs(num) >= 1e12) return (num / 1e12).toFixed(1) + ' TKR';
  if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(1) + ' MDR';
  if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(1) + ' MKR';
  return num.toLocaleString('sv-SE');
};

export const formatDateAxis = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' });
};

// --- FMP API Funktioner ---

// Hämta FMP Företagsprofil
export const fetchFmpProfile = async (ticker) => {
  const cacheKey = `fmp_profile_${ticker}`;
  const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 timmar

  if (isClientCacheValid(cacheKey, CACHE_DURATION)) {
    console.log(`[Frontend/FMP] Använder cachad FMP-profil för: ${ticker}`);
    return clientSideApiCache[cacheKey].data;
  }

  console.log(`[Frontend/FMP] Hämtar FMP-profil för ${ticker} från proxy`);
  try {
    const response = await axios.get(`${PROXY_BASE_URL}/fmp/profile/${ticker}`);
    if (response.data) {
      clientSideApiCache[cacheKey] = { data: response.data, timestamp: Date.now() };
      return response.data;
    } else {
      console.warn(`[Frontend/FMP] Ingen profildata från FMP för ${ticker}`);
      return null;
    }
  } catch (error) {
    console.error(`[Frontend/FMP] Fel vid hämtning av FMP-profil för ${ticker}:`,
                  error.response ? error.response.data : error.message);
    return null;
  }
};

// Hämta FMP Nyckeltal (ratios)
export const fetchFmpRatios = async (ticker) => {
  const cacheKey = `fmp_ratios_${ticker}`;
  const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 timmar (kan ändras oftare än profil)

  if (isClientCacheValid(cacheKey, CACHE_DURATION)) {
    console.log(`[Frontend/FMP] Använder cachade FMP-nyckeltal för: ${ticker}`);
    return clientSideApiCache[cacheKey].data;
  }

  console.log(`[Frontend/FMP] Hämtar FMP-nyckeltal för ${ticker} från proxy`);
  try {
    const response = await axios.get(`${PROXY_BASE_URL}/fmp/ratios/${ticker}`);
    if (response.data) {
      clientSideApiCache[cacheKey] = { data: response.data, timestamp: Date.now() };
      return response.data;
    } else {
      console.warn(`[Frontend/FMP] Ingen nyckeltalsdata från FMP för ${ticker}`);
      return null;
    }
  } catch (error) {
    console.error(`[Frontend/FMP] Fel vid hämtning av FMP-nyckeltal för ${ticker}:`,
                  error.response ? error.response.data : error.message);
    return null;
  }
};

// Hämta FMP Finansiell Rapport (Income, Balance, Cash Flow)
const fetchFmpStatement = async (ticker, statementType, period = 'annual', limit = 5) => {
  const endpointMap = {
    income: 'income-statement',
    balance: 'balance-sheet',
    cashflow: 'cash-flow'
  };
  const apiEndpoint = endpointMap[statementType.toLowerCase()];
  if (!apiEndpoint) {
    console.error(`[Frontend/FMP] Ogiltig statementType: ${statementType}`);
    return [];
  }

  const cacheKey = `fmp_statement_${ticker}_${apiEndpoint}_${period}_${limit}`;
  const CACHE_DURATION = 24 * 60 * 60 * 1000; // Rapporter ändras inte så ofta

  if (isClientCacheValid(cacheKey, CACHE_DURATION)) {
    console.log(`[Frontend/FMP] Använder cachad FMP ${statementType} för ${ticker} (${period}, ${limit})`);
    return clientSideApiCache[cacheKey].data;
  }

  console.log(`[Frontend/FMP] Hämtar FMP ${statementType} för ${ticker} (${period}, ${limit}) från proxy`);
  try {
    const response = await axios.get(`${PROXY_BASE_URL}/fmp/${apiEndpoint}/${ticker}`, {
      params: { period, limit }
    });
    if (response.data && Array.isArray(response.data)) {
      clientSideApiCache[cacheKey] = { data: response.data, timestamp: Date.now() };
      return response.data;
    } else {
      console.warn(`[Frontend/FMP] Ingen ${statementType}-data från FMP för ${ticker}`);
      return [];
    }
  } catch (error) {
    console.error(`[Frontend/FMP] Fel vid hämtning av FMP ${statementType} för ${ticker}:`,
                  error.response ? error.response.data : error.message);
    return [];
  }
};

export const fetchFmpIncomeStatement = (ticker, period = 'annual', limit = 5) => {
  return fetchFmpStatement(ticker, 'income', period, limit);
};

export const fetchFmpBalanceSheet = (ticker, period = 'annual', limit = 5) => {
  return fetchFmpStatement(ticker, 'balance', period, limit);
};

export const fetchFmpCashFlow = (ticker, period = 'annual', limit = 5) => {
  return fetchFmpStatement(ticker, 'cashflow', period, limit);
};

// --- CoinGecko API Funktioner ---

// Ping CoinGecko API (mest för testning)
export const pingCoinGecko = async () => {
  console.log('[Frontend/CoinGecko] Pinging CoinGecko API via proxy');
  try {
    const response = await axios.get(`${PROXY_BASE_URL}/coingecko/ping`);
    console.log('[Frontend/CoinGecko] Ping response:', response.data);
    return response.data;
  } catch (error) {
    console.error('[Frontend/CoinGecko] Fel vid ping till CoinGecko:', 
                  error.response ? error.response.data : error.message);
    return null;
  }
};

// Hämta marknadsdata för kryptovalutor
export const fetchCryptoMarkets = async (params = {}) => {
  // params kan innehålla: { vs_currency, per_page, page, order }
  const { vs_currency = 'usd', per_page = 100, page = 1, order = 'market_cap_desc' } = params;
  const cacheKey = `coingecko_markets_${vs_currency}_${per_page}_${page}_${order}`;
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minuter

  if (isClientCacheValid(cacheKey, CACHE_DURATION)) {
    console.log(`[Frontend/CoinGecko] Använder cachad kryptomarknadsdata`);
    return clientSideApiCache[cacheKey].data;
  }

  console.log(`[Frontend/CoinGecko] Hämtar kryptomarknader från proxy`, params);
  try {
    const response = await axios.get(`${PROXY_BASE_URL}/coingecko/coins/markets`, { params });
    if (response.data && Array.isArray(response.data)) {
      clientSideApiCache[cacheKey] = { data: response.data, timestamp: Date.now() };
      return response.data;
    } else {
      console.warn('[Frontend/CoinGecko] Ingen kryptomarknadsdata returnerades');
      return [];
    }
  } catch (error) {
    console.error('[Frontend/CoinGecko] Fel vid hämtning av kryptomarknader:',
                  error.response ? error.response.data : error.message);
    return [];
  }
};

// Hämta detaljerad information för en specifik kryptovaluta
export const fetchCryptoDetails = async (coinId) => {
  if (!coinId) {
    console.error('[Frontend/CoinGecko] coinId saknas för fetchCryptoDetails');
    return null;
  }
  const cacheKey = `coingecko_coin_${coinId}`;
  const CACHE_DURATION = 15 * 60 * 1000; // 15 minuter

  if (isClientCacheValid(cacheKey, CACHE_DURATION)) {
    console.log(`[Frontend/CoinGecko] Använder cachad kryptodetaljdata för: ${coinId}`);
    return clientSideApiCache[cacheKey].data;
  }

  console.log(`[Frontend/CoinGecko] Hämtar kryptodetaljer för ${coinId} från proxy`);
  try {
    const response = await axios.get(`${PROXY_BASE_URL}/coingecko/coins/${coinId}`);
    if (response.data) {
      clientSideApiCache[cacheKey] = { data: response.data, timestamp: Date.now() };
      return response.data;
    } else {
      console.warn(`[Frontend/CoinGecko] Ingen detaljdata returnerades för ${coinId}`);
      return null;
    }
  } catch (error) {
    console.error(`[Frontend/CoinGecko] Fel vid hämtning av kryptodetaljer för ${coinId}:`,
                  error.response ? error.response.data : error.message);
    return null;
  }
};

// Hämta historisk marknadsdata för en specifik kryptovaluta
export const fetchCryptoMarketChart = async (coinId, params = {}) => {
  // params kan innehålla: { vs_currency, days, interval }
  if (!coinId) {
    console.error('[Frontend/CoinGecko] coinId saknas för fetchCryptoMarketChart');
    return null;
  }
  const { vs_currency = 'usd', days = '30' } = params;
  const cacheKey = `coingecko_chart_${coinId}_${vs_currency}_${days}_${params.interval || 'auto'}`;
  const CACHE_DURATION = 30 * 60 * 1000; // 30 minuter

  if (isClientCacheValid(cacheKey, CACHE_DURATION)) {
    console.log(`[Frontend/CoinGecko] Använder cachad kryptohistorik för: ${coinId}`);
    return clientSideApiCache[cacheKey].data;
  }

  console.log(`[Frontend/CoinGecko] Hämtar kryptohistorik för ${coinId} från proxy`, params);
  try {
    const response = await axios.get(`${PROXY_BASE_URL}/coingecko/coins/${coinId}/market_chart`, { params });
    if (response.data) {
      // Svaret har formatet {prices: [[ts, val]], market_caps: ..., total_volumes: ...}
      clientSideApiCache[cacheKey] = { data: response.data, timestamp: Date.now() };
      return response.data;
    } else {
      console.warn(`[Frontend/CoinGecko] Ingen historikdata returnerades för ${coinId}`);
      return null;
    }
  } catch (error) {
    console.error(`[Frontend/CoinGecko] Fel vid hämtning av kryptohistorik för ${coinId}:`,
                  error.response ? error.response.data : error.message);
    return null;
  }
};

// --- FRED API Funktioner ---

// Hämta observationer för en specifik FRED-dataserie
export const fetchFredSeriesObservations = async (seriesId, params = {}) => {
  // params kan innehålla: { observation_start, observation_end, limit, sort_order, units }
  if (!seriesId) {
    console.error('[Frontend/FRED] seriesId saknas för fetchFredSeriesObservations');
    return null;
  }

  // Bygg en dynamisk cache-nyckel baserat på serie-ID och relevanta parametrar
  const relevantParams = ['observation_start', 'observation_end', 'limit', 'sort_order', 'units'];
  let cacheParamsString = '';
  for (const key of relevantParams) {
    if (params[key]) {
      cacheParamsString += `_${key}_${params[key]}`;
    }
  }
  const cacheKey = `fred_series_${seriesId}${cacheParamsString}`;
  const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 timmar, ekonomisk data uppdateras inte superofta

  if (isClientCacheValid(cacheKey, CACHE_DURATION)) {
    console.log(`[Frontend/FRED] Använder cachad FRED-data för serien: ${seriesId}`);
    return clientSideApiCache[cacheKey].data;
  }

  console.log(`[Frontend/FRED] Hämtar FRED-data för serien ${seriesId} från proxy`, params);
  try {
    const response = await axios.get(`${PROXY_BASE_URL}/fred/series/observations/${seriesId}`, { params });
    if (response.data && response.data.observations) {
      clientSideApiCache[cacheKey] = { data: response.data, timestamp: Date.now() };
      return response.data;
    } else {
      console.warn(`[Frontend/FRED] Ingen observationsdata returnerades för FRED-serien ${seriesId}`);
      return null;
    }
  } catch (error) {
    console.error(`[Frontend/FRED] Fel vid hämtning av FRED-data för serien ${seriesId}:`,
                  error.response ? error.response.data : error.message);
    return null;
  }
};

// --- EOD Historical Data (EODHD) API Funktioner ---

// Hämta insider-transaktioner från EODHD
export const fetchEodhdInsiderTransactions = async (ticker) => {
  if (!ticker) {
    console.error('[Frontend/EODHD] Ticker saknas för fetchEodhdInsiderTransactions');
    return []; // Returnera tom array vid fel
  }
  const cacheKey = `eodhd_insider_${ticker}`;
  const CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 timmar

  if (isClientCacheValid(cacheKey, CACHE_DURATION)) {
    console.log(`[Frontend/EODHD] Använder cachad insiderdata för: ${ticker}`);
    return clientSideApiCache[cacheKey].data;
  }

  console.log(`[Frontend/EODHD] Hämtar insider-transaktioner för ${ticker} från proxy`);
  try {
    const response = await axios.get(`${PROXY_BASE_URL}/eodhd/insider-transactions/${ticker}`);
    if (response.data && Array.isArray(response.data)) {
      clientSideApiCache[cacheKey] = { data: response.data, timestamp: Date.now() };
      return response.data;
    } else {
      console.warn(`[Frontend/EODHD] Ingen insiderdata returnerades för ${ticker}`, response.data);
      return []; // Returnera tom array om ingen data eller fel format
    }
  } catch (error) {
    console.error(`[Frontend/EODHD] Fel vid hämtning av insider-transaktioner för ${ticker}:`,
                  error.response ? error.response.data : error.message);
    return []; // Returnera tom array vid fel
  }
}; 