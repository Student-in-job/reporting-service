const THEME_KEY = 'ps_theme'

export type ThemeMode = 'light' | 'dark'

const themeRef = useStorage<ThemeMode>(THEME_KEY, 'light')

export function useTheme() {
  function toggle() {
    themeRef.value = themeRef.value === 'light' ? 'dark' : 'light'
  }
  function set(mode: ThemeMode) {
    themeRef.value = mode
  }
  return {
    theme: themeRef,
    toggle,
    set,
  }
}
