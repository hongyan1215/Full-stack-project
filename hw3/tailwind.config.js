/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
  	extend: {
  		fontFamily: {
  			display: [
  				'Playfair Display',
  				'serif'
  			],
  			sans: [
  				'Inter',
  				'ui-sans-serif',
  				'system-ui'
  			]
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			rose: '#F6C1C7',
  			latte: '#EBDAC8',
  			matcha: '#CDE6C5',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			xl: '1rem',
  			'2xl': '1.25rem',
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		boxShadow: {
  			soft: '0 10px 30px rgba(0,0,0,0.2)'
  		},
  		backgroundImage: {
  			'gradient-glass': 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
			'gradient-bg': 'linear-gradient(180deg, #14161a 0%, #262a31 100%)'
  		}
  	}
  },
  plugins: [
    require("tailwindcss-animate"),
    function({ addUtilities, addVariant }) {
      const newUtilities = {
        '.elev-1': { boxShadow: 'var(--elev-1)' },
        '.elev-2': { boxShadow: 'var(--elev-2)' },
        '.elev-3': { boxShadow: 'var(--elev-3)' },
        '.elev-4': { boxShadow: 'var(--elev-4)' },
        '.drop-rose': { filter: 'drop-shadow(0 4px 10px rgba(246,193,199,0.25))' },
        '.drop-matcha': { filter: 'drop-shadow(0 4px 10px rgba(205,230,197,0.22))' },
      };
      addUtilities(newUtilities);
    }
  ],
};


