import React, { createContext, useContext, useState, useEffect } from 'react';

// Skapa en context för tema-hantering
const ThemeContext = createContext();

// Hook för att använda temat i komponenter
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme måste användas inom en ThemeProvider');
  }
  return context;
};

// Hjälpfunktion för att direkt manipulera dokumentets dark-klass
const setDocumentDarkClass = (isDark) => {
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

export const ThemeProvider = ({ children }) => {
  // Initialisera tema från localStorage eller default till 'light'
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    // Konvertera eventuellt 'auto' till 'light'
    return savedTheme === 'dark' ? 'dark' : 'light';
  });
  
  // Om någon vill veta om det är dark mode aktivt just nu
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark';
    setDocumentDarkClass(isDark);
    return isDark;
  });
  
  // Force-uppdatera temat när komponenten har monterats
  useEffect(() => {
    updateThemeAppearance(theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Hjälpfunktion som applicerar temat baserat på tema-string
  const updateThemeAppearance = (currentTheme) => {
    // 1. Uppdatera data-theme attribut på HTML
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    // 2. Uppdatera dark-klassen baserat på tema
    const isDark = currentTheme === 'dark';
    setDocumentDarkClass(isDark);
    setIsDarkMode(isDark);
    
    // 3. Spara tema i localStorage
    localStorage.setItem('theme', currentTheme);
  };
  
  // När temat ändras, uppdatera utseendet
  useEffect(() => {
    updateThemeAppearance(theme);
  }, [theme]);
  
  // Exponera en funktionsrik API för tema-hantering
  const themeAPI = {
    // Aktuellt tema: 'light', 'dark'
    theme,
    
    // Boolean: är dark mode aktivt just nu
    isDarkMode,
    
    // Sätt tema direkt (tar antingen 'light' eller 'dark', eller en funktion)
    setTheme: (newTheme) => {
      if (typeof newTheme === 'function') {
        setTheme(current => {
          const result = newTheme(current);
          return result === 'dark' || result === 'light' ? result : 'light';
        });
      } else {
        setTheme(newTheme === 'dark' ? 'dark' : 'light');
      }
    },
    
    // Bekväm temabytesfunktion - växlar bara mellan light och dark
    toggleTheme: (forceTheme) => {
      if (forceTheme) {
        setTheme(forceTheme === 'dark' ? 'dark' : 'light');
      } else {
        setTheme(current => current === 'light' ? 'dark' : 'light');
      }
    },
    
    // Direkta byten
    setLightTheme: () => setTheme('light'),
    setDarkTheme: () => setTheme('dark'),
    
    // Generera en diagnostikrapport
    generateReport: () => {
      console.log('=== TEMA DIAGNOSTIK ===');
      console.log('Nuvarande tema:', theme);
      console.log('isDarkMode:', isDarkMode);
      console.log('HTML dark klass:', document.documentElement.classList.contains('dark'));
      console.log('HTML data-theme:', document.documentElement.getAttribute('data-theme'));
      console.log('localStorage tema:', localStorage.getItem('theme'));
      
      // Kontrollera Tailwind-specifika klasser
      const appContainer = document.querySelector('.app-container');
      if (appContainer) {
        console.log('App container klassnamn:', appContainer.className);
        console.log('App container beräknade stil:', window.getComputedStyle(appContainer).backgroundColor);
      }
      
      // Kontrollera om CSS-variabler appliceras korrekt
      console.log('CSS-variabler:', {
        '--bg-body': getComputedStyle(document.documentElement).getPropertyValue('--bg-body').trim(),
        '--color-text': getComputedStyle(document.documentElement).getPropertyValue('--color-text').trim()
      });
      
      // Åtgärd: Force-applicera tema om det finns diskrepans
      if (theme === 'dark' && !document.documentElement.classList.contains('dark')) {
        console.log('ÅTGÄRD: Force-applicerar dark-klass');
        setDocumentDarkClass(true);
      } else if (theme === 'light' && document.documentElement.classList.contains('dark')) {
        console.log('ÅTGÄRD: Force-tar bort dark-klass');
        setDocumentDarkClass(false);
      }
    }
  };
  
  return (
    <ThemeContext.Provider value={themeAPI}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider; 