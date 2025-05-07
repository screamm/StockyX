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
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const FMP_API_KEY = process.env.FMP_API_KEY; // Nyckel för FMP
const MARKETSTACK_API_KEY = process.env.MARKETSTACK_API_KEY; // Nyckel för Marketstack
const TWELVEDATA_API_KEY = process.env.TWELVEDATA_API_KEY; // Nyckel för Twelve Data
const FRED_API_KEY = process.env.FRED_API_KEY; // Nyckel för FRED
const EODHD_API_KEY = process.env.EODHD_API_KEY; // Nyckel för EODHD
const AV_BASE_URL = 'https://www.alphavantage.co/query';
const NEWS_API_BASE_URL = 'https://newsapi.org/v2/everything';
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3'; // Bas-URL för FMP
const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3'; // Bas-URL för CoinGecko
const MARKETSTACK_BASE_URL = 'http://api.marketstack.com/v1'; // HTTP för gratis tier
const TWELVEDATA_BASE_URL = 'https://api.twelvedata.com'; // Bas-URL för Twelve Data
const FRED_BASE_URL = 'https://api.stlouisfed.org/fred'; // Bas-URL för FRED
const EODHD_BASE_URL = 'https://eodhistoricaldata.com/api'; // Bas-URL för EODHD

// --- API Endpoints --- 

// Test-endpoint
app.get('/api/ping', (req, res) => {
  res.json({ message: 'pong' });
});

