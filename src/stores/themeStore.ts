import { create } from 'zustand'

export type ThemeColor = 'blue' | 'teal' | 'purple' | 'orange' | 'rose' | 'emerald' | 'slate'
export type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeState {
  color: ThemeColor
  mode: ThemeMode
  setColor: (color: ThemeColor) => void
  setMode: (mode: ThemeMode) => void
  initTheme: () => void
}

export const themeColors: Record<ThemeColor, { name: string; primary: string; preview: string }> = {
  blue:    { name: 'Blue',    primary: '#156cf5', preview: 'bg-blue-500' },
  teal:    { name: 'Teal',    primary: '#0d9488', preview: 'bg-teal-500' },
  purple:  { name: 'Purple',  primary: '#7c3aed', preview: 'bg-purple-500' },
  orange:  { name: 'Orange',  primary: '#ea580c', preview: 'bg-orange-500' },
  rose:    { name: 'Rose',    primary: '#e11d48', preview: 'bg-rose-500' },
  emerald: { name: 'Emerald', primary: '#059669', preview: 'bg-emerald-500' },
  slate:   { name: 'Slate',   primary: '#475569', preview: 'bg-slate-500' },
}

const colorVars: Record<ThemeColor, Record<string, string>> = {
  blue: {
    '--brand-50': '#eff6ff', '--brand-100': '#dbeafe', '--brand-200': '#bfdbfe',
    '--brand-300': '#93c5fd', '--brand-400': '#60a5fa', '--brand-500': '#3b82f6',
    '--brand-600': '#2563eb', '--brand-700': '#1d4ed8', '--brand-800': '#1e40af',
    '--brand-900': '#1e3a8a', '--brand-950': '#172554',
  },
  teal: {
    '--brand-50': '#f0fdfa', '--brand-100': '#ccfbf1', '--brand-200': '#99f6e4',
    '--brand-300': '#5eead4', '--brand-400': '#2dd4bf', '--brand-500': '#14b8a6',
    '--brand-600': '#0d9488', '--brand-700': '#0f766e', '--brand-800': '#115e59',
    '--brand-900': '#134e4a', '--brand-950': '#042f2e',
  },
  purple: {
    '--brand-50': '#faf5ff', '--brand-100': '#f3e8ff', '--brand-200': '#e9d5ff',
    '--brand-300': '#d8b4fe', '--brand-400': '#c084fc', '--brand-500': '#a855f7',
    '--brand-600': '#9333ea', '--brand-700': '#7e22ce', '--brand-800': '#6b21a8',
    '--brand-900': '#581c87', '--brand-950': '#3b0764',
  },
  orange: {
    '--brand-50': '#fff7ed', '--brand-100': '#ffedd5', '--brand-200': '#fed7aa',
    '--brand-300': '#fdba74', '--brand-400': '#fb923c', '--brand-500': '#f97316',
    '--brand-600': '#ea580c', '--brand-700': '#c2410c', '--brand-800': '#9a3412',
    '--brand-900': '#7c2d12', '--brand-950': '#431407',
  },
  rose: {
    '--brand-50': '#fff1f2', '--brand-100': '#ffe4e6', '--brand-200': '#fecdd3',
    '--brand-300': '#fda4af', '--brand-400': '#fb7185', '--brand-500': '#f43f5e',
    '--brand-600': '#e11d48', '--brand-700': '#be123c', '--brand-800': '#9f1239',
    '--brand-900': '#881337', '--brand-950': '#4c0519',
  },
  emerald: {
    '--brand-50': '#ecfdf5', '--brand-100': '#d1fae5', '--brand-200': '#a7f3d0',
    '--brand-300': '#6ee7b7', '--brand-400': '#34d399', '--brand-500': '#10b981',
    '--brand-600': '#059669', '--brand-700': '#047857', '--brand-800': '#065f46',
    '--brand-900': '#064e3b', '--brand-950': '#022c22',
  },
  slate: {
    '--brand-50': '#f8fafc', '--brand-100': '#f1f5f9', '--brand-200': '#e2e8f0',
    '--brand-300': '#cbd5e1', '--brand-400': '#94a3b8', '--brand-500': '#64748b',
    '--brand-600': '#475569', '--brand-700': '#334155', '--brand-800': '#1e293b',
    '--brand-900': '#0f172a', '--brand-950': '#020617',
  },
}

function applyThemeColor(color: ThemeColor) {
  const vars = colorVars[color]
  const root = document.documentElement
  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })

  const isDark = root.classList.contains('dark')

  if (isDark) {
    root.style.setProperty('--bg-page', vars['--brand-950'])
    root.style.setProperty('--bg-sidebar', `color-mix(in srgb, ${vars['--brand-950']} 70%, #111827)`)
    root.style.setProperty('--bg-card', `color-mix(in srgb, ${vars['--brand-900']} 30%, #111827)`)
    root.style.setProperty('--bg-header', `color-mix(in srgb, ${vars['--brand-950']} 80%, #111827)`)
  } else {
    root.style.setProperty('--bg-page', `color-mix(in srgb, ${vars['--brand-50']} 50%, #f9fafb)`)
    root.style.setProperty('--bg-sidebar', `color-mix(in srgb, ${vars['--brand-50']} 20%, #ffffff)`)
    root.style.setProperty('--bg-card', '#ffffff')
    root.style.setProperty('--bg-header', `color-mix(in srgb, ${vars['--brand-50']} 15%, #ffffff)`)
  }
}

function applyThemeMode(mode: ThemeMode) {
  const root = document.documentElement
  if (mode === 'dark') {
    root.classList.add('dark')
  } else if (mode === 'light') {
    root.classList.remove('dark')
  } else {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }
  // Re-apply color to update backgrounds for new mode
  const color = (localStorage.getItem('theme-color') as ThemeColor) || 'blue'
  applyThemeColor(color)
}

export const useThemeStore = create<ThemeState>((set) => ({
  color: (localStorage.getItem('theme-color') as ThemeColor) || 'blue',
  mode: (localStorage.getItem('theme-mode') as ThemeMode) || 'dark',

  setColor: (color) => {
    localStorage.setItem('theme-color', color)
    applyThemeColor(color)
    set({ color })
  },

  setMode: (mode) => {
    localStorage.setItem('theme-mode', mode)
    applyThemeMode(mode)
    set({ mode })
  },

  initTheme: () => {
    const color = (localStorage.getItem('theme-color') as ThemeColor) || 'blue'
    const mode = (localStorage.getItem('theme-mode') as ThemeMode) || 'dark'
    applyThemeMode(mode)
    applyThemeColor(color)
    set({ color, mode })
  },
}))