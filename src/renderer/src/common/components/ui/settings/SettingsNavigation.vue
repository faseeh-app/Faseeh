<script setup lang="ts">
interface SettingsSection {
  name: string
  icon: string
  activeIcon: string
}

interface Props {
  sections: SettingsSection[]
  activeSection: string
}

interface Emits {
  sectionClick: [section: SettingsSection]
}

defineProps<Props>()
defineEmits<Emits>()
</script>

<template>
  <div class="faseeh-settings-dialog__mobile-nav">
    <select
      :value="activeSection"
      class="faseeh-settings-dialog__mobile-select"
      @change="
        $emit(
          'sectionClick',
          sections.find((s) => s.name === ($event.target as HTMLSelectElement).value)!
        )
      "
    >
      <option v-for="section in sections" :key="section.name" :value="section.name">
        {{ section.name }}
      </option>
    </select>
  </div>
</template>
