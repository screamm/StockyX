import React from 'react';
import { AlertTriangle, Briefcase, TrendingUp, BarChart3, DollarSign, Percent, Calendar } from 'lucide-react';
import { formatNumber, formatLargeNumber } from '../services/apiService';

const StockInfo = ({ ticker, overviewData, quoteData, isLoading, error }) => {
  if (isLoading) {
    return (
      <div className="text-gray-400 py-10 text-center">
        Laddar information...
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-red-400 py-10 text-center">
        <AlertTriangle className="inline mr-1"/> Kunde inte ladda information.
      </div>
    );
  }
  
  if (!overviewData) {
    return (
      <div className="text-gray-500 py-10 text-center">
        Ingen information tillgänglig för {ticker}.
      </div>
    );
  }

  // Kombinera data från overview och quote för en komplett bild
  const combined = { ...overviewData, ...quoteData };

  // Formatera börsdata för inforutor
  const infoCards = [
    {
      title: 'Börsvärde',
      value: formatLargeNumber(combined.marketCap),
      icon: <BarChart3 size={16} className="text-blue-400" />
    },
    {
      title: 'P/E-tal',
      value: formatNumber(combined.peRatio, 1),
      icon: <DollarSign size={16} className="text-green-400" />
    },
    {
      title: 'Direktavkastning',
      value: `${formatNumber(combined.dividendYield, 1)}%`,
      icon: <Percent size={16} className="text-yellow-400" />
    },
    {
      title: '52v Högst',
      value: formatNumber(combined.fiftyTwoWeekHigh),
      icon: <TrendingUp size={16} className="text-green-400" />
    },
    {
      title: '52v Lägst',
      value: formatNumber(combined.fiftyTwoWeekLow),
      icon: <TrendingUp size={16} className="text-red-400 transform rotate-180" />
    },
    {
      title: 'Senast Uppdaterad',
      value: combined.lastTradingDay ? new Date(combined.lastTradingDay).toLocaleDateString('sv-SE') : '-',
      icon: <Calendar size={16} className="text-blue-400" />
    }
  ];

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Företagsinformation</h3>
      
      {/* Sektorer och bransch */}
      <div className="flex flex-wrap gap-2 mb-4">
        {combined.sector && (
          <span className="inline-flex items-center bg-gray-700 text-white text-xs px-2.5 py-1 rounded">
            <Briefcase size={14} className="inline mr-1 text-blue-400"/> {combined.sector}
          </span>
        )}
        {combined.industry && (
          <span className="inline-flex items-center bg-gray-700 text-white text-xs px-2.5 py-1 rounded">
            <Briefcase size={14} className="inline mr-1 text-green-400"/> {combined.industry}
          </span>
        )}
      </div>
      
      {/* Beskrivning */}
      {overviewData.description && (
        <div className="mb-6 bg-gray-800/50 p-4 rounded-md shadow-sm border border-gray-700/50">
          <h4 className="text-md font-semibold mb-2">Om företaget</h4>
          <p className="text-sm text-gray-300 leading-relaxed">
            {overviewData.description}
          </p>
        </div>
      )}
      
      {/* Nyckeltal grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
        {infoCards.map((card, index) => (
          <div key={index} className="bg-gray-800/50 p-3 rounded-md shadow-sm border border-gray-700/50 hover:bg-gray-700/50 transition-colors duration-150">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
              {card.icon}
              <span>{card.title}</span>
            </div>
            <div className="font-medium text-white">
              {card.value}
            </div>
          </div>
        ))}
      </div>
      
      {/* Dagliga värden */}
      {combined.open && (
        <div className="mt-6">
          <h4 className="text-md font-semibold mb-3">Dagens Handel</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-gray-800/50 p-3 rounded-md shadow-sm border border-gray-700/50">
              <span className="text-gray-400 block text-xs mb-1">Öppning</span> 
              {formatNumber(combined.open)}
            </div>
            <div className="bg-gray-800/50 p-3 rounded-md shadow-sm border border-gray-700/50">
              <span className="text-gray-400 block text-xs mb-1">Högst</span> 
              {formatNumber(combined.dayHigh)}
            </div>
            <div className="bg-gray-800/50 p-3 rounded-md shadow-sm border border-gray-700/50">
              <span className="text-gray-400 block text-xs mb-1">Lägst</span> 
              {formatNumber(combined.dayLow)}
            </div>
            <div className="bg-gray-800/50 p-3 rounded-md shadow-sm border border-gray-700/50">
              <span className="text-gray-400 block text-xs mb-1">Föreg. Stängn.</span> 
              {formatNumber(combined.prevClose)}
            </div>
          </div>
        </div>
      )}

      {/* Insiderhandel */}
      {overviewData.insiderTransactions && overviewData.insiderTransactions.length > 0 && (
        <div className="mt-6">
          <h4 className="text-md font-semibold mb-3">Insiderhandel</h4>
          <div className="bg-gray-800/50 rounded-md shadow-sm border border-gray-700/50 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-400 text-xs">
                <tr className="border-b border-gray-700">
                  <th className="text-left p-3">Datum</th>
                  <th className="text-left p-3">Namn</th>
                  <th className="text-left p-3">Position</th>
                  <th className="text-left p-3">Typ</th>
                  <th className="text-right p-3">Antal</th>
                  <th className="text-right p-3">Pris</th>
                  <th className="text-right p-3 hidden md:table-cell">Värde</th>
                </tr>
              </thead>
              <tbody>
                {overviewData.insiderTransactions.map((tx, index) => (
                  <tr key={index} className="border-b border-gray-700/50 last:border-b-0 hover:bg-gray-700/30 transition-colors duration-150">
                    <td className="p-3">{new Date(tx.date).toLocaleDateString('sv-SE')}</td>
                    <td className="p-3">{tx.name}</td>
                    <td className="p-3">{tx.position}</td>
                    <td className={`p-3 ${tx.type === 'Köp' ? 'text-green-400' : 'text-red-400'}`}>{tx.type}</td>
                    <td className="text-right p-3">{formatNumber(tx.shares, 0)}</td>
                    <td className="text-right p-3">{formatNumber(tx.price)}</td>
                    <td className="text-right p-3 hidden md:table-cell">{formatLargeNumber(tx.value)}</td>
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
          <h4 className="text-md font-semibold mb-3">Största ägare</h4>
          <div className="bg-gray-800/50 rounded-md shadow-sm border border-gray-700/50 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-400 text-xs">
                <tr className="border-b border-gray-700">
                  <th className="text-left p-3">Namn</th>
                  <th className="text-right p-3">Antal aktier</th>
                  <th className="text-right p-3">Andel (%)</th>
                </tr>
              </thead>
              <tbody>
                {overviewData.majorShareholders.map((owner, index) => (
                  <tr key={index} className="border-b border-gray-700/50 last:border-b-0 hover:bg-gray-700/30 transition-colors duration-150">
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
          <h4 className="text-md font-semibold mb-3">Utdelningshistorik</h4>
          <div className="bg-gray-800/50 rounded-md shadow-sm border border-gray-700/50 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-400 text-xs">
                <tr className="border-b border-gray-700">
                  <th className="text-left p-3">År</th>
                  <th className="text-right p-3">Utdelning</th>
                  <th className="text-right p-3 hidden sm:table-cell">Direktav.</th>
                  <th className="text-right p-3 hidden md:table-cell">X-dag</th>
                  <th className="text-right p-3 hidden md:table-cell">Utbet.dag</th>
                </tr>
              </thead>
              <tbody>
                {overviewData.dividendHistory.map((div, index) => (
                  <tr key={index} className="border-b border-gray-700/50 last:border-b-0 hover:bg-gray-700/30 transition-colors duration-150">
                    <td className="p-3">{div.year}</td>
                    <td className="text-right p-3">{formatNumber(div.amount)} SEK</td>
                    <td className="text-right p-3 hidden sm:table-cell">{formatNumber(div.yield, 1)}%</td>
                    <td className="text-right p-3 hidden md:table-cell">{new Date(div.exDate).toLocaleDateString('sv-SE')}</td>
                    <td className="text-right p-3 hidden md:table-cell">{new Date(div.paymentDate).toLocaleDateString('sv-SE')}</td>
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