// Endpoint för att hämta quote (AV -> Yahoo -> Finnhub -> Twelve Data)
app.get('/api/quote/:ticker', async (req, res) => {
  const ticker = req.params.ticker;
  console.log(`[Server] Mottog begäran för quote: ${ticker}`);
  try {
    let data = null;
    let source = '';

    // 1. Försök Alpha Vantage
    if (ALPHA_VANTAGE_API_KEY) {
      source = 'Alpha Vantage';
      try {
        const params = {
          function: 'GLOBAL_QUOTE',
          symbol: ticker,
          apikey: ALPHA_VANTAGE_API_KEY
        };
        const avResponse = await axios.get(AV_BASE_URL, { params });
        const quoteData = avResponse.data['Global Quote'];

        if (quoteData && Object.keys(quoteData).length > 0 && quoteData['05. price']) {
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
            source: source
          };
        } else {
           console.log(`[Server] Ingen giltig data från Alpha Vantage för ${ticker}`);
        }
      } catch (avError) {
        console.error(`[Server/AV] Fel quote ${ticker}:`, avError.message);
      }
    }

    // 2. Om Alpha Vantage misslyckades, försök Yahoo Finance
    if (!data) {
      source = 'Yahoo Finance';
      try {
        const yahooQuote = await yahooFinance.quote(ticker);
        if (yahooQuote && yahooQuote.regularMarketPrice !== undefined) {
           data = {
            price: yahooQuote.regularMarketPrice,
            change: yahooQuote.regularMarketChange,
            changePercent: yahooQuote.regularMarketChangePercent,
            volume: yahooQuote.regularMarketVolume,
            prevClose: yahooQuote.regularMarketPreviousClose,
            lastTradingDay: new Date(yahooQuote.regularMarketTime * 1000).toISOString().split('T')[0],
            open: yahooQuote.regularMarketOpen,
            dayHigh: yahooQuote.regularMarketDayHigh,
            dayLow: yahooQuote.regularMarketDayLow,
            source: source
          };
        } else {
          console.log(`[Server] Ingen giltig data från Yahoo Finance för ${ticker}`);
        }
      } catch (yahooError) {
        console.error(`[Server/Yahoo] Fel quote ${ticker}:`, yahooError.message);
      }
    }

    // 3. Om Yahoo Finance misslyckades, försök Finnhub
    if (!data && FINNHUB_API_KEY) {
      source = 'Finnhub';
      try {
        const finnhubResponse = await axios.get(`${FINNHUB_BASE_URL}/quote`, {
          params: {
            symbol: ticker,
            token: FINNHUB_API_KEY
          }
        });
        const quoteData = finnhubResponse.data;
        if (quoteData && quoteData.c !== undefined) { // c är current price
          data = {
            price: parseFloat(quoteData.c),
            change: parseFloat(quoteData.d), // d är change
            changePercent: parseFloat(quoteData.dp), // dp är percent change
            volume: parseInt(quoteData.v) || (await yahooFinance.quote(ticker))?.regularMarketVolume || 0, // Finnhub har inte alltid volym på quote, fallback till Yahoo.
            prevClose: parseFloat(quoteData.pc), // pc är previous close
            lastTradingDay: new Date(quoteData.t * 1000).toISOString().split('T')[0], // t är timestamp
            open: parseFloat(quoteData.o), // o är open
            dayHigh: parseFloat(quoteData.h), // h är high
            dayLow: parseFloat(quoteData.l), // l är low
            source: source
          };
        } else {
          console.log(`[Server] Ingen giltig data från Finnhub för ${ticker}`);
        }
      } catch (finnhubError) {
        console.error(`[Server/Finnhub] Fel quote ${ticker}:`, finnhubError.message);
      }
    }
    
    // 4. Twelve Data (Time Series för aktuell data)
    if (!data && TWELVEDATA_API_KEY) {
        source = 'Twelve Data';
        console.log(`[Server/TwelveData] Försöker Twelve Data för quote: ${ticker}`);
        try {
            const response = await axios.get(`${TWELVEDATA_BASE_URL}/quote`, {
                params: {
                    symbol: ticker,
                    apikey: TWELVEDATA_API_KEY,
                    dp: 2 // Antal decimaler
                }
            });
            const tdQuote = response.data;
            if (tdQuote && tdQuote.close !== undefined) {
                data = {
                    price: parseFloat(tdQuote.close),
                    change: parseFloat(tdQuote.change),
                    changePercent: parseFloat(tdQuote.percent_change),
                    volume: parseInt(tdQuote.volume) || (await yahooFinance.quote(ticker))?.regularMarketVolume || 0, // Fallback för volym
                    prevClose: parseFloat(tdQuote.previous_close),
                    lastTradingDay: tdQuote.datetime ? new Date(tdQuote.datetime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    open: parseFloat(tdQuote.open),
                    dayHigh: parseFloat(tdQuote.high),
                    dayLow: parseFloat(tdQuote.low),
                    source: source
                };
                 console.log(`[Server/TwelveData] Hittade quote från Twelve Data för ${ticker}`);
            } else {
                console.log(`[Server/TwelveData] Ingen giltig quote från Twelve Data för ${ticker}`, tdQuote);
            }
        } catch (twelveDataError) {
            console.error(`[Server/TwelveData] Fel vid hämtning av quote från Twelve Data för ${ticker}:`, 
                          twelveDataError.response ? twelveDataError.response.data : twelveDataError.message);
        }
    }

    // Skicka svar
    if (data) {
      console.log(`[Server] Skickar data för ${ticker} från ${data.source}`);
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

// Endpoint för historik (AV -> Yahoo -> Finnhub -> Marketstack -> Twelve Data)
app.get('/api/history/:ticker', async (req, res) => {
  const ticker = req.params.ticker;
  const { period = '3mo', interval = '1d' } = req.query;
  console.log(`[Server] Mottog begäran för historik: ${ticker} (Period: ${period}, Intervall: ${interval})`);
  try {
    let data = [];
    let source = '';

    // 1. Försök Alpha Vantage (TIME_SERIES_DAILY_ADJUSTED)
    if (ALPHA_VANTAGE_API_KEY && interval === '1d') {
      source = 'Alpha Vantage';
      try {
        const params = {
          function: 'TIME_SERIES_DAILY_ADJUSTED',
          symbol: ticker,
          outputsize: period === '1y' || period === 'max' ? 'full' : 'compact', // 'compact' för ~100 dagar
          apikey: ALPHA_VANTAGE_API_KEY
        };
        const avResponse = await axios.get(AV_BASE_URL, { params });
        const timeSeries = avResponse.data['Time Series (Daily)'];

        if (timeSeries) {
          data = Object.entries(timeSeries)
            .map(([date, values]) => ({
              date: date,
              price: parseFloat(values['5. adjusted close']),
              volume: parseInt(values['6. volume']),
              source: source
            }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        } else {
          console.log(`[Server/AV] Ingen historik från Alpha Vantage för ${ticker}`);
        }
      } catch (avError) {
         console.error(`[Server/AV] Fel vid hämtning av historik från Alpha Vantage för ${ticker}:`, avError.message);
      }
    }

    // 2. Om Alpha Vantage misslyckades eller inte passade, försök Yahoo Finance
    if (data.length === 0) {
      source = 'Yahoo Finance';
      try {
        const yahooPeriod1 = period === '3mo' ? '3mo' : period === '1y' ? '1y' : period === 'max' ? 'max' : '3mo'; // Anpassa för Yahoo
        const yahooResult = await yahooFinance.historical(ticker, { period1: yahooPeriod1, interval: interval });
        if (yahooResult && yahooResult.length > 0) {
          data = yahooResult.map(day => ({
            date: day.date.toISOString().split('T')[0],
            price: day.close,
            volume: day.volume,
            source: source
          })).sort((a, b) => new Date(a.date) - new Date(b.date));
        } else {
           console.log(`[Server/Yahoo] Ingen historik från Yahoo Finance för ${ticker}`);
        }
      } catch (yahooError) {
        console.error(`[Server/Yahoo] Fel vid hämtning av historik från Yahoo Finance för ${ticker}:`, yahooError.message);
      }
    }

    // 3. Om Yahoo misslyckades, försök Finnhub (stock candles)
    if (data.length === 0 && FINNHUB_API_KEY) {
        source = 'Finnhub';
        try {
            const resolutionMap = { '1d': 'D', '1wk': 'W', '1mo': 'M' };
            const finnhubResolution = resolutionMap[interval] || 'D';
            
            let fromTimestamp, toTimestamp = Math.floor(Date.now() / 1000);
            const now = new Date();
            if (period === '3mo') fromTimestamp = Math.floor(new Date(now.setMonth(now.getMonth() - 3)) / 1000);
            else if (period === '1y') fromTimestamp = Math.floor(new Date(now.setFullYear(now.getFullYear() - 1)) / 1000);
            else if (period === 'max') fromTimestamp = 0; // Eller ett mycket tidigt datum
            else fromTimestamp = Math.floor(new Date(now.setMonth(now.getMonth() - 3)) / 1000); // Default till 3 månader

            const finnhubResponse = await axios.get(`${FINNHUB_BASE_URL}/stock/candle`, {
                params: {
                    symbol: ticker,
                    resolution: finnhubResolution,
                    from: fromTimestamp,
                    to: toTimestamp,
                    token: FINNHUB_API_KEY
                }
            });

            const candles = finnhubResponse.data;
            if (candles && candles.s === 'ok' && candles.c && candles.c.length > 0) {
                data = candles.t.map((ts, index) => ({
                    date: new Date(ts * 1000).toISOString().split('T')[0],
                    price: parseFloat(candles.c[index]),
                    volume: parseInt(candles.v[index]),
                    source: source
                })).sort((a, b) => new Date(a.date) - new Date(b.date));
            } else {
                console.log(`[Server/Finnhub] Ingen historik från Finnhub för ${ticker}`, candles?.s);
            }
        } catch (finnhubError) {
            console.error(`[Server/Finnhub] Fel vid hämtning av historik från Finnhub för ${ticker}:`, finnhubError.message);
        }
    }

    // 4. Om Finnhub misslyckades, försök Marketstack (EOD data)
    if (data.length === 0 && MARKETSTACK_API_KEY && interval === '1d') { // Marketstack gratis ger EOD (daily)
        source = 'Marketstack';
        console.log(`[Server/Marketstack] Försöker Marketstack för historik: ${ticker}`);
        try {
            let date_from;
            const to = new Date().toISOString().split('T')[0];
            const now = new Date();
            if (period === '3mo') date_from = new Date(now.setMonth(now.getMonth() - 3)).toISOString().split('T')[0];
            else if (period === '1y') date_from = new Date(now.setFullYear(now.getFullYear() - 1)).toISOString().split('T')[0];
            // Marketstack gratis har ofta begränsad historik, så 'max' kanske inte är meningsfullt utan betalplan
            // else if (period === 'max') date_from = undefined; // Eller ett mycket tidigt datum om API:et stöder det
            else date_from = new Date(now.setMonth(now.getMonth() - 3)).toISOString().split('T')[0]; // Default 3 månader

            const params = {
                access_key: MARKETSTACK_API_KEY,
                symbols: ticker,
                interval: '24hour', // För EOD data (daglig)
                sort: 'ASC', // Äldst först så vi kan sortera lättare omvänt sen
                limit: 365, // Gratisplanen kan ha begränsningar, men vi begär upp till ett år.
            };
            if (date_from) params.date_from = date_from;
            // if (to) params.date_to = to; // Kan läggas till om man vill ha specifik slutdatum

            const marketstackResponse = await axios.get(`${MARKETSTACK_BASE_URL}/eod`, { params });

            if (marketstackResponse.data && marketstackResponse.data.data && marketstackResponse.data.data.length > 0) {
                data = marketstackResponse.data.data.map(day => ({
                    date: day.date.split('T')[0],
                    price: parseFloat(day.adj_close !== null ? day.adj_close : day.close), // Föredra justerat stängningspris
                    volume: parseInt(day.volume),
                    source: source
                })).sort((a, b) => new Date(a.date) - new Date(b.date)); // Marketstack returnerar ASC, så det är redan rätt.
                 console.log(`[Server/Marketstack] Hittade ${data.length} datapunkter från Marketstack för ${ticker}`);
            } else {
                console.log(`[Server/Marketstack] Ingen historik från Marketstack för ${ticker}`, marketstackResponse.data);
            }
        } catch (marketstackError) {
            console.error(`[Server/Marketstack] Fel vid hämtning av historik från Marketstack för ${ticker}:`, 
                          marketstackError.response ? marketstackError.response.data : marketstackError.message);
        }
    }

    // 5. Twelve Data (Time Series)
    if (data.length === 0 && TWELVEDATA_API_KEY) {
        source = 'Twelve Data';
        console.log(`[Server/TwelveData] Försöker Twelve Data för historik: ${ticker}`);
        try {
            const intervalMap = { '1d': '1day', '1wk': '1week', '1mo': '1month' };
            const tdInterval = intervalMap[interval] || '1day';
            
            // Beräkna outputsize baserat på period
            let outputsize = 90; // Default 3 månader
            if (period === '1y') outputsize = 365;
            else if (period === 'max') outputsize = 5000; // Max för Twelve Data (kan behöva justeras)
            else if (period === '1mo') outputsize = 30;

            const response = await axios.get(`${TWELVEDATA_BASE_URL}/time_series`, {
                params: {
                    symbol: ticker,
                    interval: tdInterval,
                    apikey: TWELVEDATA_API_KEY,
                    outputsize: outputsize,
                    dp: 2 // Antal decimaler
                }
            });

            if (response.data && response.data.values && response.data.values.length > 0) {
                data = response.data.values.map(item => ({
                    date: item.datetime, // TwelveData ger redan datum i YYYY-MM-DD format
                    price: parseFloat(item.close),
                    volume: parseInt(item.volume),
                    source: source
                })).sort((a, b) => new Date(a.date) - new Date(b.date)); // Sortera om det behövs (ofta redan sorterat)
                console.log(`[Server/TwelveData] Hittade ${data.length} datapunkter från Twelve Data för ${ticker}`);
            } else {
                console.log(`[Server/TwelveData] Ingen historik från Twelve Data för ${ticker}`, response.data.status, response.data.message);
            }
        } catch (twelveDataError) {
            console.error(`[Server/TwelveData] Fel vid hämtning av historik från Twelve Data för ${ticker}:`, 
                          twelveDataError.response ? twelveDataError.response.data : twelveDataError.message);
        }
    }

    // Skicka svar
    if (data.length > 0) {
       console.log(`[Server] Skickar historik för ${ticker} från ${data[0].source}`);
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

// Endpoint för Overview (Alpha Vantage, sedan Finnhub för profil om AV misslyckas)
app.get('/api/overview/:ticker', async (req, res) => {
  const ticker = req.params.ticker;
   console.log(`[Server] Mottog begäran för overview: ${ticker}`);

  let overviewData = null;
  let source = '';

  // 1. Försök Alpha Vantage
  if (ALPHA_VANTAGE_API_KEY) {
    source = 'Alpha Vantage';
    try {
       const params = {
          function: 'OVERVIEW',
          symbol: ticker,
          apikey: ALPHA_VANTAGE_API_KEY
        };
        const response = await axios.get(AV_BASE_URL, { params });
        const avData = response.data;

        if (avData && avData.Symbol) {
           overviewData = {
             name: avData.Name,
             description: avData.Description,
             sector: avData.Sector,
             industry: avData.Industry,
             marketCap: parseInt(avData.MarketCapitalization),
             peRatio: parseFloat(avData.PERatio),
             dividendYield: parseFloat(avData.DividendYield) * 100,
             fiftyTwoWeekHigh: parseFloat(avData['52WeekHigh']),
             fiftyTwoWeekLow: parseFloat(avData['52WeekLow']),
             // Placeholder för simulerad data - detta bör tas bort eller hämtas från annan källa
             insiderTransactions: [], 
             majorShareholders: [],
             dividendHistory: [],
             source: source
           };
        } else {
          console.warn(`[Server] Ingen overview från Alpha Vantage för ${ticker}`, avData);
        }
    } catch (error) {
      console.error(`[Server] Fel vid hämtning av overview från Alpha Vantage för ${ticker}:`, error.message);
    }
  }

  // 2. Om Alpha Vantage misslyckades eller inte gav fullständig info, försök Finnhub för grundläggande profil
  if (!overviewData && FINNHUB_API_KEY) {
      source = 'Finnhub';
      try {
          const profileResponse = await axios.get(`${FINNHUB_BASE_URL}/stock/profile2`, {
              params: { symbol: ticker, token: FINNHUB_API_KEY }
          });
          const finnhubProfile = profileResponse.data;

          if (finnhubProfile && finnhubProfile.name) {
              overviewData = { // Fyll i med det som Finnhub erbjuder
                  name: finnhubProfile.name,
                  description: finnhubProfile.description || 'Ingen beskrivning från Finnhub.',
                  sector: finnhubProfile.finnhubIndustry, // Finnhub kallar det 'finnhubIndustry'
                  industry: finnhubProfile.industry || 'N/A',
                  marketCap: parseInt(finnhubProfile.marketCapitalization * 1e6), // Ofta i miljoner USD
                  // Finnhub ger inte PE, DividendYield, 52w High/Low direkt i profile2
                  peRatio: null,
                  dividendYield: null,
                  fiftyTwoWeekHigh: null,
                  fiftyTwoWeekLow: null,
                  insiderTransactions: [],
                  majorShareholders: [],
                  dividendHistory: [],
                  source: source,
                  logo: finnhubProfile.logo,
                  weburl: finnhubProfile.weburl
              };
              console.log(`[Server] Använder grundläggande profil från Finnhub för ${ticker}`);
          } else {
              console.warn(`[Server] Ingen profil från Finnhub för ${ticker}`, finnhubProfile);
          }
      } catch (error) {
          console.error(`[Server] Fel vid hämtning av profil från Finnhub för ${ticker}:`, error.message);
      }
  }


  if (overviewData) {
       console.log(`[Server] Skickar overview för ${ticker} från ${overviewData.source}`);
       res.json(overviewData);
  } else {
      console.warn(`[Server] Ingen overview hittades för ${ticker} från någon källa.`);
      res.status(404).json({ error: 'Ingen företagsinformation hittades.' });
  }
});

// Endpoint för Nyheter (NewsAPI, sedan Finnhub för company news)
app.get('/api/news', async (req, res) => {
  const query = req.query.q; // Ticker eller företagsnamn
  console.log(`[Server] Mottog begäran för nyheter: ${query}`);

  if (!query) {
    return res.status(400).json({ error: 'Sökfråga (q) saknas.' });
  }

  let articles = [];
  let source = '';

  // 1. Försök NewsAPI (om API-nyckel finns)
  if (NEWS_API_KEY) {
    source = 'NewsAPI';
    try {
      const params = {
          q: query,
          language: 'sv,en', // Inkludera engelska för bättre täckning
          sortBy: 'relevancy,publishedAt',
          pageSize: 10, // Begränsa för att inte bli för mycket
          apiKey: NEWS_API_KEY
        };
      const response = await axios.get(NEWS_API_BASE_URL, { params });

       if (response.data && response.data.articles && response.data.articles.length > 0) {
        articles = response.data.articles.map(article => ({
          id: article.url + article.publishedAt,
          title: article.title,
          summary: article.description,
          url: article.url,
          source: article.source.name,
          date: article.publishedAt,
          sentiment: 'neutral',
          apiSource: source
        }));
         console.log(`[Server] Hittade ${articles.length} nyheter från NewsAPI för ${query}`);
      } else {
        console.warn(`[Server] Inga nyheter från NewsAPI för ${query}`, response.data);
      }
    } catch (error) {
       console.error(`[Server] Fel vid hämtning av nyheter från NewsAPI för ${query}:`, error.message);
    }
  }

  // 2. Om NewsAPI inte gav resultat eller ingen nyckel, försök Finnhub (company news)
  // Finnhub behöver en start- och slutdatum för nyheter. Vi tar senaste månaden som exempel.
  if (articles.length < 5 && FINNHUB_API_KEY) { // Om vi har få eller inga nyheter
    source = 'Finnhub';
    try {
        const today = new Date();
        const oneMonthAgo = new Date(new Date().setDate(today.getDate() - 30));
        const fromDate = oneMonthAgo.toISOString().split('T')[0];
        const toDate = today.toISOString().split('T')[0];

        const finnhubResponse = await axios.get(`${FINNHUB_BASE_URL}/company-news`, {
            params: {
                symbol: query, // Finnhub använder 'symbol' för ticker
                from: fromDate,
                to: toDate,
                token: FINNHUB_API_KEY
            }
        });
        
        if (finnhubResponse.data && Array.isArray(finnhubResponse.data) && finnhubResponse.data.length > 0) {
            const finnhubArticles = finnhubResponse.data.slice(0, 10 - articles.length).map(article => ({ // Ta max 10 totalt
                id: article.id || article.url, // Finnhub har 'id'
                title: article.headline,
                summary: article.summary,
                url: article.url,
                source: article.source,
                date: new Date(article.datetime * 1000).toISOString(), // datetime är i sekunder
                sentiment: 'neutral', // Finnhub ger sentiment, men vi håller det enkelt för nu
                apiSource: source
            }));
            articles = articles.concat(finnhubArticles); // Lägg till Finnhub-artiklar
            console.log(`[Server] Lade till ${finnhubArticles.length} nyheter från Finnhub för ${query}`);
        } else {
             console.warn(`[Server] Inga nyheter från Finnhub för ${query}`, finnhubResponse.data);
        }
    } catch (error) {
        console.error(`[Server] Fel vid hämtning av nyheter från Finnhub för ${query}:`, error.message);
    }
  }
  
  // Ta bort duplicerade artiklar baserat på URL (enkel metod)
  const uniqueArticles = Array.from(new Set(articles.map(a => a.url)))
    .map(url => {
      return articles.find(a => a.url === url)
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sortera med senaste först


  if (uniqueArticles.length > 0) {
     console.log(`[Server] Skickar totalt ${uniqueArticles.length} unika nyheter för ${query}.`);
     res.json(uniqueArticles);
  } else {
    console.warn(`[Server] Inga nyheter hittades för ${query} från någon källa.`);
    res.json([]); // Skicka tom array om inga artiklar hittas
  }
});


// Endpoint för valutakurser (Alpha Vantage, fallback till Twelve Data eller Finnhub om möjligt)
app.get('/api/currency/:fromCurrency/:toCurrency', async (req, res) => {
  const { fromCurrency, toCurrency } = req.params;
  console.log(`[Server] Mottog begäran för valutakurs: ${fromCurrency}/${toCurrency}`);

  let currencyData = null;
  let source = '';

  // 1. Försök Alpha Vantage
  if (ALPHA_VANTAGE_API_KEY) {
    source = 'Alpha Vantage';
    try {
      const params = {
        function: 'CURRENCY_EXCHANGE_RATE',
        from_currency: fromCurrency,
        to_currency: toCurrency,
        apikey: ALPHA_VANTAGE_API_KEY
      };
      const response = await axios.get(AV_BASE_URL, { params });
      const exchangeRateData = response.data['Realtime Currency Exchange Rate'];
      
      if (exchangeRateData && exchangeRateData['5. Exchange Rate']) {
        const rate = parseFloat(exchangeRateData['5. Exchange Rate']);
        // AV ger inte %-förändring direkt för valutor, simulera enkelt
        const changePercent = (Math.random() * 1 - 0.5).toFixed(4); // Liten slumpmässig förändring
        const change = rate * (parseFloat(changePercent) / 100);
        
        currencyData = {
          rate,
          change,
          changePercent: parseFloat(changePercent),
          lastUpdate: new Date(exchangeRateData['6. Last Refreshed']).toISOString() || new Date().toISOString(),
          source: source
        };
      } else {
         console.warn(`[Server] Ingen valutakursdata från Alpha Vantage för ${fromCurrency}/${toCurrency}`);
      }
    } catch (error) {
      console.error(`[Server] Fel vid hämtning av valutakurs från Alpha Vantage för ${fromCurrency}/${toCurrency}:`, error.message);
    }
  }
  
  // TODO: Lägg till fallback till Twelve Data eller Finnhub här om de har valutadata.
  // Exempel Finnhub (om de har forex symbols):
  // if (!currencyData && FINNHUB_API_KEY) {
  //   source = 'Finnhub';
  //   try {
  //     const finnhubSymbol = `OANDA:${fromCurrency}_${toCurrency}`; // Eller liknande format
  //     const finnhubResponse = await axios.get(`${FINNHUB_BASE_URL}/quote`, {
  //       params: { symbol: finnhubSymbol, token: FINNHUB_API_KEY }
  //     });
  //     const quoteData = finnhubResponse.data;
  //     if (quoteData && quoteData.c !== undefined) {
  //       currencyData = {
  //         rate: parseFloat(quoteData.c),
  //         change: parseFloat(quoteData.d),
  //         changePercent: parseFloat(quoteData.dp),
  //         lastUpdate: new Date(quoteData.t * 1000).toISOString(),
  //         source: source
  //       };
  //     }
  //   } catch (err) { console.error(`Finnhub currency error: ${err.message}`); }
  // }


  if (currencyData) {
    console.log(`[Server] Skickar valutakurs för ${fromCurrency}/${toCurrency} från ${currencyData.source}: ${currencyData.rate}`);
    res.json(currencyData);
  } else {
    console.warn(`[Server] Ingen valutakursdata hittades för ${fromCurrency}/${toCurrency} från någon källa.`);
    return res.status(404).json({ error: 'Kunde inte hämta valutakursdata.' });
  }
});

// Endpoint för top movers (vinnare & förlorare)
// Denna endpoint är mer komplex att göra API-agnostisk och realtids,
// då den kräver att vi hämtar kurser för MÅNGA aktier samtidigt.
// För nu behåller vi den simulerade logiken.
// En bättre lösning vore att t.ex. använda Finnhubs "Stock Market Losers/Gainers" endpoint om den finns tillgänglig.
app.post('/api/topmovers', async (req, res) => {
  console.log(`[Server] Mottog begäran för top movers`);
  
  if (!req.body || !req.body.stocks || !Array.isArray(req.body.stocks)) {
    return res.status(400).json({ error: 'Ingen giltig stockList skickades.' });
  }
  
  const stockListInput = req.body.stocks; // Kan vara strängar eller objekt { ticker, name }
  
  if (stockListInput.length === 0) {
    return res.status(400).json({ error: 'Aktielistan är tom.' });
  }
  
  try {
    // Hämta aktuell kursdata för alla aktier i listan
    const quotePromises = stockListInput.map(stockOrTicker => {
        const ticker = typeof stockOrTicker === 'string' ? stockOrTicker : stockOrTicker.ticker;
        // Intern anrop till vår egen /api/quote endpoint för att dra nytta av fallback-logiken
        return axios.get(`http://localhost:${PORT}/api/quote/${ticker}`)
            .then(response => ({ ...response.data, ticker: ticker, name: typeof stockOrTicker === 'string' ? ticker : stockOrTicker.name }))
            .catch(error => {
                console.warn(`[TopMovers] Kunde inte hämta quote för ${ticker}: ${error.message}`);
                return null; // Returnera null om en aktie misslyckas
            });
    });

    const stockQuotes = (await Promise.all(quotePromises)).filter(q => q !== null && q.changePercent !== undefined);

    if (stockQuotes.length === 0) {
        console.warn('[TopMovers] Kunde inte hämta någon kursdata för aktierna i listan.');
        return res.json({ gainers: [], losers: [] });
    }
    
    const gainers = stockQuotes
      .filter(stock => stock.changePercent > 0)
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 5); // Ta de 5 bästa vinnarna
      
    const losers = stockQuotes
      .filter(stock => stock.changePercent < 0)
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, 5); // Ta de 5 största förlorarna
    
    console.log(`[Server] Skickar top movers: ${gainers.length} vinnare, ${losers.length} förlorare, baserat på data från ${stockQuotes[0]?.source || 'okänd källa'}.`);
    res.json({
      gainers,
      losers
    });
    
  } catch (error) {
    console.error('[Server] Fel vid beräkning av top movers:', error.message);
    res.status(500).json({ error: 'Internt serverfel vid beräkning av top movers.' });
  }
});

// --- FMP Endpoints ---

// FMP - Företagsprofil (kan innehålla mer detaljer än AV/Finnhub ibland)
app.get('/api/fmp/profile/:ticker', async (req, res) => {
  const ticker = req.params.ticker;
  console.log(`[Server/FMP] Mottog begäran för FMP-profil: ${ticker}`);

  if (!FMP_API_KEY) {
    console.warn('[Server/FMP] FMP_API_KEY saknas.');
    // Vissa FMP-endpoints kan fungera utan nyckel på gratisnivån, men det är bra att ha den.
    // return res.status(503).json({ error: 'FMP API-nyckel saknas på servern.' });
  }

  try {
    const response = await axios.get(`${FMP_BASE_URL}/profile/${ticker}`, {
      params: { apikey: FMP_API_KEY }
    });

    if (response.data && response.data.length > 0) {
      // FMP returnerar en array även för en enskild ticker
      console.log(`[Server/FMP] Skickar FMP-profil för ${ticker}`);
      res.json(response.data[0]); 
    } else {
      console.warn(`[Server/FMP] Ingen profildata från FMP för ${ticker}`, response.data);
      res.status(404).json({ error: 'Ingen FMP-profildata hittades.' });
    }
  } catch (error) {
    console.error(`[Server/FMP] Fel vid hämtning av FMP-profil för ${ticker}:`, error.response ? error.response.data : error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Internt serverfel vid hämtning av FMP-profil.',
      details: error.response?.data?.['Error Message'] || error.message
    });
  }
});

// FMP - Nyckeltal (ratios)
app.get('/api/fmp/ratios/:ticker', async (req, res) => {
  const ticker = req.params.ticker;
  console.log(`[Server/FMP] Mottog begäran för FMP nyckeltal: ${ticker}`);

  if (!FMP_API_KEY) {
    console.warn('[Server/FMP] FMP_API_KEY saknas för nyckeltal.');
    // return res.status(503).json({ error: 'FMP API-nyckel saknas på servern för nyckeltal.' });
  }
  
  try {
    // 'ttm' för Trailing Twelve Months, kan även vara 'annual' eller 'quarter'
    const response = await axios.get(`${FMP_BASE_URL}/ratios-ttm/${ticker}`, {
      params: { apikey: FMP_API_KEY } 
    });

    if (response.data && response.data.length > 0) {
      console.log(`[Server/FMP] Skickar FMP nyckeltal (TTM) för ${ticker}`);
      res.json(response.data[0]); // Ofta en array med ett objekt
    } else {
      console.warn(`[Server/FMP] Ingen nyckeltalsdata (TTM) från FMP för ${ticker}`, response.data);
      // Försök hämta årliga om TTM misslyckas?
      try {
        const annualResponse = await axios.get(`${FMP_BASE_URL}/ratios/${ticker}`, {
          params: { period: 'annual', limit: 1, apikey: FMP_API_KEY } // Hämta senaste årliga
        });
        if (annualResponse.data && annualResponse.data.length > 0) {
          console.log(`[Server/FMP] Skickar FMP nyckeltal (Annual) för ${ticker}`);
          res.json(annualResponse.data[0]);
        } else {
          console.warn(`[Server/FMP] Ingen nyckeltalsdata (Annual) från FMP för ${ticker}`, annualResponse.data);
          res.status(404).json({ error: 'Ingen FMP nyckeltalsdata hittades (vare sig TTM eller Annual).' });
        }
      } catch (annualError) {
        console.error(`[Server/FMP] Fel vid hämtning av årliga FMP-nyckeltal för ${ticker}:`, annualError.message);
        res.status(404).json({ error: 'Ingen FMP nyckeltalsdata hittades.' });
      }
    }
  } catch (error) {
    console.error(`[Server/FMP] Fel vid hämtning av FMP nyckeltal (TTM) för ${ticker}:`, error.response ? error.response.data : error.message);
     res.status(error.response?.status || 500).json({ 
      error: 'Internt serverfel vid hämtning av FMP nyckeltal.',
      details: error.response?.data?.['Error Message'] || error.message
    });
  }
});

// FMP - Finansiella rapporter (Income Statement, Balance Sheet, Cash Flow)
// period kan vara 'annual' eller 'quarter'
// limit specificerar antalet perioder att hämta (t.ex. 5 för senaste 5 åren/kvartalen)
const fetchFmpFinancialStatement = async (ticker, statementType, period = 'annual', limit = 5, apiKey) => {
  console.log(`[Server/FMP] Hämtar ${statementType} för ${ticker} (Period: ${period}, Limit: ${limit})`);
  if (!apiKey) console.warn(`[Server/FMP] FMP_API_KEY saknas för ${statementType}.`);

  try {
    const response = await axios.get(`${FMP_BASE_URL}/${statementType}/${ticker}`, {
      params: { 
        period: period, 
        limit: limit, 
        apikey: apiKey 
      }
    });
    if (response.data && response.data.length > 0) {
      return response.data;
    } else {
      console.warn(`[Server/FMP] Ingen data för ${statementType} (${period}, ${limit}) från FMP för ${ticker}`, response.data);
      return [];
    }
  } catch (error) {
    console.error(`[Server/FMP] Fel vid hämtning av ${statementType} för ${ticker}:`, error.response ? error.response.data : error.message);
    throw error; // Kasta vidare så att anropande funktion kan hantera det
  }
};

app.get('/api/fmp/income-statement/:ticker', async (req, res) => {
  const { ticker } = req.params;
  const { period = 'annual', limit = 5 } = req.query;
  try {
    const data = await fetchFmpFinancialStatement(ticker, 'income-statement', period, parseInt(limit), FMP_API_KEY);
    console.log(`[Server/FMP] Skickar income statement för ${ticker}`);
    res.json(data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ 
      error: 'Internt serverfel vid hämtning av FMP income statement.',
      details: error.response?.data?.['Error Message'] || error.message
    });
  }
});

app.get('/api/fmp/balance-sheet/:ticker', async (req, res) => {
  const { ticker } = req.params;
  const { period = 'annual', limit = 5 } = req.query;
  try {
    const data = await fetchFmpFinancialStatement(ticker, 'balance-sheet-statement', period, parseInt(limit), FMP_API_KEY);
    console.log(`[Server/FMP] Skickar balance sheet för ${ticker}`);
    res.json(data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ 
      error: 'Internt serverfel vid hämtning av FMP balance sheet.',
      details: error.response?.data?.['Error Message'] || error.message
    });
  }
});

app.get('/api/fmp/cash-flow/:ticker', async (req, res) => {
  const { ticker } = req.params;
  const { period = 'annual', limit = 5 } = req.query;
  try {
    const data = await fetchFmpFinancialStatement(ticker, 'cash-flow-statement', period, parseInt(limit), FMP_API_KEY);
    console.log(`[Server/FMP] Skickar cash flow statement för ${ticker}`);
    res.json(data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ 
      error: 'Internt serverfel vid hämtning av FMP cash flow statement.',
      details: error.response?.data?.['Error Message'] || error.message
    });
  }
});

// --- CoinGecko Endpoints ---

// CoinGecko - Ping (för att testa anslutning)
app.get('/api/coingecko/ping', async (req, res) => {
  console.log('[Server/CoinGecko] Mottog ping-begäran till CoinGecko');
  try {
    const response = await axios.get(`${COINGECKO_BASE_URL}/ping`);
    console.log('[Server/CoinGecko] Ping lyckades, svar:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('[Server/CoinGecko] Fel vid ping till CoinGecko:', error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Kunde inte ansluta till CoinGecko API.',
      details: error.message
    });
  }
});

// CoinGecko - Hämta lista över kryptovalutor (t.ex. topp 100 efter marknadsvärde)
app.get('/api/coingecko/coins/markets', async (req, res) => {
  const { vs_currency = 'usd', per_page = 100, page = 1, order = 'market_cap_desc' } = req.query;
  console.log(`[Server/CoinGecko] Hämtar kryptomarknader (vs: ${vs_currency}, per_page: ${per_page}, page: ${page})`);

  try {
    const response = await axios.get(`${COINGECKO_BASE_URL}/coins/markets`, {
      params: {
        vs_currency,    // Valuta att jämföra mot (usd, eur, sek etc.)
        order,          // Sortering (market_cap_desc, gecko_desc, volume_desc etc.)
        per_page,       // Antal resultat per sida
        page,           // Aktuell sida
        sparkline: false, // Inkludera inte 7-dagars sparkline data för listvyn
        price_change_percentage: '1h,24h,7d' // Hämta prisändringar för 1h, 24h, 7d
      }
    });
    console.log(`[Server/CoinGecko] Skickar ${response.data.length} kryptovalutor.`);
    res.json(response.data);
  } catch (error) {
    console.error('[Server/CoinGecko] Fel vid hämtning av kryptomarknader:', error.response ? error.response.data : error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Kunde inte hämta kryptomarknadsdata.',
      details: error.message
    });
  }
});

// CoinGecko - Hämta detaljerad information för en specifik kryptovaluta
app.get('/api/coingecko/coins/:id', async (req, res) => {
  const coinId = req.params.id; // Detta är CoinGeckos ID för valutan (t.ex. 'bitcoin', 'ethereum')
  console.log(`[Server/CoinGecko] Hämtar detaljer för krypto: ${coinId}`);

  try {
    const response = await axios.get(`${COINGECKO_BASE_URL}/coins/${coinId}`, {
      params: {
        localization: 'false', // Inkludera inte lokaliserad data
        tickers: true,        // Inkludera tickerdata
        market_data: true,    // Inkludera marknadsdata (pris, volym etc.)
        community_data: false, // Inkludera inte community-data
        developer_data: false, // Inkludera inte utvecklar-data
        sparkline: true       // Inkludera 7-dagars sparkline
      }
    });
    console.log(`[Server/CoinGecko] Skickar detaljer för ${coinId}`);
    res.json(response.data);
  } catch (error) {
    console.error(`[Server/CoinGecko] Fel vid hämtning av kryptodetaljer för ${coinId}:`, error.response ? error.response.data : error.message);
     res.status(error.response?.status || 500).json({ 
      error: `Kunde inte hämta detaljer för kryptovaluta ${coinId}.`,
      details: error.message
    });
  }
});

// CoinGecko - Hämta historisk marknadsdata (OHLC, volym) för en specifik kryptovaluta
app.get('/api/coingecko/coins/:id/market_chart', async (req, res) => {
  const coinId = req.params.id;
  // vs_currency är valutan att jämföra mot, days är antalet dagar (1, 7, 14, 30, 90, 180, 365, max)
  const { vs_currency = 'usd', days = '30', interval = 'daily' } = req.query; 
  console.log(`[Server/CoinGecko] Hämtar historisk data för ${coinId} (vs: ${vs_currency}, days: ${days}, interval: ${interval})`);

  try {
    const response = await axios.get(`${COINGECKO_BASE_URL}/coins/${coinId}/market_chart`, {
      params: {
        vs_currency,
        days,
        interval // 'daily' eller utelämna för automatisk granularitet baserat på 'days'
      }
    });
    // Svaret innehåller listor: prices, market_caps, total_volumes
    // Varje lista är en array av [timestamp, value]
    console.log(`[Server/CoinGecko] Skickar historisk data för ${coinId}`);
    res.json(response.data);
  } catch (error) {
    console.error(`[Server/CoinGecko] Fel vid hämtning av historisk kryptodata för ${coinId}:`, error.response ? error.response.data : error.message);
    res.status(error.response?.status || 500).json({ 
      error: `Kunde inte hämta historisk data för kryptovaluta ${coinId}.`,
      details: error.message
    });
  }
});

// --- FRED (Federal Reserve Economic Data) Endpoints ---

// Hämta observationer för en specifik FRED-serie
// Exempel på series_id: FEDFUNDS (Federal Funds Rate), GDP (Gross Domestic Product), CPIAUCSL (Consumer Price Index)
app.get('/api/fred/series/observations/:series_id', async (req, res) => {
  const series_id = req.params.series_id;
  // Valfria parametrar från FRED API: observation_start, observation_end, limit, sort_order, units etc.
  const { observation_start, observation_end, limit = 100, sort_order = 'desc', units = 'lin' } = req.query;
  console.log(`[Server/FRED] Mottog begäran för FRED-serien: ${series_id}`);

  if (!FRED_API_KEY) {
    console.warn('[Server/FRED] FRED_API_KEY saknas.');
    return res.status(503).json({ error: 'FRED API-nyckel saknas på servern.' });
  }

  try {
    const params = {
      series_id,
      api_key: FRED_API_KEY,
      file_type: 'json',
      limit,
      sort_order,
      units
    };
    // Lägg bara till datum om de är specificerade
    if (observation_start) params.observation_start = observation_start;
    if (observation_end) params.observation_end = observation_end;

    const response = await axios.get(`${FRED_BASE_URL}/series/observations`, { params });

    if (response.data && response.data.observations) {
      console.log(`[Server/FRED] Skickar ${response.data.observations.length} observationer för FRED-serien ${series_id}`);
      res.json({
        series_id: series_id,
        realtime_start: response.data.realtime_start,
        realtime_end: response.data.realtime_end,
        observation_start: response.data.observation_start,
        observation_end: response.data.observation_end,
        units: response.data.units,
        output_type: response.data.output_type,
        count: response.data.count,
        limit: response.data.limit,
        observations: response.data.observations.map(obs => ({
          date: obs.date,
          value: obs.value === '.' ? null : parseFloat(obs.value) // FRED använder '.' för NaN
        }))
      });
    } else {
      console.warn(`[Server/FRED] Ingen data eller oväntat format från FRED för ${series_id}`, response.data);
      res.status(404).json({ error: `Ingen observationsdata hittades för FRED-serien ${series_id}.` });
    }
  } catch (error) {
    console.error(`[Server/FRED] Fel vid hämtning av FRED-seriedata för ${series_id}:`, 
                  error.response ? error.response.data : error.message);
    res.status(error.response?.status || 500).json({ 
      error: `Internt serverfel vid hämtning av FRED-seriedata för ${series_id}.`,
      details: error.response?.data?.error_message || error.message // FRED använder error_message
    });
  }
});

// --- EOD Historical Data (EODHD) Endpoints ---

// Hämta insiderhandel för en specifik ticker
app.get('/api/eodhd/insider-transactions/:ticker', async (req, res) => {
  let tickerInput = req.params.ticker;
  let tickerEodhd = tickerInput.toUpperCase(); // Konvertera till versaler som standard

  // EODHD förväntar sig ofta ticker.EXCHANGE format, t.ex. AAPL.US, VOLV-B.ST
  // Anpassa för Stockholmsbörsen och amerikanska tickers
  if (tickerEodhd.endsWith('.ST')) {
    // Behåll .ST för Stockholmsbörsen (EODHD använder detta för OMX Stockholm)
  } else if (tickerEodhd.endsWith('.AS')) {
    // EODHD använder .AS för Amsterdam (t.ex. ASML.AS)
  } else if (tickerEodhd.endsWith('.L')) {
    // EODHD använder .L för London Stock Exchange
  } else if (!tickerEodhd.includes('.')) {
    // Om ingen exchange specificeras, prova med .US som en vanlig gissning för amerikanska aktier
    // Detta kan behöva justeras om du hanterar många olika börser
    console.log(`[Server/EODHD] Ticker ${tickerInput} saknar exchange, antar .US för EODHD.`);
    tickerEodhd = `${tickerEodhd}.US`;
  }

  console.log(`[Server/EODHD] Mottog begäran för insiderhandel: ${tickerInput} (Använder EODHD ticker: ${tickerEodhd})`);

  if (!EODHD_API_KEY) {
    console.warn('[Server/EODHD] EODHD_API_KEY saknas.');
    return res.status(503).json({ error: 'EODHD API-nyckel saknas på servern.' });
  }

  try {
    const params = {
      api_token: EODHD_API_KEY,
      fmt: 'json'
      // Ytterligare EODHD-parametrar kan läggas till här, t.ex.:
      // from: 'YYYY-MM-DD',
      // to: 'YYYY-MM-DD',
      // limit: 100 
    };

    const response = await axios.get(`${EODHD_BASE_URL}/insider-transactions`, { params: { ...params, code: tickerEodhd } });
    // Notera: Vissa API:er (som EODHD tidigare) använde ticker direkt i URL:en, medan andra använder det som en query parameter 'code' eller 'symbols'.
    // Dubbelkolla EODHD:s dokumentation för den exakta URL-strukturen för insider-transactions.
    // Enligt aktuell dokumentation (2024) verkar det vara en query parameter 'code' för symbolen på insider-transactions endpoint.
    // Om det var /insider-transactions/${tickerEodhd} tidigare, har det kanske ändrats.

    if (response.data && Array.isArray(response.data)) {
      console.log(`[Server/EODHD] Skickar ${response.data.length} insider-transaktioner för ${tickerInput}`);
      
      const formattedData = response.data.map(tx => {
        // Försök att standardisera nycklarna baserat på vad EODHD vanligtvis returnerar
        const transactionDate = tx.transactionDate || tx.date;
        const ownerName = tx.ownerName || tx.reportingPersonName || tx.name;
        let transactionType = tx.transactionType || tx.transaction_type;
        const shares = parseInt(tx.transactionShares || tx.shares || tx.transaction_shares || 0);
        const price = parseFloat(tx.transactionPricePerShare || tx.price || tx.transaction_price_per_share || 0);
        
        // Försök att tolka köp/sälj från transactionType om det är en sträng som 'P-Purchase'
        if (typeof transactionType === 'string') {
          if (transactionType.toUpperCase().includes('PURCHASE') || transactionType.toUpperCase().startsWith('P')) {
            transactionType = 'Köp';
          } else if (transactionType.toUpperCase().includes('SALE') || transactionType.toUpperCase().startsWith('S')) {
            transactionType = 'Sälj';
          }
        }

        return {
          date: transactionDate,
          ownerName: ownerName,
          transactionType: transactionType, 
          transactionShares: shares,
          pricePerShare: price,
          totalValue: price * shares,
          linkToSource: tx.link || tx.linkToSource, 
          ownerTitle: tx.ownerTitle || tx.owner_title,
          securityName: tx.securityName || tx.security_name
        };
      }).sort((a,b) => new Date(b.date) - new Date(a.date)); // Sortera med senaste först

      res.json(formattedData);
    } else {
      console.warn(`[Server/EODHD] Ingen data eller oväntat format för insiderhandel från EODHD för ${tickerInput}`, response.data);
      res.json([]); 
    }
  } catch (error) {
    console.error(`[Server/EODHD] Fel vid hämtning av insiderhandel för ${tickerInput}:`, 
                  error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
    let errorDetails = error.message;
    if (typeof error.response?.data === 'string') {
        errorDetails = error.response.data;
    } else if (error.response?.data?.message) {
        errorDetails = error.response.data.message;
    } else if (error.response?.data?.Error) { // EODHD kan använda 'Error'
        errorDetails = error.response.data.Error;
    }

    res.status(error.response?.status || 500).json({ 
      error: `Internt serverfel vid hämtning av insiderhandel för ${tickerInput}.`,
      details: errorDetails,
      eodhd_ticker_used: tickerEodhd // Inkludera vilken ticker som faktiskt användes mot EODHD
    });
  }
});

// --- Starta Servern --- 
app.listen(PORT, () => {
  console.log(`[Server] Backend-proxy körs på http://localhost:${PORT}`);
}); 