/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  	extend: {
      fontFamily: {
        sans: ['Oxanium', 'sans-serif'],
        iceland: ['Iceland', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
      animation: {
        gradient: 'gradient 3s linear infinite',
        slideDown: 'slideDown 0.2s ease-out',
        slideUp: 'slideUp 0.2s ease-out',
        electricBorder: 'electricBorder 3s linear infinite',
        'glitch-after': 'glitch var(--after-duration) infinite linear alternate-reverse',
        'glitch-before': 'glitch var(--before-duration) infinite linear alternate-reverse',
      },
      keyframes: {
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        slideDown: {
          from: { height: 0, opacity: 0 },
          to: { height: 'var(--radix-collapsible-content-height)', opacity: 1 },
        },
        slideUp: {
          from: { height: 'var(--radix-collapsible-content-height)', opacity: 1 },
          to: { height: 0, opacity: 0 },
        },
        electricBorder: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '400% 50%' },
        },
        glitch: {
          '0%': { clipPath: 'inset(20% 0 50% 0)' },
          '5%': { clipPath: 'inset(10% 0 60% 0)' },
          '10%': { clipPath: 'inset(15% 0 55% 0)' },
          '15%': { clipPath: 'inset(25% 0 35% 0)' },
          '20%': { clipPath: 'inset(30% 0 40% 0)' },
          '25%': { clipPath: 'inset(40% 0 20% 0)' },
          '30%': { clipPath: 'inset(10% 0 60% 0)' },
          '35%': { clipPath: 'inset(15% 0 55% 0)' },
          '40%': { clipPath: 'inset(25% 0 35% 0)' },
          '45%': { clipPath: 'inset(30% 0 40% 0)' },
          '50%': { clipPath: 'inset(20% 0 50% 0)' },
          '55%': { clipPath: 'inset(10% 0 60% 0)' },
          '60%': { clipPath: 'inset(15% 0 55% 0)' },
          '65%': { clipPath: 'inset(25% 0 35% 0)' },
          '70%': { clipPath: 'inset(30% 0 40% 0)' },
          '75%': { clipPath: 'inset(40% 0 20% 0)' },
          '80%': { clipPath: 'inset(20% 0 50% 0)' },
          '85%': { clipPath: 'inset(10% 0 60% 0)' },
          '90%': { clipPath: 'inset(15% 0 55% 0)' },
          '95%': { clipPath: 'inset(25% 0 35% 0)' },
          '100%': { clipPath: 'inset(30% 0 40% 0)' },
        },
      },
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
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
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
