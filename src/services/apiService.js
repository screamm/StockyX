import axios from 'axios';

// Basadresser för API:er
const AV_BASE_URL = 'https://www.alphavantage.co/query';
const NEWS_API_BASE_URL = 'https://newsapi.org/v2/everything';

// Cache för att minimera API-anrop
let apiCache = {};

// Hjälpfunktion för att kontrollera cachens giltighet
const isCacheValid = (cacheKey, duration) => {
  if (!apiCache[cacheKey]) return false;
  
  const now = Date.now();
  return (now - apiCache[cacheKey].timestamp < duration);
};

// Hämta aktiekurs (GLOBAL_QUOTE)
export const fetchStockQuote = async (ticker, apiKey) => {
  const cacheKey = `quote_${ticker}`;
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minuter
  
  if (isCacheValid(cacheKey, CACHE_DURATION)) {
    console.log("Använder cachad kursdata för:", ticker);
    return apiCache[cacheKey].data;
  }
  
  if (!apiKey || apiKey === 'YOUR_ALPHA_VANTAGE_KEY') {
    console.warn("Alpha Vantage API-nyckel saknas");
    return null;
  }
  
  console.log("Hämtar kursdata för:", ticker);
  try {
    const response = await axios.get(AV_BASE_URL, {
      params: {
        function: 'GLOBAL_QUOTE',
        symbol: ticker,
        apikey: apiKey
      }
    });
    
    const quoteData = response.data['Global Quote'];
    if (quoteData && Object.keys(quoteData).length > 0) {
      const formattedData = {
        price: parseFloat(quoteData['05. price']),
        change: parseFloat(quoteData['09. change']),
        changePercent: parseFloat(quoteData['10. change percent'].replace('%', '')),
        volume: parseInt(quoteData['06. volume']),
        prevClose: parseFloat(quoteData['08. previous close']),
        lastTradingDay: quoteData['07. latest trading day'],
        open: parseFloat(quoteData['02. open']),
        dayHigh: parseFloat(quoteData['03. high']),
        dayLow: parseFloat(quoteData['04. low']),
      };
      
      apiCache[cacheKey] = { 
        data: formattedData, 
        timestamp: Date.now() 
      };
      
      return formattedData;
    } else {
      console.warn(`Ingen kursdata hittades för ${ticker}`, response.data);
      return null;
    }
  } catch (error) {
    console.error(`Fel vid hämtning av kursdata för ${ticker}:`, error);
    return null;
  }
};

