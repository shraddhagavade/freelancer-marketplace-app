/** @type {import('tailwindcss').Config} */

/*
 * Design tokens adapted from the Volvo Group "Kingbolt" design system
 * (public-charging-fe). Enterprise light theme: neutral grey ramp,
 * blue accent, 8px spacing grid, small radii, flat surfaces with
 * subtle dividers instead of heavy shadows, ~14px base font.
 */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Volvo brand uses "Volvo Novum"; fall back to a clean system sans.
        sans: ['"Volvo Novum"', '"Helvetica Neue"', 'Arial', 'system-ui', 'sans-serif'],
        display: ['"Volvo Novum"', '"Helvetica Neue"', 'Arial', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Kingbolt neutral grey ramp (StaticColors from lib/utils.ts)
        grey: {
          1: '#E6E6E6',
          2: '#CCCCCC',
          3: '#B3B3B3',
          4: '#999999',
          5: '#808080',
          6: '#666666',
          7: '#4D4D4D',
          8: '#333333',
          9: '#1A1A1A',
        },
        // Semantic brand tokens
        brand: {
          // Blue accent family (links / primary / interactive)
          primary: '#2A609D',
          primaryDark: '#1F4A79',
          primaryLight: '#1976D2',
          // Surfaces
          surface: '#FFFFFF',
          canvas: '#F7F8FA',
          // Text
          ink: '#1A1A1A',
          muted: '#666666',
          disabled: '#B3B3B3',
          // Lines & states
          divider: '#D0D0D0',
          border: '#CCCCCC',
          hover: '#EDF1F8',
          selected: '#E3E3E3',
          accentBorder: '#ACCAE8',
        },
        // Standard MUI-style semantic roles
        status: {
          info: '#1976D2',
          success: '#2E7D32',
          warning: '#ED6C02',
          error: '#D32F2F',
        },
      },
      fontSize: {
        // Body ~14px / line-height 24px / letter-spacing 0.1px (Kingbolt body)
        base: ['14px', { lineHeight: '24px', letterSpacing: '0.1px' }],
        'page-title': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'section-title': ['18px', { lineHeight: '28px', fontWeight: '600' }],
        hero: ['40px', { lineHeight: '48px', fontWeight: '600' }],
      },
      spacing: {
        // 8px grid helpers
        '1.5': '6px',
        '18': '4.5rem',
        '22': '5.5rem',
      },
      borderRadius: {
        // Crisp, subtle rounding (MUI default ~4px)
        DEFAULT: '4px',
        sm: '2px',
        md: '4px',
        lg: '8px',
        xl: '12px',
      },
      boxShadow: {
        // Light elevation - overlays/menus only
        card: '0 1px 2px rgba(0,0,0,0.06)',
        drawer: '-4px 0 16px rgba(0,0,0,0.12)',
        menu: '0 4px 16px rgba(0,0,0,0.12)',
      },
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      maxWidth: {
        content: '1440px',
      },
    },
  },
  plugins: [],
}
