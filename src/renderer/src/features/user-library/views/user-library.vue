<script setup lang="ts">
// Changed to script setup
import SearchBar from '@/common/components/ui/SearchBar.vue'
import VDivider from '@/common/components/ui/dividers/VDivider.vue'
import HDivider from '@/common/components/ui/dividers/HDivider.vue'
import SortMenu from '@/common/components/ui/SortMenu.vue'
import { Button } from '@/common/components/ui/button'
import AspectRatio from '@/common/components/ui/aspect-ratio/AspectRatio.vue'
import ScrollArea from '@/common/components/ui/scroll-area/ScrollArea.vue'
import LanguageFilter from '../components/filters/LanguageFilter.vue'
</script>
<template>
  <div class="flex flex-col">
    <div class="flex items-center py-3 px-6 space-x-1.5">
      <SearchBar />
      <SortMenu />
      <VDivider />
      <Button class="">
        <span class="icon-[solar--import-bold-duotone] size-7" />
        Import
      </Button>
    </div>
    <div class="flex p-4 space-x-1.5">
      <LanguageFilter />
    </div>
    <HDivider />
    <ScrollArea class="flex-grow h-1">
      <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 p-1 gap-1"
      >
        <AspectRatio v-for="i in 10" :key="i" :ratio="16 / 9" class="flex">
          <div class="bg-card flex-grow rounded-md"></div>
        </AspectRatio>
      </div>
    </ScrollArea>
  </div>
</template>
