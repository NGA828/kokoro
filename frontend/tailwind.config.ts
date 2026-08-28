import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0a0710',
          900: '#0f0a1a',
          850: '#150f24',
          800: '#1b1430',
          700: '#251b42',
          600: '#33255a',
        },
        rose: {
          300: '#ff9ec6',
          400: '#ff6fae',
          500: '#ff3d8f',
          600: '#ec2a7c',
        },
        magenta: {
          400: '#e049c9',
          500: '#c92bb0',
        },
        violet2: {
          300: '#c9a7ff',
          400: '#a875ff',
          500: '#8b4dff',
          600: '#7131e8',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 40px -8px rgba(255, 61, 143, 0.45)',
        'glow-violet': '0 0 40px -8px rgba(139, 77, 255, 0.5)',
        card: '0 20px 60px -20px rgba(0,0,0,0.7)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #ff3d8f 0%, #c92bb0 45%, #8b4dff 100%)',
        'brand-gradient-soft': 'linear-gradient(135deg, rgba(255,61,143,0.18), rgba(139,77,255,0.18))',
        'radial-glow': 'radial-gradient(ellipse at top, rgba(139,77,255,0.18), transparent 60%)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      keyframes: {
        'float-slow': {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'heart-pop': {
          '0%': { transform: 'scale(0) rotate(-20deg)', opacity: '0' },
          '60%': { transform: 'scale(1.15) rotate(6deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0)', opacity: '1' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'float-slow': 'float-slow 6s ease-in-out infinite',
        'heart-pop': 'heart-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
      },
    },
  },
  plugins: [],
};
export default config;
