import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss({
      // Explicit TailwindCSS Config
      config: {
        darkMode: 'class', // Säkerställ att dark mode använder class-strategi
        content: ['./src/**/*.{js,jsx,ts,tsx}'], // Alla innehållsfiler
      }
    }),
  ],
  // Disable CSS isolation to prevent scoping issues that might affect dark mode
  css: {
    modules: {
      scopeBehaviour: 'global' // Förhindra isolering som kan påverka dark mode
    }
  }
})
