import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
	],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        brand: {
          primary: 'var(--brand-primary)',
          'primary-hover': 'var(--brand-primary-hover)',
          secondary: 'var(--brand-secondary)',
          accent: 'var(--brand-accent)',
          'bg-body': 'var(--brand-bg-body)',
          'bg-card': 'var(--brand-bg-card)',
          'text-primary': 'var(--brand-text-primary)',
          'text-muted': 'var(--brand-text-muted)',
          border: 'var(--brand-border)',
          'muted-bg': 'var(--brand-muted-bg)',
          'hover-bg': 'var(--brand-hover-bg)',
          'sidebar-bg': 'var(--brand-sidebar-bg)',
          'sidebar-text': 'var(--brand-sidebar-text)',
          success: 'var(--brand-success)',
          warning: 'var(--brand-warning)',
          error: 'var(--brand-error)',
          gold: {
            DEFAULT: '#d2a859',
            light: '#e8c97a',
            dark: '#b8923a',
            50: '#f9f2e0',
            100: '#f5edd6',
            200: '#eddba8',
            300: '#e2c87a',
            400: '#d8b566',
            500: '#d2a859',
            600: '#b8923a',
            700: '#8a6e2d',
            800: '#5c4a20',
            900: '#2e2613',
          },
          gray: {
            50: '#f7f7f7',
            100: '#e6e6e6',
            200: '#c4c4c4',
            300: '#a3a3a3',
            400: '#7a7a7a',
            500: '#525252',
            600: '#3d3d3d',
            700: '#2c2c2c',
            800: '#242629',
            900: '#212429',
          },
        },
      },
      fontFamily: {
        heading: ['var(--brand-font-heading)', 'system-ui', 'sans-serif'],
        body: ['var(--brand-font-body)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
