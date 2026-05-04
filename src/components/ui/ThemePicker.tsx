import { useState, useRef, useEffect } from 'react'
import { useThemeStore, themeColors, type ThemeColor, type ThemeMode } from '@/stores/themeStore'
import { Palette, Sun, Moon, Monitor } from 'lucide-react'

const MODES: { key: ThemeMode; label: string; Icon: React.ElementType }[] = [
  { key: 'light',  label: 'Light',  Icon: Sun     },
  { key: 'dark',   label: 'Dark',   Icon: Moon    },
  { key: 'system', label: 'System', Icon: Monitor },
]

export default function ThemePicker() {
  const { color, mode, setColor, setMode } = useThemeStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const currentColor = themeColors[color]
  const isDark = document.documentElement.classList.contains('dark')

  return (
    <div ref={ref} style={{ position: 'relative' }}>

      {/* ── Trigger ── */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Theme"
        style={{
          width: 34, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: open ? 'var(--bg-hover)' : 'transparent',
          transition: 'background 0.15s',
          position: 'relative',
        }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
        onMouseLeave={e => { if (!open) e.currentTarget.style.backgroundColor = 'transparent' }}
      >
        {/* Live accent dot */}
        <div style={{
          position: 'absolute', top: 5, right: 5,
          width: 7, height: 7, borderRadius: '50%',
          backgroundColor: currentColor.primary,
          boxShadow: `0 0 6px 2px ${currentColor.primary}88`,
        }} />
        <Palette style={{ width: 16, height: 16, opacity: 0.55 }} />
      </button>

      {/* ── Panel ── */}
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 42, width: 264,
          borderRadius: 14, zIndex: 100, overflow: 'hidden',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          boxShadow: isDark
            ? '0 24px 60px rgba(0,0,0,0.6)'
            : '0 8px 40px rgba(0,0,0,0.14)',
        }}>

          {/* Header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: 7, flexShrink: 0,
              backgroundColor: currentColor.primary,
              boxShadow: `0 0 12px 3px ${currentColor.primary}66`,
            }} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 700 }}>Appearance</div>
              <div style={{ fontSize: 10, opacity: 0.4 }}>{currentColor.name} · {mode}</div>
            </div>
          </div>

          <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* ── Mode ── */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.35, marginBottom: 8 }}>
                Mode
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
                {MODES.map(({ key, label, Icon }) => {
                  const active = mode === key
                  return (
                    <button key={key} onClick={() => setMode(key)}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                        padding: '9px 4px', borderRadius: 8, border: 'none', cursor: 'pointer',
                        fontSize: 11, fontWeight: active ? 700 : 500,
                        transition: 'all 0.15s',
                        backgroundColor: active ? currentColor.primary : 'var(--bg-input)',
                        color: active ? '#fff' : 'inherit',
                        opacity: active ? 1 : 0.55,
                        boxShadow: active ? `0 0 14px 3px ${currentColor.primary}55` : 'none',
                      }}>
                      <Icon style={{ width: 14, height: 14 }} />
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ── Accent color ── */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.35, marginBottom: 10 }}>
                Accent color
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
                {(Object.entries(themeColors) as [ThemeColor, typeof themeColors[ThemeColor]][]).map(([key, theme]) => {
                  const active = color === key
                  return (
                    <button key={key} onClick={() => setColor(key)}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                        padding: '8px 4px', borderRadius: 8, border: 'none', cursor: 'pointer',
                        backgroundColor: active ? `${theme.primary}18` : 'transparent',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = 'var(--bg-hover)' }}
                      onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        backgroundColor: theme.primary,
                        transition: 'all 0.2s',
                        transform: active ? 'scale(1.18)' : 'scale(1)',
                        boxShadow: active
                          ? `0 0 0 2px var(--bg-card), 0 0 0 4px ${theme.primary}, 0 0 16px 4px ${theme.primary}55`
                          : `0 0 8px 1px ${theme.primary}44`,
                      }} />
                      <span style={{
                        fontSize: 10,
                        fontWeight: active ? 700 : 400,
                        opacity: active ? 1 : 0.5,
                      }}>
                        {theme.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
