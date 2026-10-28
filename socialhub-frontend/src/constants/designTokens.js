/**
 * Design System Tokens
 * Single source of truth for colors, spacing, typography, animations
 */

export const colors = {
  // Primary palette
  primary: {
    50: '#f0f0ff',
    100: '#e1e0ff',
    200: '#c0c1ff',
    300: '#9fa0ff',
    400: '#6063ee',
    500: '#4648d4',
    600: '#2f2ebe',
    700: '#07006c',
    800: '#050058',
    900: '#000040',
  },
  // Secondary palette
  secondary: {
    50: '#f9f5ff',
    100: '#e9ddff',
    200: '#d0bcff',
    300: '#b8a3ff',
    400: '#8455ef',
    500: '#6b38d4',
    600: '#5516be',
    700: '#3e0022',
    800: '#310018',
    900: '#240010',
  },
  // Tertiary palette
  tertiary: {
    50: '#fff5fb',
    100: '#ffd9e4',
    200: '#ffb0cd',
    300: '#ff8ab5',
    400: '#d23284',
    500: '#b10e6b',
    600: '#8c0053',
    700: '#65003f',
    800: '#4a0032',
    900: '#330027',
  },
  // Neutral palette
  neutral: {
    50: '#f9f8ff',
    100: '#f2f3ff',
    200: '#dae2fd',
    300: '#c7c4d7',
    400: '#767586',
    500: '#464554',
    600: '#131b2e',
    700: '#0a0f1f',
    800: '#050812',
    900: '#000000',
  },
  // Status colors
  error: '#ba1a1a',
  success: '#16a34a',
  warning: '#f59e0b',
  info: '#0ea5e9',
}

export const spacing = {
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '1rem',       // 16px
  lg: '1.5rem',     // 24px
  xl: '2rem',       // 32px
  '2xl': '2.5rem',  // 40px
  '3xl': '3rem',    // 48px
}

export const borderRadius = {
  sm: '0.25rem',    // 4px
  md: '0.5rem',     // 8px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  full: '9999px',
}

export const typography = {
  // Display sizes
  display: {
    lg: { size: '3.5rem', weight: '800', lineHeight: '4rem' },
    md: { size: '2.25rem', weight: '700', lineHeight: '2.75rem' },
  },
  // Headline sizes
  headline: {
    lg: { size: '2rem', weight: '700', lineHeight: '2.5rem' },
    md: { size: '1.25rem', weight: '600', lineHeight: '1.75rem' },
    sm: { size: '1rem', weight: '600', lineHeight: '1.5rem' },
  },
  // Title size
  title: {
    md: { size: '1rem', weight: '600', lineHeight: '1.5rem' },
  },
  // Body sizes
  body: {
    lg: { size: '1.125rem', weight: '400', lineHeight: '1.75rem' },
    md: { size: '0.9375rem', weight: '400', lineHeight: '1.5rem' },
    sm: { size: '0.8125rem', weight: '400', lineHeight: '1.25rem' },
  },
  // Label sizes
  label: {
    md: { size: '0.875rem', weight: '600', lineHeight: '1.25rem' },
    sm: { size: '0.75rem', weight: '500', lineHeight: '1rem' },
  },
}

export const transitions = {
  fast: 'transition-all duration-150',
  normal: 'transition-all duration-200',
  slow: 'transition-all duration-300',
}

export const shadows = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',
}

export const breakpoints = {
  mobile: '320px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1280px',
  ultrawide: '1920px',
}

// Commonly used class combinations
export const utilities = {
  // Focus ring
  focusRing: 'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900',
  
  // Button base
  buttonBase: 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95',
  
  // Card/container
  card: 'rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm',
  
  // Input base
  inputBase: 'w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500',
  
  // Smooth scroll
  smoothScroll: 'scroll-smooth',
  
  // Truncate text
  truncate: 'truncate',
  lineClamp2: 'line-clamp-2',
  lineClamp3: 'line-clamp-3',
}

export default {
  colors,
  spacing,
  borderRadius,
  typography,
  transitions,
  shadows,
  breakpoints,
  utilities,
}
