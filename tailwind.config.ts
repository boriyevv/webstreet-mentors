import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 50: '#f0f6ff', 100: '#dce9ff', 200: '#b9d3ff', 500: '#2b6dff', 600: '#0a5cff', 700: '#0847c9', 800: '#0a37a0' },
        ink: { 900: '#0b1220', 700: '#334155', 500: '#64748b', 300: '#cbd5e1', 200: '#e2e8f0', 100: '#f1f5f9', 50: '#f8fafc' },
      },
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'] },
    },
  },
  plugins: [],
};
export default config;
