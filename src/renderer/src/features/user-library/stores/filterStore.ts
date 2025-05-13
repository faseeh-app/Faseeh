import { defineStore } from 'pinia'

// interface FilterOption {
//   value: string // Empty string "" can be used for a "reset" or "none" option
//   label: string
//   icon?: string
// }

export const LibraryFilterStore = defineStore('LibraryFilterStore', {
  state: () => ({
    Language: undefined as string | undefined
  }),

  getters: {
    LanguageLabel: (state) => state.Language ?? 'All',
    isLangugaeFiltered: (state) => state.Language !== undefined,
    isLanguageSelected: (state) => (lang: string) => {
      return state.Language === lang
    }
  },

  actions: {
    setLanguage(lang: string | undefined) {
      this.Language = lang
    }
  }
})
