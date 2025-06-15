import { ref } from 'vue'

const panelWidth = ref(300)
const isPanelOpen = ref(false)

export function usePanelState() {
  const togglePanel = () => {
    isPanelOpen.value = !isPanelOpen.value
  }

  const setPanelWidth = (width: number) => {
    panelWidth.value = width
  }

  return {
    panelWidth,
    isPanelOpen,
    togglePanel,
    setPanelWidth
  }
}
