import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import yahooFinance from 'yahoo-finance2';
import axios from 'axios'; // För att anropa AV/NewsAPI från servern

dotenv.config(); // Läs in variabler från .env

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---
// Tillåt anrop från din frontend (justera ursprunget om nödvändigt)
app.use(cors({ origin: 'http://localhost:5173' })); 
app.use(express.json()); // För att kunna parse:a JSON i request body (behövs ev. inte nu)

// --- Hämta API-nycklar --- 
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const NEWS_API_KEY = process.env.NEWS_API_KEY;
const AV_BASE_URL = 'https://www.alphavantage.co/query';
const NEWS_API_BASE_URL = 'https://newsapi.org/v2/everything';

// --- API Endpoints --- 

// Test-endpoint
app.get('/api/ping', (req, res) => {
  res.json({ message: 'pong' });
});

// Endpoint för att hämta quote (försöker AV, sen Yahoo)
app.get('/api/quote/:ticker', async (req, res) => {
  const ticker = req.params.ticker;
  console.log(`[Server] Mottog begäran för quote: ${ticker}`);

  try {
    let data = null;
    let source = 'Alpha Vantage';

    // 1. Försök Alpha Vantage
    if (ALPHA_VANTAGE_API_KEY) {
      try {
        const params = {
          function: 'GLOBAL_QUOTE',
          symbol: ticker,
          apikey: ALPHA_VANTAGE_API_KEY
        };
        const avResponse = await axios.get(AV_BASE_URL, { params });
        const quoteData = avResponse.data['Global Quote'];

        if (quoteData && Object.keys(quoteData).length > 0) {
          data = {
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
        } else {
           console.log(`[Server] Ingen data från Alpha Vantage för ${ticker}`);
        }
      } catch (avError) {
        console.error(`[Server] Fel vid hämtning från Alpha Vantage för ${ticker}:`, avError.message);
      }
    }

    // 2. Om Alpha Vantage misslyckades eller inte användes, försök Yahoo Finance
    if (!data) {
      source = 'Yahoo Finance';
      try {
        const yahooQuote = await yahooFinance.quote(ticker);
        if (yahooQuote) {
           data = {
            price: yahooQuote.regularMarketPrice,
            change: yahooQuote.regularMarketChange,
            changePercent: yahooQuote.regularMarketChangePercent,
            volume: yahooQuote.regularMarketVolume,
            prevClose: yahooQuote.regularMarketPreviousClose,
            lastTradingDay: new Date().toISOString().split('T')[0], // Uppskattning
            open: yahooQuote.regularMarketOpen,
            dayHigh: yahooQuote.regularMarketDayHigh,
            dayLow: yahooQuote.regularMarketDayLow,
          };
        } else {
          console.log(`[Server] Ingen data från Yahoo Finance för ${ticker}`);
        }
      } catch (yahooError) {
        console.error(`[Server] Fel vid hämtning från Yahoo Finance för ${ticker}:`, yahooError.message);
      }
    }

    // Skicka svar
    if (data) {
      console.log(`[Server] Skickar data för ${ticker} från ${source}`);
      res.json(data);
    } else {
      console.warn(`[Server] Kunde inte hämta data för ${ticker} från någon källa.`);
      res.status(404).json({ error: 'Kunde inte hitta data för den angivna tickern.' });
    }

  } catch (error) {
    console.error(`[Server] Allmänt fel för quote ${ticker}:`, error);
    res.status(500).json({ error: 'Internt serverfel vid hämtning av aktiekurs.' });
  }
});

// Endpoint för historik (försöker AV, sen Yahoo)
app.get('/api/history/:ticker', async (req, res) => {
  const ticker = req.params.ticker;
  console.log(`[Server] Mottog begäran för historik: ${ticker}`);
  
  try {
    let data = [];
    let source = 'Alpha Vantage';

    // 1. Försök Alpha Vantage
    if (ALPHA_VANTAGE_API_KEY) {
      try {
        const params = {
          function: 'TIME_SERIES_DAILY_ADJUSTED',
          symbol: ticker,
          outputsize: 'compact',
          apikey: ALPHA_VANTAGE_API_KEY
        };
        const avResponse = await axios.get(AV_BASE_URL, { params });
        const timeSeries = avResponse.data['Time Series (Daily)'];

        if (timeSeries) {
          data = Object.entries(timeSeries)
            .map(([date, values]) => ({
              date: date,
              price: parseFloat(values['5. adjusted close']),
              volume: parseInt(values['6. volume'])
            }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        } else {
          console.log(`[Server] Ingen historik från Alpha Vantage för ${ticker}`);
        }
      } catch (avError) {
         console.error(`[Server] Fel vid hämtning av historik från Alpha Vantage för ${ticker}:`, avError.message);
      }
    }

    // 2. Om Alpha Vantage misslyckades, försök Yahoo Finance
    if (data.length === 0) {
      source = 'Yahoo Finance';
      try {
        const yahooResult = await yahooFinance.historical(ticker, { period1: '3mo', interval: '1d' });
        if (yahooResult && yahooResult.length > 0) {
          data = yahooResult.map(day => ({
            date: day.date.toISOString().split('T')[0],
            price: day.close,
            volume: day.volume
          })).sort((a, b) => new Date(a.date) - new Date(b.date));
        } else {
           console.log(`[Server] Ingen historik från Yahoo Finance för ${ticker}`);
        }
      } catch (yahooError) {
        console.error(`[Server] Fel vid hämtning av historik från Yahoo Finance för ${ticker}:`, yahooError.message);
      }
    }

    // Skicka svar
    if (data.length > 0) {
       console.log(`[Server] Skickar historik för ${ticker} från ${source}`);
       res.json(data);
    } else {
      console.warn(`[Server] Kunde inte hämta historik för ${ticker} från någon källa.`);
      res.status(404).json({ error: 'Kunde inte hitta historik för den angivna tickern.' });
    }

  } catch (error) {
    console.error(`[Server] Allmänt fel för historik ${ticker}:`, error);
    res.status(500).json({ error: 'Internt serverfel vid hämtning av historik.' });
  }
});

// Endpoint för Overview (endast Alpha Vantage)
app.get('/api/overview/:ticker', async (req, res) => {
  const ticker = req.params.ticker;
   console.log(`[Server] Mottog begäran för overview: ${ticker}`);

  if (!ALPHA_VANTAGE_API_KEY) {
    return res.status(500).json({ error: 'Alpha Vantage API-nyckel saknas på servern.' });
  }

  try {
     const params = {
        function: 'OVERVIEW',
        symbol: ticker,
        apikey: ALPHA_VANTAGE_API_KEY
      };
      const response = await axios.get(AV_BASE_URL, { params });
      const overviewData = response.data;

      if (overviewData && overviewData.Symbol) {
        // Behåll den simulerade utökade informationen tills vidare?
        // Eller hämta den från en annan källa om möjligt.
        const extendedInfo = { /* ... (samma som i apiService.js tidigare) ... */ }; 
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
           // Lägg till simulerad data igen
           insiderTransactions: extendedInfo.insiderTransactions || [],
           majorShareholders: extendedInfo.majorShareholders || [],
           dividendHistory: extendedInfo.dividendHistory || []
         };
         console.log(`[Server] Skickar overview för ${ticker}`);
         res.json(formattedData);
      } else {
        console.warn(`[Server] Ingen overview hittades för ${ticker}`, response.data);
        res.status(404).json({ error: 'Ingen företagsinformation hittades.' });
      }
  } catch (error) {
    console.error(`[Server] Fel vid hämtning av overview för ${ticker}:`, error.message);
    res.status(500).json({ error: 'Internt serverfel vid hämtning av företagsinformation.' });
  }
});

// Endpoint för Nyheter (endast NewsAPI)
app.get('/api/news', async (req, res) => {
  const query = req.query.q; // Hämta sökfrågan från query params
  console.log(`[Server] Mottog begäran för nyheter: ${query}`);

  if (!query) {
    return res.status(400).json({ error: 'Sökfråga (q) saknas.' });
  }
  if (!NEWS_API_KEY) {
    return res.status(500).json({ error: 'NewsAPI-nyckel saknas på servern.' });
  }

  try {
    const params = {
        q: query,
        language: 'sv',
        sortBy: 'publishedAt',
        pageSize: 20, // Behåll paginering?
        apiKey: NEWS_API_KEY
      };
    const response = await axios.get(NEWS_API_BASE_URL, { params });

     if (response.data && response.data.articles) {
      const articles = response.data.articles.map(article => ({
        id: article.url + article.publishedAt,
        title: article.title,
        summary: article.description,
        url: article.url,
        source: article.source.name,
        date: article.publishedAt,
        sentiment: 'neutral' // Behöver vi sentimentanalys?
      }));
       console.log(`[Server] Skickar ${articles.length} nyheter för ${query}`);
       res.json(articles);
    } else {
      console.warn(`[Server] Inga nyheter hittades för ${query}`, response.data);
      res.json([]); // Skicka tom array om inga artiklar hittas
    }

  } catch (error) {
     console.error(`[Server] Fel vid hämtning av nyheter för ${query}:`, error.message);
     res.status(500).json({ error: 'Internt serverfel vid hämtning av nyheter.' });
  }
});

// Endpoint för valutakurser
app.get('/api/currency/:fromCurrency/:toCurrency', async (req, res) => {
  const { fromCurrency, toCurrency } = req.params;
  console.log(`[Server] Mottog begäran för valutakurs: ${fromCurrency}/${toCurrency}`);

  if (!ALPHA_VANTAGE_API_KEY) {
    return res.status(500).json({ error: 'Alpha Vantage API-nyckel saknas på servern.' });
  }

  try {
    // Hämta realtime valutakurs
    const params = {
      function: 'CURRENCY_EXCHANGE_RATE',
      from_currency: fromCurrency,
      to_currency: toCurrency,
      apikey: ALPHA_VANTAGE_API_KEY
    };
    
    const response = await axios.get(AV_BASE_URL, { params });
    
    const exchangeRateData = response.data['Realtime Currency Exchange Rate'];
    
    if (!exchangeRateData || !exchangeRateData['5. Exchange Rate']) {
      console.warn(`[Server] Ingen valutakursdata hittades för ${fromCurrency}/${toCurrency}`);
      return res.status(404).json({ error: 'Kunde inte hämta valutakursdata.' });
    }
    
    // För historisk data/procentuell förändring (enkel simulering om Alpha Vantage inte har FX_DAILY data)
    // Detta ger en simulerad förändring om vi inte har tillgång till historiska data
    const rate = parseFloat(exchangeRateData['5. Exchange Rate']);
    const changePercent = (Math.random() * 2 - 1) * 0.5; // -0.5% till +0.5% 
    const change = rate * (changePercent / 100);
    
    // Formatera och returnera data
    const currencyData = {
      rate,
      change,
      changePercent,
      lastUpdate: new Date().toISOString()
    };
    
    console.log(`[Server] Skickar valutakurs för ${fromCurrency}/${toCurrency}: ${rate}`);
    res.json(currencyData);
    
  } catch (error) {
    console.error(`[Server] Fel vid hämtning av valutakurs för ${fromCurrency}/${toCurrency}:`, error.message);
    res.status(500).json({ error: 'Internt serverfel vid hämtning av valutakursdata.' });
  }
});

// Endpoint för top movers (vinnare & förlorare)
app.post('/api/topmovers', async (req, res) => {
  console.log(`[Server] Mottog begäran för top movers`);
  
  if (!req.body || !req.body.stocks || !Array.isArray(req.body.stocks)) {
    return res.status(400).json({ error: 'Ingen giltig stockList skickades.' });
  }
  
  const stockList = req.body.stocks;
  
  if (stockList.length === 0) {
    return res.status(400).json({ error: 'Aktielistan är tom.' });
  }
  
  try {
    // Simulerad data skapad från stockList - i en produktionsmiljö skulle vi hämta faktiska data
    // från Alpha Vantage eller Yahoo Finance för varje aktie och sortera baserat på daglig förändring
    
    const stocksWithSimulatedChanges = stockList.map(stock => {
      const tickerObj = typeof stock === 'object' ? stock : { ticker: stock };
      const ticker = tickerObj.ticker;
      const name = tickerObj.name || ticker;
      
      // Slumpa fram en simulerad pris och ändring för demo-ändamål
      // I verkligheten skulle dessa värden komma från API:et
      const changePercent = (Math.random() * 10) - 5; // -5% till +5%
      const price = 100 + (Math.random() * 900); // 100 till 1000
      const change = price * (changePercent / 100);
      
      return {
        ticker,
        name,
        price,
        change,
        changePercent
      };
    });
    
    // Sortera i vinnare och förlorare
    const gainers = stocksWithSimulatedChanges
      .filter(stock => stock.changePercent > 0)
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 5);
      
    const losers = stocksWithSimulatedChanges
      .filter(stock => stock.changePercent < 0)
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, 5);
    
    console.log(`[Server] Skickar top movers: ${gainers.length} vinnare, ${losers.length} förlorare`);
    res.json({
      gainers,
      losers
    });
    
  } catch (error) {
    console.error('[Server] Fel vid beräkning av top movers:', error.message);
    res.status(500).json({ error: 'Internt serverfel vid beräkning av top movers.' });
  }
});

// --- Starta Servern --- 
app.listen(PORT, () => {
  console.log(`[Server] Backend-proxy körs på http://localhost:${PORT}`);
}); 