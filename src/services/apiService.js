import axios from 'axios';

// Basadress till din nya backend-proxy
const PROXY_BASE_URL = 'http://localhost:3001/api'; // Standardport 3001 för servern

// Cache för att minimera API-anrop (kan fortfarande vara användbart på klienten)
let apiCache = {};

// Hjälpfunktion för att kontrollera cachens giltighet
const isCacheValid = (cacheKey, duration) => {
  if (!apiCache[cacheKey]) return false;
  
  const now = Date.now();
  return (now - apiCache[cacheKey].timestamp < duration);
};

// Hämta aktiekurs - Anropar nu backend-proxyn
export const fetchStockQuote = async (ticker) => { // apiKey behövs inte längre här
  const cacheKey = `quote_${ticker}`;
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minuter
  
  if (isCacheValid(cacheKey, CACHE_DURATION)) {
    console.log(`[Frontend] Använder cachad kursdata för: ${ticker}`);
    return apiCache[cacheKey].data;
  }
  
  console.log(`[Frontend] Hämtar kursdata för ${ticker} från proxy`);
  try {
    // Anropa din backend-proxy
    const response = await axios.get(`${PROXY_BASE_URL}/quote/${ticker}`);
    
    if (response.data) {
      apiCache[cacheKey] = { 
        data: response.data, 
        timestamp: Date.now() 
      };
      return response.data;
    } else {
      console.warn(`[Frontend] Ingen kursdata returnerades från proxy för ${ticker}`);
      return null;
    }
  } catch (error) {
    console.error(`[Frontend] Fel vid hämtning av kursdata från proxy för ${ticker}:`, 
                  error.response ? error.response.data : error.message);
    return null; // Returnera null vid fel
  }
};

// Hämta historisk data - Anropar nu backend-proxyn
export const fetchDailyHistory = async (ticker) => { // apiKey behövs inte längre här
  const cacheKey = `history_${ticker}`;
  const CACHE_DURATION = 60 * 60 * 1000; // 1 timme
  
  if (isCacheValid(cacheKey, CACHE_DURATION)) {
    console.log(`[Frontend] Använder cachad historik för: ${ticker}`);
    return apiCache[cacheKey].data;
  }
  
   console.log(`[Frontend] Hämtar historik för ${ticker} från proxy`);
  try {
    // Anropa din backend-proxy
    const response = await axios.get(`${PROXY_BASE_URL}/history/${ticker}`);
    
    if (response.data && Array.isArray(response.data)) {
        apiCache[cacheKey] = { 
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
    return []; // Returnera tom array vid fel
  }
};

// Hämta företagsinformation - Anropar nu backend-proxyn
export const fetchCompanyOverview = async (ticker) => { // apiKey behövs inte längre här
  const cacheKey = `overview_${ticker}`;
  // Använder samma cache som extendedInfo eftersom servern nu returnerar allt
  const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 timmar 
  
  if (isCacheValid(cacheKey, CACHE_DURATION)) {
    console.log(`[Frontend] Använder cachad företagsinfo för: ${ticker}`);
    return apiCache[cacheKey].data;
  }
  
   console.log(`[Frontend] Hämtar företagsinfo för ${ticker} från proxy`);
   try {
      // Anropa din backend-proxy
      const response = await axios.get(`${PROXY_BASE_URL}/overview/${ticker}`);
      
      if (response.data) {
        apiCache[cacheKey] = { 
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
  
  if (isCacheValid(cacheKey, CACHE_DURATION)) {
    console.log(`[Frontend] Använder cachade nyheter för: ${query}`);
    return apiCache[cacheKey].data;
  }
  
  console.log(`[Frontend] Hämtar nyheter för ${query} från proxy`);
  try {
      // Anropa din backend-proxy
      const response = await axios.get(`${PROXY_BASE_URL}/news`, { params: { q: query } });
      
      if (response.data && Array.isArray(response.data)) {
           apiCache[cacheKey] = { 
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

// NYA FUNKTIONER (Dessa behöver också uppdateras eller tas bort om de inte används)

// Hämta marknadsindex - Behöver uppdateras för att använda proxy
export const fetchMarketIndex = async (symbol) => {
   const cacheKey = `index_${symbol}`;
   const CACHE_DURATION = 15 * 60 * 1000; // 15 minuter

   if (isCacheValid(cacheKey, CACHE_DURATION)) {
     console.log(`[Frontend] Använder cachad indexdata för: ${symbol}`);
     return apiCache[cacheKey].data;
   }

   console.log(`[Frontend] Hämtar indexdata för ${symbol} från proxy`);
   try {
     // Anropa proxyns quote-endpoint (eftersom servern hanterar både aktier och index där)
     const response = await axios.get(`${PROXY_BASE_URL}/quote/${symbol}`);
     if (response.data) {
       // Servern returnerar redan det format vi behöver för quote,
       // men vi kanske vill lägga till symbol här om det behövs
       const indexData = { ...response.data, symbol: symbol }; 
       apiCache[cacheKey] = { 
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

   if (isCacheValid(cacheKey, CACHE_DURATION)) {
     console.log(`[Frontend] Använder cachad valutakurs för: ${fromCurrency}/${toCurrency}`);
     return apiCache[cacheKey].data;
   }

   console.log(`[Frontend] Hämtar valutakurs för ${fromCurrency}/${toCurrency} från proxy`);
   try {
     const response = await axios.get(`${PROXY_BASE_URL}/currency/${fromCurrency}/${toCurrency}`);
     
     if (response.data) {
       apiCache[cacheKey] = { 
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

   if (isCacheValid(cacheKey, CACHE_DURATION)) {
     console.log(`[Frontend] Använder cachade top movers`);
     return apiCache[cacheKey].data;
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
       apiCache[cacheKey] = { 
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