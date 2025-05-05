import React from 'react';
import { AlertTriangle, Globe, Clock, ExternalLink } from 'lucide-react';

const NewsFeed = ({ ticker, newsData, isLoading, error }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-4 bg-gray-700 w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-700 w-full mb-2"></div>
          <div className="h-32 bg-gray-700 w-full"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-400">
        <AlertTriangle className="mb-4" size={32} />
        <p>Kunde inte ladda nyheter. Försök igen senare.</p>
      </div>
    );
  }
  
  if (!newsData || newsData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <Globe className="mb-4" size={32} />
        <p>Inga nyheter hittades för {ticker}.</p>
      </div>
    );
  }

  // Formatera datum
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = diffMs / (1000 * 60 * 60);
    
    // Om mindre än 24 timmar sedan
    if (diffHours < 24) {
      if (diffHours < 1) {
        const minutes = Math.floor(diffMs / (1000 * 60));
        return `${minutes} min sedan`;
      }
      return `${Math.floor(diffHours)} tim sedan`;
    }
    
    // Annars visa datum
    return date.toLocaleDateString('sv-SE', { 
      day: 'numeric', 
      month: 'short'
    });
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Senaste Nyheterna</h3>
      
      <div className="space-y-4">
        {newsData.map(newsItem => (
          <div key={newsItem.id} className="bg-gray-800/50 p-4 shadow-sm border border-gray-700/50 hover:bg-gray-700/50 transition-colors duration-200">
            <a 
              href={newsItem.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center text-primary hover:text-primary-dark font-semibold text-base mb-2 transition-colors duration-150"
            >
              {newsItem.title}
              <ExternalLink size={14} className="ml-1" />
            </a>
            
            <p className="text-sm text-gray-300 mb-3 line-clamp-2">
              {newsItem.summary || 'Ingen sammanfattning tillgänglig.'}
            </p>
            
            <div className="flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center">
                <Globe size={14} className="mr-1" />
                <span className="truncate max-w-[150px]">{newsItem.source}</span>
              </div>
              <div className="flex items-center">
                <Clock size={14} className="mr-1" />
                <span>{formatDate(newsItem.date)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 text-xs text-gray-500 flex items-center justify-center">
        <Globe size={12} className="mr-1"/> 
        Nyhetsdata från NewsAPI
      </div>
    </div>
  );
};

export default NewsFeed; 