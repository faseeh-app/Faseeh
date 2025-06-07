// Composable for managing tab-specific state
import { computed, inject, provide, Ref } from 'vue'
import { useTabStore } from '@renderer/common/stores/useTabStore'

// Injection key for current tab ID
export const TAB_ID_KEY = Symbol('tabId')

// Composable for managing tab-specific state
export function useTabState<T>(
  key: string,
  defaultValue: T
): {
  state: Ref<T>
  setState: (value: T) => void
  clearState: () => void
  hasState: Ref<boolean>
  tabId: Ref<string>
}
export function useTabState<T>(key: string): {
  state: Ref<T | undefined>
  setState: (value: T) => void
  clearState: () => void
  hasState: Ref<boolean>
  tabId: Ref<string>
}
export function useTabState<T>(key: string, defaultValue?: T) {
  const tabStore = useTabStore()

  // Get current tab ID from context (injected by router or tab component)
  const currentTabId = inject<Ref<string>>(TAB_ID_KEY) || computed(() => tabStore.activeTabId)

  // Reactive getter for the state value
  const state = computed({
    get() {
      const value = tabStore.getTabState(currentTabId.value, key)
      if (value !== undefined) {
        return value
      }
      // If defaultValue was provided, return it; otherwise return undefined
      return defaultValue
    },
    set(value: T) {
      tabStore.setTabState(currentTabId.value, key, value)
    }
  })

  // Helper functions
  const setState = (value: T) => {
    tabStore.setTabState(currentTabId.value, key, value)
  }

  const clearState = () => {
    tabStore.clearTabState(currentTabId.value, key)
  }

  const hasState = computed(() => {
    return tabStore.getTabState(currentTabId.value, key) !== undefined
  })

  return {
    state,
    setState,
    clearState,
    hasState,
    tabId: currentTabId
  }
}

// Composable for managing multiple tab state keys
export function useTabStateManager() {
  const tabStore = useTabStore()
  const currentTabId = inject<Ref<string>>(TAB_ID_KEY) || computed(() => tabStore.activeTabId)

  const getState = <T>(key: string): T | undefined => {
    return tabStore.getTabState(currentTabId.value, key)
  }

  const setState = <T>(key: string, value: T) => {
    tabStore.setTabState(currentTabId.value, key, value)
  }

  const updateState = (updates: Record<string, any>) => {
    tabStore.updateTabState(currentTabId.value, updates)
  }

  const clearState = (key?: string) => {
    tabStore.clearTabState(currentTabId.value, key)
  }

  const getAllState = () => {
    return tabStore.getTabState(currentTabId.value)
  }

  return {
    getState,
    setState,
    updateState,
    clearState,
    getAllState,
    tabId: currentTabId
  }
}

// Provider component for tab context
export function provideTabId(tabId: string) {
  provide(
    TAB_ID_KEY,
    computed(() => tabId)
  )
}
