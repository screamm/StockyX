/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3490dc', // Exempel: En blå primärfärg
        'dark-900': '#111827', // Mycket mörkt grå/svart för bakgrund
        'gray-900': '#1F2937',
        'gray-800': '#374151',
        'gray-700': '#4B5563',
        'gray-600': '#6B7280',
        'gray-500': '#9CA3AF',
        'gray-400': '#D1D5DB',
        'gray-300': '#E5E7EB',
        'green-400': '#4ADE80', // Tailwind grön 400
        'red-400': '#F87171',   // Tailwind röd 400
        'yellow-400': '#FACC15', // Tailwind gul 400
      },
      backgroundColor: {
        'dark-body': 'var(--bg-body)',
        'dark-container': 'var(--bg-container)',
        'dark-card': 'var(--bg-card)',
      },
      textColor: {
        'dark-text': 'var(--color-text)',
        'dark-text-secondary': 'var(--color-text-secondary)',
      },
      borderColor: {
        'dark-border': 'var(--color-border)',
      }
    },
  },
  variants: {
    extend: {
      backgroundColor: ['dark'],
      textColor: ['dark'],
      borderColor: ['dark']
    },
  },
  plugins: [],
} 