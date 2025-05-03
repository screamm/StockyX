# StockyX 📈

En modern aktiehanteringsplattform för att övervaka, analysera och följa aktiekurser i realtid.

![StockyX Screenshot](./screenshot.png)
*Lägg till en skärmdump av applikationen här*

## 🌟 Funktioner

- **Marknadsöversikt** - Få en snabb överblick över marknadsindex, valutor och dagens vinnare/förlorare
- **Aktiesökning och filtrering** - Sök och filtrera bland aktier med realtidsprisuppdateringar
- **Avancerade grafer** - Visualisera historisk data med interaktiva prisgrafik
- **Detaljerad aktieinformation** - Tillgång till företagsinformation, finansiella nyckeltal och nyheter
- **Favorithantering** - Spara och följ dina favoritaktier för enkel tillgång
- **Responsiv design** - Fungerar på desktop, surfplatta och mobil
- **Mörkt läge** - Bekväm visuell upplevelse för alla ljusförhållanden

## 🚀 Komma igång

### Förutsättningar

- Node.js (version 18 eller senare)
- npm eller yarn
- API-nycklar för Alpha Vantage och NewsAPI

### Installation

1. Klona repositoryt
   ```bash
   git clone https://github.com/ditt-användarnamn/StockyX.git
   cd StockyX
   ```

2. Installera beroenden för frontend
   ```bash
   npm install
   ```

3. Installera beroenden för backend
   ```bash
   cd server
   npm install
   cd ..
   ```

4. Konfigurera API-nycklar
   ```bash
   # Kopiera exempel-konfigurationsfilen
   cp server/.env.example server/.env
   
   # Redigera .env-filen och lägg till dina API-nycklar
   # ALPHA_VANTAGE_API_KEY=din_alpha_vantage_nyckel
   # NEWS_API_KEY=din_news_api_nyckel
   ```

5. Starta utvecklingsservern för backend
   ```bash
   cd server
   npm run dev
   ```

6. Starta utvecklingsservern för frontend (i ett annat terminalfönster)
   ```bash
   npm run dev
   ```

7. Öppna applikationen i din webbläsare: [http://localhost:5173](http://localhost:5173)

## 🛠️ Teknologier

### Frontend
- React 18
- Vite
- Tailwind CSS
- Lucide Icons
- Recharts för grafritning
- Axios för API-anrop

### Backend
- Node.js
- Express
- Yahoo Finance API
- Alpha Vantage API
- NewsAPI

## 📊 API-information

StockyX använder följande API:er:

- **Alpha Vantage** - För aktiedata, företagsinformation och valutakurser
- **NewsAPI** - För aktie- och företagsrelaterade nyheter
- **Yahoo Finance** (som fallback) - För ytterligare aktiedata

API-anrop hanteras via en egen backend-proxy för att skydda API-nycklar och implementera cachning.

### Tillgängliga Endpoints

- `/api/quote/:ticker` - Hämtar senaste aktiekurs för en aktie
- `/api/history/:ticker` - Hämtar historisk prisdata för en aktie
- `/api/overview/:ticker` - Hämtar företagsinformation
- `/api/news?q=söksträng` - Hämtar nyheter baserat på söksträng
- `/api/currency/:fromCurrency/:toCurrency` - Hämtar valutakurser
- `/api/topmovers` - Hämtar dagens vinnare och förlorare

## 🧩 Projektstruktur

```
StockyX/
├── public/             # Statiska filer
├── server/             # Backend-proxyserver
│   ├── server.js       # Express-serverimplementation
│   └── ...
├── src/                # Frontend-källkod
│   ├── assets/         # Bilder och statiska tillgångar
│   ├── components/     # React-komponenter
│   ├── services/       # API-servicefunktioner
│   ├── App.jsx         # Huvudapp-komponent
│   └── ...
└── ...
```

## 🤝 Bidra

1. Forka repositoryt
2. Skapa en feature branch (`git checkout -b feature/amazing-feature`)
3. Commit dina ändringar (`git commit -m 'Add some amazing feature'`)
4. Push till branchen (`git push origin feature/amazing-feature`)
5. Öppna en Pull Request

## 📝 Licens

Distribueras under MIT-licensen. Se `LICENSE`-filen för mer information.

## 📞 Kontakt

Projektlänk: [https://github.com/ditt-användarnamn/StockyX](https://github.com/ditt-användarnamn/StockyX)

---

Byggt med ❤️ i Sverige
