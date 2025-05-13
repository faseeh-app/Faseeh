<script lang="ts" setup>
import { Button } from '@/common/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/common/components/ui/dropdown-menu'
import { ref } from 'vue'

const sortOption = ref('bottom')

const sortOptions = [
    {
        value: 'alphabetical',
        label: 'A-Z',
        icon: 'icon-[iconamoon--sort-asc-bold]',
        handler: () => {
        }
    },
    {
        value: 'reverse-alphabetical',
        label: 'Z-A',
        icon: 'icon-[iconamoon--sort-desc-bold]',
        handler: () => {
        }
    },
    {
        value: 'recently-added',
        label: 'Recently Added',
        icon: 'icon-[iconamoon--clock-bold]',
        handler: () => {
        }
    },
    {
        value: 'recently-modified',
        label: 'Recently Modified',
        icon: 'icon-[iconamoon--clock-bold]',
        handler: () => {
        }
    },
]

</script>

<template>
    <DropdownMenu>
        <DropdownMenuTrigger as-child>
            <Button variant="outline" size="icon">
                <span class="size-5 icon-[solar--sort-from-bottom-to-top-bold]" />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="">
            <DropdownMenuRadioGroup v-model="sortOption">
                <DropdownMenuRadioItem v-for="option in sortOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                </DropdownMenuRadioItem>

            </DropdownMenuRadioGroup>
        </DropdownMenuContent>
    </DropdownMenu>
</template>