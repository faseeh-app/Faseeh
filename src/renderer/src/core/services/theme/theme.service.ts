import { reactive, computed } from 'vue'

export type Theme = 'light' | 'dark' | 'auto'

interface ThemeStore {
  theme: Theme
}

class ThemeService {
  private store = reactive<ThemeStore>({
    theme: 'dark' // Default theme
  })

  constructor() {
    this.loadTheme()
    this.applyTheme()

    // Watch for system theme changes when in auto mode
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', () => {
        if (this.store.theme === 'auto') {
          this.applyTheme()
        }
      })
    }
  }

  get currentTheme() {
    return computed(() => this.store.theme)
  }

  get effectiveTheme() {
    return computed(() => {
      if (this.store.theme === 'auto') {
        return this.getSystemTheme()
      }
      return this.store.theme
    })
  }

  setTheme(theme: Theme) {
    this.store.theme = theme
    this.saveTheme()
    this.applyTheme()
  }

  private getSystemTheme(): 'light' | 'dark' {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
    return 'light'
  }

  private applyTheme() {
    const effectiveTheme = this.store.theme === 'auto' ? this.getSystemTheme() : this.store.theme
    document.documentElement.setAttribute('data-theme', effectiveTheme)
  }

  private saveTheme() {
    try {
      localStorage.setItem('faseeh-theme', this.store.theme)
    } catch (error) {
      console.warn('Failed to save theme preference:', error)
    }
  }

  private loadTheme() {
    try {
      const savedTheme = localStorage.getItem('faseeh-theme') as Theme
      if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
        this.store.theme = savedTheme
      }
    } catch (error) {
      console.warn('Failed to load theme preference:', error)
    }
  }
}

// Create singleton instance
export const themeService = new ThemeService()
