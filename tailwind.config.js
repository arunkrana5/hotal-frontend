/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        
        // HotelOS Universal Design Tokens
        brand: {
          bg: 'var(--app-bg)',
          surface: 'var(--surface)',
          secondarySurface: 'var(--surface-secondary)',
          primary: 'var(--brand-primary)',
          hover: 'var(--brand-hover)',
          text: 'var(--text-primary)',
          muted: 'var(--text-secondary)',
          border: 'var(--border-color)',
          success: 'var(--status-success)',
          warning: 'var(--status-warning)',
          danger: 'var(--status-danger)',
          info: 'var(--status-info)',
          
          // Direct theme fallbacks
          lightBg: '#F4F6FA',
          lightSurface: '#FFFFFF',
          lightSecondary: '#F8FAFD',
          lightText: '#172033',
          lightMuted: '#64748B',
          lightBorder: '#E2E8F0',

          darkBg: '#101522',
          darkSurface: '#171F30',
          darkSecondary: '#1D283A',
          darkText: '#F1F5FB',
          darkMuted: '#A0AEC0',
          darkBorder: '#303B4F',
          darkCard: '#1D283A',
        },
        // Deep Navy scale for sidebar & command bars
        navy: {
          950: '#0B0F1A',
          900: '#101522',
          850: '#131A2B',
          800: '#171F30',
          700: '#232E45',
          600: '#324160',
        },
        indigo: {
          brand: '#354FC7',
          hover: '#293FA8',
          subtle: '#EEF0FF',
        },
        blue: {
          brand: '#354FC7',
          hover: '#293FA8',
          light: '#EEF0FF',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'soft-xs': '0 1px 2px 0 rgba(16, 24, 40, 0.04)',
        'soft-sm': '0 1px 3px 0 rgba(16, 24, 40, 0.06), 0 1px 2px -1px rgba(16, 24, 40, 0.04)',
        'soft-md': '0 4px 8px -2px rgba(16, 24, 40, 0.06), 0 2px 4px -2px rgba(16, 24, 40, 0.03)',
        'soft-lg': '0 12px 16px -4px rgba(16, 24, 40, 0.06), 0 4px 6px -2px rgba(16, 24, 40, 0.02)',
        'card-hover': '0 8px 24px -4px rgba(20, 36, 58, 0.08), 0 2px 6px -1px rgba(20, 36, 58, 0.04)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
}
