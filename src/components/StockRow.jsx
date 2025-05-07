import React from 'react';
import { Star } from 'lucide-react';
import { formatLargeNumber } from '../services/apiService';

const StockRow = ({ stockInfo, quote, onSelect, isSelected, isFavorite, onToggleFavorite }) => {
  const change = quote?.change;
  const changePercent = quote?.changePercent;

  const hasData = quote !== undefined;

  const handleSelect = () => {
    onSelect(stockInfo.ticker);
  };

  const handleToggleFavorite = (e) => {
    e.stopPropagation(); // Förhindra radval när stjärnan klickas
    onToggleFavorite(stockInfo.ticker);
  };

  return (
    <tr 
      className={`cursor-pointer hover:bg-gray-200/50 dark:hover:bg-gray-700/50 ${isSelected ? 'bg-blue-100/50 dark:bg-blue-900/30' : ''}`} 
      onClick={handleSelect}
    >
      <td className="px-4 text-sm py-3 pl-4 pr-2">
        <div className="flex items-center">
          <button 
            onClick={handleToggleFavorite}
            className={`mr-3 text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400 focus:outline-none transition-colors duration-150 ${isFavorite ? 'text-yellow-400' : ''}`}
            aria-label={isFavorite ? "Ta bort från favoriter" : "Lägg till i favoriter"}
          >
            <Star size={16} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
          <div>
            <div className="font-medium text-gray-900 dark:text-white truncate w-32 sm:w-auto">{stockInfo.name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">{stockInfo.ticker}</div>
          </div>
        </div>
      </td>
      <td className={`py-2 text-sm text-right ${!hasData ? 'text-gray-500' : change >= 0 ? 'text-green-400' : 'text-red-400'} font-medium px-2`}>
        {hasData ? quote.price.toLocaleString('sv-SE', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-'}
      </td>
      <td className={`py-2 text-sm text-right ${!hasData ? 'text-gray-500' : change >= 0 ? 'text-green-400' : 'text-red-400'} px-2`}>
        {hasData ? (
          <span>
            {changePercent >= 0 ? '+' : ''}
            {changePercent.toLocaleString('sv-SE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}%
          </span>
        ) : '-'}
      </td>
      <td className="py-2 text-sm text-right hidden md:table-cell text-gray-500 dark:text-gray-400 px-2">
        {hasData ? formatLargeNumber(quote.volume) : '-'}
      </td>
      <td className="py-2 text-sm text-right hidden lg:table-cell text-gray-500 dark:text-gray-400 px-4 pr-4">
        {stockInfo.marketCap ? formatLargeNumber(stockInfo.marketCap) : '-'}
      </td>
    </tr>
  );
};

export default StockRow; 