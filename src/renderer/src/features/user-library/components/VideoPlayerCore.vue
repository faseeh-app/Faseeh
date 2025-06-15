<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch, readonly } from 'vue'
import { AspectRatio } from '@renderer/common/components/ui/aspect-ratio'
import videojs from 'video.js'
import type Player from 'video.js/dist/types/player'
import 'video.js/dist/video-js.css'
import 'videojs-youtube'
import type { LibraryItem } from '@shared/types/types'
import { extractVideoSource } from '../utilities/video-extractor'

interface Props {
  libraryItem: LibraryItem
  theme?: 'default' | 'dark' | 'light'
  autoplay?: boolean
  showControls?: boolean
  fallbackVideoUrl?: string
}

const props = withDefaults(defineProps<Props>(), {
  theme: 'dark',
  autoplay: false,
  showControls: true,
  fallbackVideoUrl: 'https://www.youtube.com/watch?v=LXb3EKWsInQ'
})

interface Emits {
  playerReady: [player: Player]
  timeUpdate: [currentTime: number]
  play: []
  pause: []
}

const emit = defineEmits<Emits>()

// Core player refs
const videoPlayerRef = ref<HTMLVideoElement>()
const player = ref<Player>()

// Extract video URL from LibraryItem
const videoUrl = computed(() => {
  const source = extractVideoSource(props.libraryItem, props.fallbackVideoUrl)
  console.log('[VideoPlayerCore] Extracted video source:', source)
  console.log('[VideoPlayerCore] Using video URL:', source.url)
  return source.url
})

// Helper functions
function isYouTubeUrl(url: string): boolean {
  const youtubeRegex =
    /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)/
  return youtubeRegex.test(url)
}

function getVideoType(src: string): string {
  if (isYouTubeUrl(src)) {
    return 'video/youtube'
  }

  const extension = src.split('.').pop()?.toLowerCase()
  switch (extension) {
    case 'mp4':
      return 'video/mp4'
    case 'webm':
      return 'video/webm'
    case 'ogv':
      return 'video/ogg'
    case 'm3u8':
      return 'application/x-mpegURL'
    case 'mpd':
      return 'application/dash+xml'
    default:
      return 'video/mp4'
  }
}

// Video options for Video.js player
const videoOptions = computed(() => {
  const baseOptions = {
    controls: props.showControls,
    fluid: true,
    responsive: true,
    autoplay: props.autoplay,
    muted: false,
    playbackRates: [0.5, 1, 1.25, 1.5, 2],
    html5: {
      vhs: {
        overrideNative: true
      }
    },
    techOrder: ['youtube', 'html5'],
    preload: 'metadata'
  }

  const currentVideoUrl = videoUrl.value
  if (currentVideoUrl) {
    if (isYouTubeUrl(currentVideoUrl)) {
      return {
        ...baseOptions,
        sources: [{ src: currentVideoUrl, type: 'video/youtube' }],
        youtube: {
          ytControls: 0,
          rel: 0,
          showinfo: 0,
          modestbranding: 1,
          iv_load_policy: 3
        }
      }
    } else {
      return {
        ...baseOptions,
        sources: [{ src: currentVideoUrl, type: getVideoType(currentVideoUrl) }]
      }
    }
  }

  return baseOptions
})

// Theme class
const themeClass = computed(() => {
  switch (props.theme) {
    case 'dark':
      return 'vjs-theme-dark'
    case 'light':
      return 'vjs-theme-light'
    default:
      return ''
  }
})

// Initialize player
function initializePlayer() {
  if (!videoPlayerRef.value) return

  player.value = videojs(videoPlayerRef.value, videoOptions.value, () => {
    console.log('Video.js player is ready')
    emit('playerReady', player.value!)
  })

  // Set up event listeners
  player.value.on('play', () => emit('play'))
  player.value.on('pause', () => emit('pause'))
  player.value.on('timeupdate', () => {
    const currentTime = player.value!.currentTime() || 0
    emit('timeUpdate', currentTime)
  })
}

// Expose player controls
function play() {
  player.value?.play()
}

function pause() {
  player.value?.pause()
}

function seek(time: number) {
  player.value?.currentTime(time)
}

function setVolume(volume: number) {
  player.value?.volume(volume)
}

function toggleFullscreen() {
  if (player.value?.isFullscreen()) {
    player.value.exitFullscreen()
  } else {
    player.value?.requestFullscreen()
  }
}

// Expose methods to parent
defineExpose({
  play,
  pause,
  seek,
  setVolume,
  toggleFullscreen,
  player: readonly(player)
})

onMounted(() => {
  initializePlayer()
})

onBeforeUnmount(() => {
  if (player.value) {
    player.value.dispose()
  }
})

// Watch for video URL changes and reinitialize
watch(videoUrl, () => {
  if (player.value) {
    player.value.dispose()
    setTimeout(initializePlayer, 100)
  }
})
</script>

<template>
  <div class="video-player-core">
    <AspectRatio :ratio="16 / 9" class="w-full h-full">
      <div class="relative w-full h-full">
        <!-- Video.js Player -->
        <div data-vjs-player :class="['video-js-wrapper w-full h-full', themeClass]">
          <video
            ref="videoPlayerRef"
            class="video-js vjs-default-skin w-full h-full"
            preload="auto"
            data-setup="{}"
          >
            <p class="vjs-no-js">
              To view this video please enable JavaScript, and consider upgrading to a web browser
              that
              <a href="https://videojs.com/html5-video-support/" target="_blank"
                >supports HTML5 video</a
              >.
            </p>
          </video>
        </div>

        <!-- Slot for overlays (subtitles, controls, etc.) -->
        <slot />
      </div>
    </AspectRatio>
  </div>
</template>

<style>
/* Import Video.js styles */
@import 'video.js/dist/video-js.css';

/* Override Video.js icon font with local fonts */
@font-face {
  font-family: VideoJS;
  src:
    url('/fonts/VideoJS.woff') format('woff'),
    url('/fonts/VideoJS.ttf') format('truetype'),
    url('/fonts/VideoJS.svg#VideoJS') format('svg');
  font-weight: normal;
  font-style: normal;
}

/* Fix double icons by ensuring proper icon display */
.video-js .vjs-icon-placeholder:before {
  font-family: VideoJS, Arial, sans-serif;
  font-weight: normal;
  font-style: normal;
}

/* Unicode fallbacks if VideoJS font fails to load */
@supports not (font-family: VideoJS) {
  .video-js .vjs-big-play-button .vjs-icon-placeholder:before {
    content: '▶';
    font-family: Arial, sans-serif;
  }

  .video-js .vjs-play-control .vjs-icon-placeholder:before {
    content: '▶';
    font-family: Arial, sans-serif;
  }

  .video-js .vjs-play-control.vjs-playing .vjs-icon-placeholder:before {
    content: '⏸';
    font-family: Arial, sans-serif;
  }

  .video-js .vjs-volume-menu-button .vjs-icon-placeholder:before,
  .video-js .vjs-mute-control .vjs-icon-placeholder:before {
    content: '🔊';
    font-family: Arial, sans-serif;
  }

  .video-js .vjs-fullscreen-control .vjs-icon-placeholder:before {
    content: '⛶';
    font-family: Arial, sans-serif;
  }
}
</style>

<style scoped>
.video-player-core {
  width: 100%;
  height: 100%;
}
</style>
