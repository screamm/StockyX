import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Area, ComposedChart
} from 'recharts';
import { RefreshCw, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { formatNumber, formatDateAxis } from '../services/apiService';

const StockChart = ({ ticker, historyData, isLoading, error }) => {
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900 bg-opacity-90 text-white p-3 border border-gray-700 text-xs shadow-lg">
          <p className="font-semibold">{`${new Date(label).toLocaleDateString('sv-SE')}`}</p>
          <div className="flex items-center mt-1">
            <span className="w-2 h-2 bg-primary inline-block mr-1"></span>
            <p>{`Stängn: ${formatNumber(data.price)}`}</p>
          </div>
          {data.volume && (
            <div className="flex items-center mt-1">
              <span className="w-2 h-2 bg-gray-400 inline-block mr-1"></span>
              <p>{`Volym: ${parseInt(data.volume).toLocaleString('sv-SE')}`}</p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-400">
        <RefreshCw className="animate-spin mr-2"/> Laddar grafdata...
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex justify-center items-center h-64 text-red-400">
        <AlertTriangle className="mr-2"/> Kunde inte ladda grafdata. Försök igen senare.
      </div>
    );
  }
  
  if (!historyData || historyData.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-500">
        Ingen historik tillgänglig för {ticker}.
      </div>
    );
  }

  const startPrice = historyData[0]?.price;
  const endPrice = historyData[historyData.length - 1]?.price;
  const priceChange = endPrice - startPrice;
  const percentChange = ((endPrice - startPrice) / startPrice) * 100;
  const chartColor = endPrice >= startPrice ? '#4ADE80' : '#F87171'; // Grön/Röd
  
  // Skapa startdatum och slutdatum som formaterade strängar
  const dateFrom = new Date(historyData[0]?.date).toLocaleDateString('sv-SE');
  const dateTo = new Date(historyData[historyData.length - 1]?.date).toLocaleDateString('sv-SE');

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Kursutveckling</h3>
        <div className="flex items-center text-sm">
          <span className="text-gray-400 mr-2">{dateFrom} - {dateTo}</span>
          <div className={`flex items-center font-medium ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {priceChange >= 0 ? <TrendingUp size={16} className="mr-1"/> : <TrendingDown size={16} className="mr-1"/>}
            {formatNumber(percentChange)}%
          </div>
        </div>
      </div>
      
      <div style={{ height: '350px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart 
            data={historyData} 
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColor} stopOpacity={0.2}/>
                <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" vertical={false} />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDateAxis} 
              stroke="#9CA3AF"
              tick={{ fontSize: 10 }} 
              interval="preserveStartEnd"
              minTickGap={40}
              axisLine={{ stroke: '#4B5563' }}
              tickLine={{ stroke: '#4B5563' }}
            />
            <YAxis 
              orientation="right" 
              domain={['auto', 'auto']} 
              tickFormatter={(val) => formatNumber(val, val < 10 ? 2 : 0)} 
              stroke="#9CA3AF"
              tick={{ fontSize: 10 }} 
              width={60}
              axisLine={{ stroke: '#4B5563' }}
              tickLine={{ stroke: '#4B5563' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="price"
              stroke={chartColor}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorPrice)"
              activeDot={{ r: 6, stroke: chartColor, strokeWidth: 2, fill: 'white' }}
              animationDuration={750}
            />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke={chartColor}
              strokeWidth={2} 
              dot={false} 
              activeDot={false}
              isAnimationActive={false}
              name="Pris"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StockChart; 