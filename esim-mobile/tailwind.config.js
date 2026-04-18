/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './index.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#7C3AED',
        'primary-light': '#8B5CF6',
        'primary-dark': '#6D28D9',
        'primary-bg': '#F5F3FF',
        'primary-container': '#EDE9FE',
        secondary: '#FACC15',
        background: '#FAFAFA',
        surface: '#FFFFFF',
        'surface-muted': '#F3F4F6',
        divider: '#E5E7EB',
        border: '#E5E7EB',
        'text-primary': '#111827',
        'text-secondary': '#6B7280',
        'text-tertiary': '#9CA3AF',
        'text-on-primary': '#FFFFFF',
        error: '#EF4444',
        success: '#10B981',
        warning: '#F59E0B',
      },
    },
  },
  plugins: [],
};
