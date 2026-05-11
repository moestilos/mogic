import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#0A0A0F',
          elevated: '#13131A',
          surface: '#1C1C26',
        },
        border: { DEFAULT: '#2A2A38' },
        text: { hi: '#F5F5FA', lo: '#8B8B9E' },
        mana: {
          w: '#FFFAF0',
          u: '#4A9EFF',
          b: '#B57AFF',
          r: '#FF5A5A',
          g: '#4ADE80',
          c: '#C8C8D4',
        },
      },
      fontFamily: {
        display: ['Geist', 'Satoshi', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'neon-u': '0 0 40px rgba(74,158,255,0.35)',
        'neon-r': '0 0 40px rgba(255,90,90,0.35)',
        'neon-g': '0 0 40px rgba(74,222,128,0.35)',
        'neon-b': '0 0 40px rgba(181,122,255,0.35)',
      },
      backdropBlur: { glass: '20px' },
    },
  },
  plugins: [],
} satisfies Config;
