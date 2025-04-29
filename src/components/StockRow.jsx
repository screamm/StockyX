import React from 'react';
import { Star } from 'lucide-react';
import { formatNumber, formatLargeNumber } from '../services/apiService';

const StockRow = ({ stockInfo, quote, onSelect, isSelected, isFavorite, onToggleFavorite }) => {
  const price = quote?.price;
  const change = quote?.change;
  const changePercent = quote?.changePercent;
  const volume = quote?.volume;
  const marketCap = stockInfo.marketCap;

  const hasData = quote !== undefined;

  return (
    <tr 
      className={`border-b border-gray-700 transition-colors duration-150 ${
        isSelected ? 'bg-blue-900/50' : 'hover:bg-gray-700/70'
      } ${!hasData ? 'opacity-50' : ''}`} 
      onClick={() => hasData && onSelect(stockInfo.ticker)}
      title={!hasData ? "Väntar på data..." : ""}
    >
      <td className="table-cell py-3 flex items-center">
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            onToggleFavorite(stockInfo.ticker); 
          }} 
          className="mr-2 text-gray-500 hover:text-yellow-400 focus:outline-none transition-colors duration-150"
          aria-label={isFavorite ? "Ta bort från favoriter" : "Lägg till i favoriter"}
        >
          <Star 
            size={16} 
            fill={isFavorite ? 'currentColor' : 'none'} 
            className={isFavorite ? 'text-yellow-400' : ''} 
          />
        </button>
        <div>
          <div className="font-semibold text-white">{stockInfo.name}</div> 
          <div className="text-xs text-gray-400">{stockInfo.ticker}</div>
        </div>
      </td>
      <td className={`table-cell text-right ${!hasData ? 'text-gray-500' : change >= 0 ? 'text-green-400' : 'text-red-400'} font-medium`}>
        {hasData ? formatNumber(price) : '...'}
      </td>
      <td className={`table-cell text-right ${!hasData ? 'text-gray-500' : change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
        {hasData ? (
          <div className="flex items-center justify-end">
            <span>{`${change >= 0 ? '+' : ''}${formatNumber(change)}`}</span>
            <span className="ml-1 text-xs">{`(${changePercent >= 0 ? '+' : ''}${formatNumber(changePercent)}%)`}</span>
          </div>
        ) : '...'}
      </td>
      <td className="table-cell text-right hidden md:table-cell text-gray-300">
        {hasData ? formatLargeNumber(volume) : '...'}
      </td>
      <td className="table-cell text-right hidden lg:table-cell text-gray-300">
        {formatLargeNumber(marketCap)} 
      </td>
    </tr>
  );
};

export default StockRow; 