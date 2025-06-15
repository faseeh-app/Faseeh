import { ref, computed, type Ref } from 'vue'
import type Player from 'video.js/dist/types/player'

export interface SubtitleCue {
  id: string
  start: number
  end: number
  text: string
  words: SubtitleWord[]
}

export interface SubtitleWord {
  id: string
  text: string
  start: number
  end: number
  confidence?: number
}

export interface VideoPlayerState {
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  playbackRate: number
  isFullscreen: boolean
  isLoading: boolean
  error: string | null
}

export interface VideoPlayerOptions {
  autoplay?: boolean
  muted?: boolean
  loop?: boolean
  preload?: 'auto' | 'metadata' | 'none'
  playbackRates?: number[]
  enableHotkeys?: boolean
  enablePictureInPicture?: boolean
}

export function useVideoPlayer(options: VideoPlayerOptions = {}) {
  const player = ref<Player>()
  const state = ref<VideoPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    playbackRate: 1,
    isFullscreen: false,
    isLoading: false,
    error: null
  })

  const subtitles = ref<SubtitleCue[]>([])
  const currentSubtitle = ref<SubtitleCue | null>(null)

  // Computed properties
  const progress = computed(() => {
    if (state.value.duration === 0) return 0
    return (state.value.currentTime / state.value.duration) * 100
  })

  const formattedCurrentTime = computed(() => formatTime(state.value.currentTime))
  const formattedDuration = computed(() => formatTime(state.value.duration))

  // Player control methods
  function play() {
    return player.value?.play()
  }

  function pause() {
    player.value?.pause()
  }

  function toggle() {
    if (state.value.isPlaying) {
      pause()
    } else {
      play()
    }
  }

  function seek(time: number) {
    if (player.value) {
      player.value.currentTime(time)
    }
  }

  function seekByPercent(percent: number) {
    const time = (percent / 100) * state.value.duration
    seek(time)
  }

  function setVolume(volume: number) {
    const clampedVolume = Math.max(0, Math.min(1, volume))
    if (player.value) {
      player.value.volume(clampedVolume)
      state.value.volume = clampedVolume
    }
  }

  function mute() {
    player.value?.muted(true)
  }

  function unmute() {
    player.value?.muted(false)
  }

  function toggleMute() {
    if (player.value) {
      player.value.muted(!player.value.muted())
    }
  }

  function setPlaybackRate(rate: number) {
    if (player.value) {
      player.value.playbackRate(rate)
      state.value.playbackRate = rate
    }
  }

  function enterFullscreen() {
    return player.value?.requestFullscreen()
  }

  function exitFullscreen() {
    return player.value?.exitFullscreen()
  }

  function toggleFullscreen() {
    if (state.value.isFullscreen) {
      exitFullscreen()
    } else {
      enterFullscreen()
    }
  }
  function enterPictureInPicture() {
    if (options.enablePictureInPicture && player.value) {
      return player.value.requestPictureInPicture?.() || Promise.resolve()
    }
    return Promise.resolve()
  }

  function skipForward(seconds = 10) {
    seek(state.value.currentTime + seconds)
  }

  function skipBackward(seconds = 10) {
    seek(state.value.currentTime - seconds)
  }

  // Subtitle methods
  function loadSubtitles(subtitleData: SubtitleCue[]) {
    subtitles.value = subtitleData
  }

  function getCurrentSubtitle(time?: number): SubtitleCue | null {
    const currentTime = time ?? state.value.currentTime
    return subtitles.value.find((cue) => currentTime >= cue.start && currentTime <= cue.end) || null
  }

  function seekToWord(word: SubtitleWord) {
    seek(word.start)
  }

  function seekToSubtitle(subtitle: SubtitleCue) {
    seek(subtitle.start)
  }

  // Event handlers
  function onPlayerReady(playerInstance: Player) {
    player.value = playerInstance

    // Set up event listeners
    playerInstance.on('play', () => {
      state.value.isPlaying = true
    })

    playerInstance.on('pause', () => {
      state.value.isPlaying = false
    })

    playerInstance.on('timeupdate', () => {
      state.value.currentTime = playerInstance.currentTime() || 0

      // Update current subtitle
      const newSubtitle = getCurrentSubtitle()
      if (newSubtitle !== currentSubtitle.value) {
        currentSubtitle.value = newSubtitle
      }
    })

    playerInstance.on('durationchange', () => {
      state.value.duration = playerInstance.duration() || 0
    })

    playerInstance.on('volumechange', () => {
      state.value.volume = playerInstance.volume() || 0
    })

    playerInstance.on('fullscreenchange', () => {
      state.value.isFullscreen = playerInstance.isFullscreen() || false
    })

    playerInstance.on('waiting', () => {
      state.value.isLoading = true
    })

    playerInstance.on('canplay', () => {
      state.value.isLoading = false
    })

    playerInstance.on('error', (error) => {
      state.value.error = error.message || 'An error occurred'
      state.value.isLoading = false
    })

    // Set up hotkeys if enabled
    if (options.enableHotkeys) {
      setupHotkeys(playerInstance)
    }
  }

  function setupHotkeys(_playerInstance: Player) {
    document.addEventListener('keydown', (event) => {
      // Only handle hotkeys when player is focused or no input is focused
      const activeElement = document.activeElement
      if (activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeElement.tagName)) {
        return
      }

      switch (event.code) {
        case 'Space':
          event.preventDefault()
          toggle()
          break
        case 'ArrowLeft':
          event.preventDefault()
          skipBackward(event.shiftKey ? 30 : 10)
          break
        case 'ArrowRight':
          event.preventDefault()
          skipForward(event.shiftKey ? 30 : 10)
          break
        case 'ArrowUp':
          event.preventDefault()
          setVolume(state.value.volume + 0.1)
          break
        case 'ArrowDown':
          event.preventDefault()
          setVolume(state.value.volume - 0.1)
          break
        case 'KeyM':
          event.preventDefault()
          toggleMute()
          break
        case 'KeyF':
          event.preventDefault()
          toggleFullscreen()
          break
        case 'KeyP':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            enterPictureInPicture()
          }
          break
      }
    })
  }

  // Utility functions
  function formatTime(seconds: number): string {
    if (isNaN(seconds) || seconds < 0) return '0:00'

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`
    }
  }

  return {
    // State
    player: player as Ref<Player | undefined>,
    state,
    subtitles,
    currentSubtitle,

    // Computed
    progress,
    formattedCurrentTime,
    formattedDuration,

    // Methods
    play,
    pause,
    toggle,
    seek,
    seekByPercent,
    setVolume,
    mute,
    unmute,
    toggleMute,
    setPlaybackRate,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
    enterPictureInPicture,
    skipForward,
    skipBackward,

    // Subtitle methods
    loadSubtitles,
    getCurrentSubtitle,
    seekToWord,
    seekToSubtitle,

    // Event handlers
    onPlayerReady,

    // Utilities
    formatTime
  }
}
