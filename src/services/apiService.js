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