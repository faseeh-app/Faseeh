<script setup lang="ts">
import { computed, shallowRef, watchEffect, ref } from 'vue'
import type {
  ContentBlock,
  TextBlock,
  ImageBlock,
  VideoBlock,
  AudioBlock,
  AnnotatedImageBlock,
  ContainerBlock
} from '@shared/types/types'
import type { Token } from '@shared/types/text-tokenizer-types'

interface Props {
  block: ContentBlock
  tokens: Map<string, Token[]>
  isTokenizing: Set<string>
}

interface Emits {
  tokenClick: [token: Token, block: TextBlock]
  assetUrl: [assetId: string]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Computed properties
const blockTokens = computed(() => props.tokens.get(props.block.id) || [])
const isBlockTokenizing = computed(() => props.isTokenizing.has(props.block.id))

// Stable block identifier for optimization
const stableBlockId = computed(() => `${props.block.id}-${props.block.type}`)

// Memoized token grouping for performance with more aggressive caching
const groupedTokensCache = new Map<string, Array<{ tokens: Token[]; isNonBreaking: boolean }>>()
const lastCacheKey = ref<string>('')

const groupedTokens = computed(() => {
  const tokens = blockTokens.value

  // Early return for empty tokens
  if (tokens.length === 0) {
    return []
  }

  // Create a cache key based on token content and block ID
  const cacheKey = `${stableBlockId.value}:${tokens.map((t) => `${t.text}:${t.isWord}`).join('|')}`
  // Skip computation if cache key hasn't changed
  if (cacheKey === lastCacheKey.value && groupedTokensCache.has(cacheKey)) {
    return groupedTokensCache.get(cacheKey)!
  }

  // Return cached result if available
  if (groupedTokensCache.has(cacheKey)) {
    lastCacheKey.value = cacheKey
    return groupedTokensCache.get(cacheKey)!
  }

  // Compute grouped tokens
  const groups = computeTokenGroups(tokens)

  // Cache the result
  groupedTokensCache.set(cacheKey, groups)
  lastCacheKey.value = cacheKey

  // Limit cache size to prevent memory leaks
  if (groupedTokensCache.size > 50) {
    // Reduced cache size for better memory management
    const firstKey = groupedTokensCache.keys().next().value
    if (firstKey) {
      groupedTokensCache.delete(firstKey)
    }
  }

  return groups
})

// Separated logic for better performance and readability
function computeTokenGroups(tokens: Token[]): Array<{ tokens: Token[]; isNonBreaking: boolean }> {
  if (tokens.length === 0) return []

  const groups: Array<{ tokens: Token[]; isNonBreaking: boolean }> = []
  let currentGroup: Token[] = []
  let isInHyphenatedWord = false

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    const nextToken = tokens[i + 1]
    const prevToken = tokens[i - 1]

    currentGroup.push(token)

    // Check if this is a hyphen between words or if we're building a hyphenated word
    const isHyphenBetweenWords =
      !token.isWord && token.text === '-' && prevToken?.isWord && nextToken?.isWord
    const isPartOfHyphenatedWord = isInHyphenatedWord || isHyphenBetweenWords

    // Continue building the group if this is part of a hyphenated word
    if (isPartOfHyphenatedWord) {
      isInHyphenatedWord = true
      continue
    }

    // End the current group if we're not in a hyphenated word anymore
    if (isInHyphenatedWord && token.isWord) {
      isInHyphenatedWord = false
    }

    // Finalize the current group
    groups.push({
      tokens: [...currentGroup],
      isNonBreaking: currentGroup.length > 1
    })
    currentGroup = []
  }

  // Add any remaining tokens
  if (currentGroup.length > 0) {
    groups.push({
      tokens: currentGroup,
      isNonBreaking: currentGroup.length > 1
    })
  }

  return groups
}

// Style helpers
function getTextBlockClass(block: TextBlock): string {
  switch (block.style) {
    case 'h1':
    case 'heading1':
      return 'faseeh-content-block__text--h1'
    case 'h2':
    case 'heading2':
      return 'faseeh-content-block__text--h2'
    case 'h3':
    case 'heading3':
      return 'faseeh-content-block__text--h3'
    case 'h4':
    case 'heading4':
      return 'faseeh-content-block__text--h3' // Reuse h3 for h4-h6
    case 'h5':
    case 'heading5':
      return 'faseeh-content-block__text--h3'
    case 'h6':
    case 'heading6':
      return 'faseeh-content-block__text--h3'
    case 'caption':
      return 'faseeh-content-block__text--caption'
    case 'li':
      return 'faseeh-content-block__text--paragraph ml-6 list-item'
    case 'quote':
    case 'blockquote':
      return 'faseeh-content-block__text--quote'
    default:
      return 'faseeh-content-block__text--paragraph'
  }
}

function getContainerClass(block: ContainerBlock): string {
  switch (block.style) {
    case 'section':
      return 'faseeh-content-block__container--section'
    case 'panel':
      return 'faseeh-content-block__container--panel'
    case 'figure':
      return 'faseeh-content-block__container text-center'
    default:
      return 'faseeh-content-block__container'
  }
}

// Event handlers
function handleTokenClick(token: Token) {
  if (props.block.type === 'text') {
    emit('tokenClick', token, props.block as TextBlock)
  }
}