// Hämta historisk data (TIME_SERIES_DAILY_ADJUSTED)
export const fetchDailyHistory = async (ticker, apiKey) => {
  const cacheKey = `history_${ticker}`;
  const CACHE_DURATION = 60 * 60 * 1000; // 1 timme
  
  if (isCacheValid(cacheKey, CACHE_DURATION)) {
    console.log("Använder cachad historik för:", ticker);
    return apiCache[cacheKey].data;
  }
  
  if (!apiKey || apiKey === 'YOUR_ALPHA_VANTAGE_KEY') {
    console.warn("Alpha Vantage API-nyckel saknas");
    return [];
  }
  
  console.log("Hämtar historik för:", ticker);
  try {
    const response = await axios.get(AV_BASE_URL, {
      params: {
        function: 'TIME_SERIES_DAILY_ADJUSTED',
        symbol: ticker,
        outputsize: 'compact', // 100 dagar
        apikey: apiKey
      }
    });
    
    const timeSeries = response.data['Time Series (Daily)'];
    if (timeSeries) {
      const formattedData = Object.entries(timeSeries)
        .map(([date, values]) => ({
          date: date,
          price: parseFloat(values['5. adjusted close']),
          volume: parseInt(values['6. volume'])
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      
      apiCache[cacheKey] = { 
        data: formattedData, 
        timestamp: Date.now() 
      };
      
      return formattedData;
    } else {
      console.warn(`Ingen historisk data hittades för ${ticker}`, response.data);
      return [];
    }
  } catch (error) {
    console.error(`Fel vid hämtning av historik för ${ticker}:`, error);
    return [];
  }
};

// Hämta företagsinformation (OVERVIEW)
export const fetchCompanyOverview = async (ticker, apiKey) => {
  const cacheKey = `overview_${ticker}`;
  const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 timmar
  
  if (isCacheValid(cacheKey, CACHE_DURATION)) {
    console.log("Använder cachad företagsinfo för:", ticker);
    return apiCache[cacheKey].data;
  }
  
  if (!apiKey || apiKey === 'YOUR_ALPHA_VANTAGE_KEY') {
    console.warn("Alpha Vantage API-nyckel saknas");
    return null;
  }
  
  console.log("Hämtar företagsinfo för:", ticker);
  try {
    const response = await axios.get(AV_BASE_URL, {
      params: {
        function: 'OVERVIEW',
        symbol: ticker,
        apikey: apiKey
      }
    });
    
    const overviewData = response.data;
    if (overviewData && overviewData.Symbol) {
      const formattedData = {
        name: overviewData.Name,
        description: overviewData.Description,
        sector: overviewData.Sector,
        industry: overviewData.Industry,
        marketCap: parseInt(overviewData.MarketCapitalization),
        peRatio: parseFloat(overviewData.PERatio),
        dividendYield: parseFloat(overviewData.DividendYield) * 100,
        fiftyTwoWeekHigh: parseFloat(overviewData['52WeekHigh']),
        fiftyTwoWeekLow: parseFloat(overviewData['52WeekLow']),
      };
      
      apiCache[cacheKey] = { 
        data: formattedData, 
        timestamp: Date.now() 
      };
      
      return formattedData;
    } else {
      console.warn(`Ingen företagsinfo hittades för ${ticker}`, response.data);
      return null;
    }
  } catch (error) {
    console.error(`Fel vid hämtning av företagsinfo för ${ticker}:`, error);
    return null;
  }
};

// Hämta nyheter (NewsAPI)
export const fetchNews = async (query, apiKey) => {
  const cacheKey = `news_${query}`;
  const CACHE_DURATION = 30 * 60 * 1000; // 30 minuter
  
  if (isCacheValid(cacheKey, CACHE_DURATION)) {
    console.log("Använder cachade nyheter för:", query);
    return apiCache[cacheKey].data;
  }
  
  if (!apiKey || apiKey === 'YOUR_NEWSAPI_KEY') {
    console.warn("NewsAPI-nyckel saknas");
    return [];
  }
  
  console.log("Hämtar nyheter för:", query);
  try {
    const response = await axios.get(NEWS_API_BASE_URL, {
      params: {
        q: query,
        language: 'sv',
        sortBy: 'publishedAt',
        pageSize: 20,
        apiKey: apiKey
      }
    });
    
    if (response.data && response.data.articles) {
      const articles = response.data.articles.map(article => ({
        id: article.url + article.publishedAt,
        title: article.title,
        summary: article.description,
        url: article.url,
        source: article.source.name,
        date: article.publishedAt,
        sentiment: 'neutral'
      }));
      
      apiCache[cacheKey] = { 
        data: articles, 
        timestamp: Date.now() 
      };
      
      return articles;
    } else {
      console.warn(`Inga nyheter hittades för ${query}`, response.data);
      return [];
    }
  } catch (error) {
    console.error(`Fel vid hämtning av nyheter för ${query}:`, error);
    return [];
  }
};

// NYA FUNKTIONER

// Hämta marknadsindex (t.ex. S&P 500, OMXS30)
export const fetchMarketIndex = async (symbol, apiKey) => {
  const cacheKey = `index_${symbol}`;
  const CACHE_DURATION = 15 * 60 * 1000; // 15 minuter
  
  if (isCacheValid(cacheKey, CACHE_DURATION)) {
    console.log("Använder cachad indexdata för:", symbol);
    return apiCache[cacheKey].data;
  }
  
  if (!apiKey || apiKey === 'YOUR_ALPHA_VANTAGE_KEY') {
    console.warn("Alpha Vantage API-nyckel saknas");
    return null;
  }
  
  console.log("Hämtar indexdata för:", symbol);
  try {
    const response = await axios.get(AV_BASE_URL, {
      params: {
        function: 'GLOBAL_QUOTE',
        symbol: symbol,
        apikey: apiKey
      }
    });
    
    const quoteData = response.data['Global Quote'];
    if (quoteData && Object.keys(quoteData).length > 0) {
      const formattedData = {
        symbol: symbol,
        price: parseFloat(quoteData['05. price']),
        change: parseFloat(quoteData['09. change']),
        changePercent: parseFloat(quoteData['10. change percent'].replace('%', '')),
        lastTradingDay: quoteData['07. latest trading day'],
      };
      
      apiCache[cacheKey] = { 
        data: formattedData, 
        timestamp: Date.now() 
      };
      
      return formattedData;
    } else {
      console.warn(`Ingen indexdata hittades för ${symbol}`, response.data);
      return null;
    }
  } catch (error) {
    console.error(`Fel vid hämtning av indexdata för ${symbol}:`, error);
    return null;
  }
};

// Hämta valutakurser (t.ex. USD/SEK)
export const fetchCurrencyRate = async (fromCurrency, toCurrency, apiKey) => {
  const cacheKey = `currency_${fromCurrency}_${toCurrency}`;
  const CACHE_DURATION = 60 * 60 * 1000; // 1 timme
  
  if (isCacheValid(cacheKey, CACHE_DURATION)) {
    console.log(`Använder cachad valutakurs för: ${fromCurrency}/${toCurrency}`);
    return apiCache[cacheKey].data;
  }
  
  if (!apiKey || apiKey === 'YOUR_ALPHA_VANTAGE_KEY') {
    console.warn("Alpha Vantage API-nyckel saknas");
    return null;
  }
  
  console.log(`Hämtar valutakurs för: ${fromCurrency}/${toCurrency}`);
  try {
    const response = await axios.get(AV_BASE_URL, {
      params: {
        function: 'CURRENCY_EXCHANGE_RATE',
        from_currency: fromCurrency,
        to_currency: toCurrency,
        apikey: apiKey
      }
    });
    
    const exchangeData = response.data['Realtime Currency Exchange Rate'];
    if (exchangeData) {
      const formattedData = {
        fromCurrency: fromCurrency,
        toCurrency: toCurrency,
        rate: parseFloat(exchangeData['5. Exchange Rate']),
        lastUpdated: exchangeData['6. Last Refreshed'],
        timeZone: exchangeData['7. Time Zone'],
      };
      
      apiCache[cacheKey] = { 
        data: formattedData, 
        timestamp: Date.now() 
      };
      
      return formattedData;
    } else {
      console.warn(`Ingen valutakursdata hittades för ${fromCurrency}/${toCurrency}`, response.data);
      return null;
    }
  } catch (error) {
    console.error(`Fel vid hämtning av valutakurs för ${fromCurrency}/${toCurrency}:`, error);
    return null;
  }
};

// Hämta dagens vinnare/förlorare (simulerad då Alpha Vantage inte har en specifik endpoint för detta)
export const fetchTopMovers = async (stockList, apiKey, limit = 5) => {
  const cacheKey = 'top_movers';
  const CACHE_DURATION = 30 * 60 * 1000; // 30 minuter
  
  if (isCacheValid(cacheKey, CACHE_DURATION)) {
    console.log("Använder cachade topp-kurser");
    return apiCache[cacheKey].data;
  }
  
  if (!apiKey || apiKey === 'YOUR_ALPHA_VANTAGE_KEY' || !stockList || stockList.length === 0) {
    console.warn("API-nyckel eller aktielista saknas");
    return { gainers: [], losers: [] };
  }
  
  console.log("Hämtar dagens vinnare och förlorare");
  try {
    // Hämta quotes för alla aktier i listan
    const quotes = [];
    
    // Vi begränsar antalet anrop för att inte överbelasta API:et
    const maxStocks = Math.min(stockList.length, 20);
    
    for (let i = 0; i < maxStocks; i++) {
      const quote = await fetchStockQuote(stockList[i].ticker, apiKey);
      if (quote) {
        quotes.push({
          ...quote,
          ticker: stockList[i].ticker,
          name: stockList[i].name
        });
      }
      
      // Fördröj för att inte nå Alpha Vantage API-gränser
      if (i < maxStocks - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
    
    // Sortera efter procent förändring
    quotes.sort((a, b) => b.changePercent - a.changePercent);
    
    const result = {
      gainers: quotes.filter(q => q.changePercent > 0).slice(0, limit),
      losers: quotes.filter(q => q.changePercent < 0).sort((a, b) => a.changePercent - b.changePercent).slice(0, limit)
    };
    
    apiCache[cacheKey] = { 
      data: result, 
      timestamp: Date.now() 
    };
    
    return result;
  } catch (error) {
    console.error('Fel vid hämtning av topp-kurser:', error);
    return { gainers: [], losers: [] };
  }
};

// Utökad företagsinformation
export const fetchExtendedCompanyInfo = async (ticker, apiKey) => {
  // Först hämta grundläggande företagsöversikt
  const overview = await fetchCompanyOverview(ticker, apiKey);
  if (!overview) return null;
  
  // Simulerar ytterligare företagsdata (dessa API-endpoints finns inte i Alpha Vantage)
  // I en riktig app skulle detta hämtas från ytterligare API-anrop
  const cacheKey = `extended_info_${ticker}`;
  const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 timmar
  
  if (isCacheValid(cacheKey, CACHE_DURATION)) {
    console.log("Använder cachad utökad företagsinfo för:", ticker);
    return { ...overview, ...apiCache[cacheKey].data };
  }
  
  // Simulera ytterligare data
  const extendedInfo = {
    // Simulera insiderhandel
    insiderTransactions: [
      { 
        date: '2023-05-15', 
        name: 'Anna Andersson',
        position: 'CEO',
        type: 'Köp',
        shares: 1000,
        price: 150.50,
        value: 150500
      },
      { 
        date: '2023-04-22', 
        name: 'Erik Eriksson',
        position: 'CFO',
        type: 'Sälj',
        shares: 500,
        price: 155.20,
        value: 77600
      }
    ],
    
    // Simulera större ägare
    majorShareholders: [
      { name: 'Institutional Investor AB', shares: 1500000, percent: 15.2 },
      { name: 'Global Asset Management', shares: 1200000, percent: 12.1 },
      { name: 'Pension Fund Three', shares: 850000, percent: 8.6 }
    ],
    
    // Simulera utdelningshistorik
    dividendHistory: [
      { year: '2023', amount: 5.50, yield: 3.2, exDate: '2023-04-15', paymentDate: '2023-05-01' },
      { year: '2022', amount: 5.00, yield: 3.0, exDate: '2022-04-16', paymentDate: '2022-05-02' },
      { year: '2021', amount: 4.50, yield: 2.8, exDate: '2021-04-15', paymentDate: '2021-05-03' }
    ]
  };
  
  apiCache[cacheKey] = { 
    data: extendedInfo, 
    timestamp: Date.now() 
  };
  
  return { ...overview, ...extendedInfo };
};

// Hjälpfunktioner för formatering
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