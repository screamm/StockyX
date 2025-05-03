import React from 'react';
import { AlertTriangle, Briefcase, TrendingUp, BarChart3, DollarSign, Percent, Calendar, ArrowDown, ArrowUp, Clock } from 'lucide-react';
import { formatNumber, formatLargeNumber } from '../services/apiService';

// Ny underkomponent för Info-kort
const InfoCard = ({ title, value, icon }) => (
  <div className="bg-white dark:bg-gray-800/50 p-3 shadow-sm border border-gray-200 dark:border-gray-700/50 hover:shadow-md dark:hover:bg-gray-700/50 transition-all duration-150">
    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-1">
      {icon || <Briefcase size={14} />}
      <span>{title}</span>
    </div>
    <div className="font-medium text-gray-900 dark:text-white text-sm">
      {value}
    </div>
  </div>
);

const StockInfo = ({ ticker, overviewData, quoteData, isLoading, error }) => {
  if (isLoading) {
    return <div className="text-center py-10 text-gray-500 dark:text-gray-400">Laddar information...</div>;
  }
  
  if (error) {
    return <div className="text-center py-10 text-red-600 dark:text-red-400"><AlertTriangle className="inline mr-1"/> Kunde inte ladda information.</div>;
  }
  
  if (!overviewData) {
    return <div className="text-center py-10 text-gray-600 dark:text-gray-500">Ingen information tillgänglig för {ticker}.</div>;
  }

  // Kombinera data från overview och quote för en komplett bild
  const combined = { ...overviewData, ...quoteData };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Företagsinformation</h3>
      
      {/* Sektorer och bransch */}
      <div className="flex flex-wrap gap-2 mb-4">
        {combined.sector && (
          <span className="inline-flex items-center bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs px-2.5 py-1">
            <Briefcase size={14} className="inline mr-1"/> {combined.sector}
          </span>
        )}
        {combined.industry && (
          <span className="inline-flex items-center bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs px-2.5 py-1">
            <Briefcase size={14} className="inline mr-1"/> {combined.industry}
          </span>
        )}
      </div>
      
      {/* Beskrivning */}
      {overviewData.description && (
        <div className="mb-6 bg-gray-50 dark:bg-gray-800/50 p-4 shadow-sm border border-gray-200 dark:border-gray-700/50">
          <h4 className="text-md font-semibold mb-2 text-gray-800 dark:text-gray-200">Om företaget</h4>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {overviewData.description}
          </p>
        </div>
      )}
      
      {/* Nyckeltal grid - Använder nu InfoCard */}
      <h4 className="text-md font-semibold mb-3 text-gray-800 dark:text-gray-200">Nyckeltal</h4>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-sm mb-6">
        <InfoCard 
          title="Börsvärde"
          value={formatLargeNumber(combined.marketCap)} 
          icon={<BarChart3 size={14} className="text-blue-500 dark:text-blue-400" />} 
        />
        <InfoCard 
          title="P/E-tal"
          value={formatNumber(combined.peRatio, 1)} 
          icon={<DollarSign size={14} className="text-green-500 dark:text-green-400" />} 
        />
        <InfoCard 
          title="Direktav."
          value={`${formatNumber(combined.dividendYield, 1)}%`} 
          icon={<Percent size={14} className="text-yellow-500 dark:text-yellow-400" />} 
        />
        <InfoCard 
          title="52v Högst"
          value={formatNumber(combined.fiftyTwoWeekHigh)} 
          icon={<TrendingUp size={14} className="text-green-500 dark:text-green-400" />} 
        />
         <InfoCard 
          title="52v Lägst"
          value={formatNumber(combined.fiftyTwoWeekLow)} 
          icon={<TrendingUp size={14} className="text-red-500 dark:text-red-400 transform rotate-180" />} 
        />
         <InfoCard 
          title="Senast Uppd."
          value={combined.lastTradingDay ? new Date(combined.lastTradingDay).toLocaleDateString('sv-SE') : '-'} 
          icon={<Clock size={14} className="text-gray-500 dark:text-gray-400" />} 
        />
      </div>
      
      {/* Dagliga värden - Använder nu InfoCard */}
      {combined.open && (
        <div className="mb-6">
          <h4 className="text-md font-semibold mb-3 text-gray-800 dark:text-gray-200">Dagens Handel</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <InfoCard title="Öppning" value={formatNumber(combined.open)} icon={<ArrowUp size={14}/>} />
            <InfoCard title="Högst" value={formatNumber(combined.dayHigh)} icon={<TrendingUp size={14}/>} />
            <InfoCard title="Lägst" value={formatNumber(combined.dayLow)} icon={<TrendingDown size={14}/>} />
            <InfoCard title="Föreg. Stängn." value={formatNumber(combined.prevClose)} icon={<Calendar size={14}/>} />
          </div>
        </div>
      )}

      {/* Tabeller för insiderhandel, ägare, utdelning (behåller tidigare struktur men med uppdaterade färger) */}
      
      {/* Insiderhandel */}
      {overviewData.insiderTransactions && overviewData.insiderTransactions.length > 0 && (
        <div className="mt-6">
          <h4 className="text-md font-semibold mb-3 text-gray-800 dark:text-gray-200">Insiderhandel</h4>
          <div className="bg-white dark:bg-gray-800/50 shadow-sm border border-gray-200 dark:border-gray-700/50 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-600 dark:text-gray-400 text-xs bg-gray-50 dark:bg-gray-700/50">
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left p-3 font-medium">Datum</th>
                  <th className="text-left p-3 font-medium">Namn</th>
                  <th className="text-left p-3 font-medium">Position</th>
                  <th className="text-left p-3 font-medium">Typ</th>
                  <th className="text-right p-3 font-medium">Antal</th>
                  <th className="text-right p-3 font-medium">Pris</th>
                  <th className="text-right p-3 hidden md:table-cell font-medium px-4 py-2 text-sm">Värde</th>
                </tr>
              </thead>
              <tbody className="text-gray-700 dark:text-gray-300">
                {overviewData.insiderTransactions.map((tx, index) => (
                  <tr key={index} className="border-b border-gray-200 dark:border-gray-700/50 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-150">
                    <td className="p-3">{new Date(tx.date).toLocaleDateString('sv-SE')}</td>
                    <td className="p-3">{tx.name}</td>
                    <td className="p-3">{tx.position}</td>
                    <td className={`p-3 font-medium ${tx.type === 'Köp' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{tx.type}</td>
                    <td className="text-right p-3">{formatNumber(tx.shares, 0)}</td>
                    <td className="text-right p-3">{formatNumber(tx.price)}</td>
                    <td className="text-right p-3 hidden md:table-cell px-4 py-2 text-sm">{formatLargeNumber(tx.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Större ägare */}
      {overviewData.majorShareholders && overviewData.majorShareholders.length > 0 && (
        <div className="mt-6">
          <h4 className="text-md font-semibold mb-3 text-gray-800 dark:text-gray-200">Största ägare</h4>
           <div className="bg-white dark:bg-gray-800/50 shadow-sm border border-gray-200 dark:border-gray-700/50 overflow-x-auto">
            <table className="w-full text-sm">
               <thead className="text-gray-600 dark:text-gray-400 text-xs bg-gray-50 dark:bg-gray-700/50">
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left p-3 font-medium">Namn</th>
                  <th className="text-right p-3 font-medium">Antal aktier</th>
                  <th className="text-right p-3 font-medium">Andel (%)</th>
                </tr>
              </thead>
              <tbody className="text-gray-700 dark:text-gray-300">
                {overviewData.majorShareholders.map((owner, index) => (
                  <tr key={index} className="border-b border-gray-200 dark:border-gray-700/50 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-150">
                    <td className="p-3">{owner.name}</td>
                    <td className="text-right p-3">{formatLargeNumber(owner.shares)}</td>
                    <td className="text-right p-3">{formatNumber(owner.percent, 1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Utdelningshistorik */}
      {overviewData.dividendHistory && overviewData.dividendHistory.length > 0 && (
        <div className="mt-6">
          <h4 className="text-md font-semibold mb-3 text-gray-800 dark:text-gray-200">Utdelningshistorik</h4>
          <div className="bg-white dark:bg-gray-800/50 shadow-sm border border-gray-200 dark:border-gray-700/50 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-600 dark:text-gray-400 text-xs bg-gray-50 dark:bg-gray-700/50">
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left p-3 font-medium">År</th>
                  <th className="text-right p-3 font-medium">Utdelning</th>
                  <th className="text-right p-3 hidden sm:table-cell font-medium px-4 py-2 text-sm">Direktav.</th>
                  <th className="text-right p-3 hidden md:table-cell font-medium px-4 py-2 text-sm">X-dag</th>
                  <th className="text-right p-3 hidden md:table-cell font-medium px-4 py-2 text-sm">Utbet.dag</th>
                </tr>
              </thead>
              <tbody className="text-gray-700 dark:text-gray-300">
                {overviewData.dividendHistory.map((div, index) => (
                  <tr key={index} className="border-b border-gray-200 dark:border-gray-700/50 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-150">
                    <td className="p-3">{div.year}</td>
                    <td className="text-right p-3">{formatNumber(div.amount)} SEK</td>
                    <td className="text-right p-3 hidden sm:table-cell px-4 py-2 text-sm">{formatNumber(div.yield, 1)}%</td>
                    <td className="text-right p-3 hidden md:table-cell px-4 py-2 text-sm">{new Date(div.exDate).toLocaleDateString('sv-SE')}</td>
                    <td className="text-right p-3 hidden md:table-cell px-4 py-2 text-sm">{new Date(div.paymentDate).toLocaleDateString('sv-SE')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default StockInfo; 