function getAssetUrl(assetId: string): string {
  emit('assetUrl', assetId)
  return `asset://${assetId}` // Fallback URL
}
</script>

<template>
  <div class="content-block" :data-block-id="block.id" :data-order="block.order">
    <!-- Text Block -->
    <div v-if="block.type === 'text'" :class="getTextBlockClass(block as TextBlock)">
      <!-- Show tokenized interactive text if available -->
      <template v-if="blockTokens.length > 0">
        <span
          v-for="(group, groupIndex) in groupedTokens"
          :key="`group-${groupIndex}`"
          :class="{ 'token-group-no-break': group.isNonBreaking }"
        >
          <span
            v-for="(token, tokenIndex) in group.tokens"
            :key="`token-${groupIndex}-${tokenIndex}`"
            :class="['interactive-token', token.isWord ? 'is-word' : 'is-punctuation']"
            :title="`${token.text} (${token.isWord ? 'word' : 'punctuation'})`"
            @click="handleTokenClick(token)"
          >
            {{ token.text }}
          </span>
        </span>
      </template>
      <!-- Fallback for non-tokenized text or while tokenizing -->
      <template v-else>
        <span v-if="isBlockTokenizing" class="faseeh-content-block__loading"> Tokenizing... </span>
        <span v-else class="faseeh-content-block__non-interactive">
          {{ (block as TextBlock).content }}
        </span>
      </template>
    </div>

    <!-- Image Block -->
    <figure v-else-if="block.type === 'image'" class="faseeh-content-block__image">
      <img
        :src="
          (block as ImageBlock).assetId
            ? getAssetUrl((block as ImageBlock).assetId!)
            : (block as ImageBlock).externalSrc
        "
        :alt="(block as ImageBlock).alt || ''"
        class="faseeh-content-block__image-element"
        loading="lazy"
      />
      <figcaption v-if="(block as ImageBlock).caption" class="faseeh-content-block__figcaption">
        {{ (block as ImageBlock).caption }}
      </figcaption>
    </figure>

    <!-- Video Block -->
    <figure v-else-if="block.type === 'video'" class="faseeh-content-block__video">
      <div class="faseeh-content-block__video-container">
        <video
          v-if="(block as VideoBlock).assetId || (block as VideoBlock).externalSrc"
          :src="
            (block as VideoBlock).assetId
              ? getAssetUrl((block as VideoBlock).assetId!)
              : (block as VideoBlock).externalSrc
          "
          controls
          class="w-full h-full object-cover"
        >
          Your browser does not support the video tag.
        </video>
        <div v-else class="flex items-center justify-center h-full text-gray-500">
          <span>Video not available</span>
        </div>
      </div>
    </figure>

    <!-- Audio Block -->
    <figure v-else-if="block.type === 'audio'" class="audio-block mb-6">
      <audio
        v-if="(block as AudioBlock).assetId || (block as AudioBlock).externalSrc"
        :src="
          (block as AudioBlock).assetId
            ? getAssetUrl((block as AudioBlock).assetId!)
            : (block as AudioBlock).externalSrc
        "
        controls
        class="w-full max-w-md mx-auto"
      >
        Your browser does not support the audio element.
      </audio>
      <div v-else class="text-center text-gray-500 py-4">Audio not available</div>
    </figure>

    <!-- Annotated Image Block -->
    <figure v-else-if="block.type === 'annotatedImage'" class="annotated-image-block mb-6">
      <div class="relative inline-block">
        <img
          :src="getAssetUrl((block as AnnotatedImageBlock).baseImageAssetId)"
          alt="Annotated image"
          class="max-w-full h-auto rounded-lg shadow-md"
          loading="lazy"
        />

        <!-- Text annotations overlay -->
        <div
          v-for="annotation in (block as AnnotatedImageBlock).annotations"
          :key="annotation.id"
          class="absolute annotation-overlay"
          :style="{
            left: `${annotation.boundingBox.x}${annotation.boundingBox.unit}`,
            top: `${annotation.boundingBox.y}${annotation.boundingBox.unit}`,
            width: `${annotation.boundingBox.width}${annotation.boundingBox.unit}`,
            height: `${annotation.boundingBox.height}${annotation.boundingBox.unit}`
          }"
        >
          <div
            class="annotation-text bg-black/75 text-white text-xs p-1 rounded opacity-0 hover:opacity-100 transition-opacity"
          >
            {{ annotation.text }}
          </div>
        </div>
      </div>
    </figure>

    <!-- Container Block -->
    <div v-else-if="block.type === 'container'" :class="getContainerClass(block as ContainerBlock)">
      <ContentBlockRenderer
        v-for="childBlock in (block as ContainerBlock).children"
        :key="childBlock.id"
        :block="childBlock"
        :tokens="tokens"
        :is-tokenizing="isTokenizing"
        @token-click="(token: Token, block: TextBlock) => $emit('tokenClick', token, block)"
        @asset-url="(assetId: string) => $emit('assetUrl', assetId)"
      />
    </div>
    <!-- Unknown Block Type -->
    <div v-else class="unknown-block bg-yellow-50 border border-yellow-200 rounded p-4 mb-4">
      <p class="text-yellow-800 font-medium">Unknown block type: {{ (block as any).type }}</p>
      <pre class="text-xs text-yellow-600 mt-2 overflow-auto">{{
        JSON.stringify(block, null, 2)
      }}</pre>
    </div>
  </div>
</template>
