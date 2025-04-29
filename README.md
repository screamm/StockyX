# StockyX 📈

![StockyX Logo](https://raw.githubusercontent.com/screamm/StockyX/master/src/assets/react.svg?sanitize=true) <!-- Eller en annan snyggare logotyp om du har -->

**Aktiemarknaden i realtid (nästan!) - En modern aktieöversikt byggd med React och Vite.**

---

<!-- Lägg in skärmdump här -->
<!-- Exempel: ![StockyX Skärmdump](docs/images/stockyx-screenshot.png) -->

## ✨ Funktioner

*   **Dynamisk Aktielista:** Se en lista över populära aktier (från OMXS30 och globala marknader).
*   **Realtidsuppdateringar (begränsat):** Kurser och förändringar uppdateras (med viss fördröjning pga API-begränsningar).
*   **Sök och Filtrera:** Sök efter aktier på namn eller ticker. Filtrera för att endast visa favoriter.
*   **Sortering:** Sortera listan baserat på namn, pris, förändring, volym eller börsvärde.
*   **Favoriter:** Markera aktier som favoriter (sparas lokalt i webbläsaren).
*   **Detaljerad Vy:** Klicka på en aktie för att se:
    *   Interaktiv kursgraf (daglig historik).
    *   Företagsinformation (sektor, bransch, beskrivning).
    *   Nyckeltal (Börsvärde, P/E, Direktavkastning, 52v Högst/Lägst).
    *   Senaste nyheterna relaterade till aktien.
*   **Responsiv Design:** Anpassar sig till olika skärmstorlekar.

## 🛠️ Teknologier

*   **Frontend:** [React](https://reactjs.org/), [Vite](https://vitejs.dev/)
*   **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
*   **Diagram:** [Recharts](https://recharts.org/)
*   **Ikoner:** [Lucide React](https://lucide.dev/)
*   **Datahämtning:** [Axios](https://axios-http.com/)
*   **API:er:**
    *   [Alpha Vantage](https://www.alphavantage.co/) (Aktiekurser, historik, företagsinfo)
    *   [NewsAPI](https://newsapi.org/) (Nyheter)
*   **Linting:** [ESLint](https://eslint.org/)

## 🚀 Komma igång

1.  **Klona repot:**
    ```bash
    git clone https://github.com/screamm/StockyX.git
    cd StockyX
    ```
2.  **Installera beroenden:**
    ```bash
    npm install
    ```
3.  **API-nycklar:**
    *   Du behöver API-nycklar från [Alpha Vantage](https://www.alphavantage.co/support/#api-key) och [NewsAPI](https://newsapi.org/register).
    *   Öppna filen `src/components/StockApp.jsx`.
    *   Ersätt platshållarna `YOUR_ALPHA_VANTAGE_KEY` och `YOUR_NEWSAPI_KEY` med dina egna nycklar.
    *   **VIKTIGT:** För produktion bör API-nycklar hanteras säkrare via miljövariabler (t.ex. med `.env`-filer och `import.meta.env` i Vite).
4.  **Kör utvecklingsservern:**
    ```bash
    npm run dev
    ```
5.  Öppna din webbläsare och gå till `http://localhost:5175` (eller den port som anges i terminalen).

## ⚠️ API-begränsningar

*   **Alpha Vantage (Gratis):** Har strikta begränsningar (t.ex. 5 anrop per minut, 25 per dag). Applikationen försöker hantera detta med fördröjningar mellan anrop och cachning, men du kan fortfarande nå gränsen vid intensiv användning.
*   **NewsAPI (Gratis/Developer):** Har också begränsningar på antalet anrop och hur långt tillbaka i tiden du kan söka.

---

*Detta är ett hobbyprojekt för lärande och demonstration.*
