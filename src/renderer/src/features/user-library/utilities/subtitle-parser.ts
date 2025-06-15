import type { SubtitleCue } from '../composables/useVideoPlayer'

export function parseSRT(content: string): SubtitleCue[] {
  const cues: SubtitleCue[] = []

  // Split by double newlines to get each subtitle block
  const blocks = content.trim().split(/\n\s*\n/)
  for (const block of blocks) {
    const lines = block.trim().split('\n')

    if (lines.length < 3) continue

    const sequenceNumber = lines[0].trim()

    const timeMatch = lines[1].match(
      /(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/
    )

    if (!timeMatch) continue

    const startTime = timeToSeconds(timeMatch[1], timeMatch[2], timeMatch[3], timeMatch[4])
    const endTime = timeToSeconds(timeMatch[5], timeMatch[6], timeMatch[7], timeMatch[8])

    const text = lines.slice(2).join('\n').trim()

    if (text) {
      cues.push({
        id: `srt-${sequenceNumber}`,
        start: startTime,
        end: endTime,
        text: text,
        words: []
      })
    }
  }
  return cues
}

export function parseVTT(content: string): SubtitleCue[] {
  const cues: SubtitleCue[] = []

  const cleanContent = content.replace(/^WEBVTT.*?\n\n/, '')
  const blocks = cleanContent.trim().split(/\n\s*\n/)

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i].trim()
    const lines = block.split('\n')

    if (lines.length < 2) continue

    let timeLineIndex = 0
    let id = `vtt-${i + 1}`

    if (lines[0].includes('-->')) {
      timeLineIndex = 0
    } else if (lines.length > 1 && lines[1].includes('-->')) {
      timeLineIndex = 1
      id = lines[0]
    } else {
      continue
    }
    const timeMatch = lines[timeLineIndex].match(
      /(\d{2}):(\d{2}):(\d{2})\.(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})\.(\d{3})/
    )

    if (!timeMatch) continue

    const startTime = timeToSeconds(timeMatch[1], timeMatch[2], timeMatch[3], timeMatch[4])
    const endTime = timeToSeconds(timeMatch[5], timeMatch[6], timeMatch[7], timeMatch[8])

    const textLines = lines.slice(timeLineIndex + 1)
    const text = textLines.join('\n').trim()

    if (text) {
      cues.push({
        id: id,
        start: startTime,
        end: endTime,
        text: text,
        words: []
      })
    }
  }
  return cues
}

export function parseJSONTranscript(content: string): SubtitleCue[] {
  try {
    const data = JSON.parse(content)
    const cues: SubtitleCue[] = []

    const cueArray = data.cues || data.transcript || data

    if (!Array.isArray(cueArray)) {
      console.warn('[SubtitleParser] JSON content is not an array or does not contain cues array')
      return []
    }

    for (let i = 0; i < cueArray.length; i++) {
      const cue = cueArray[i]

      if (
        typeof cue.id !== 'undefined' &&
        typeof cue.startTime === 'number' &&
        typeof cue.endTime === 'number' &&
        typeof cue.text === 'string'
      ) {
        cues.push({
          id: String(cue.id),
          start: cue.startTime,
          end: cue.endTime,
          text: cue.text.trim(),
          words: []
        })
      } else {
        console.warn('[SubtitleParser] Invalid cue format at index', i, cue)
      }
    }

    return cues
  } catch (error) {
    console.error('[SubtitleParser] Failed to parse JSON transcript:', error)
    return []
  }
}

export function parseSubtitleFile(content: string, filename?: string): SubtitleCue[] {
  if (filename) {
    const extension = filename.toLowerCase().split('.').pop()

    if (extension === 'srt') {
      return parseSRT(content)
    } else if (extension === 'vtt') {
      return parseVTT(content)
    } else if (extension === 'json') {
      return parseJSONTranscript(content)
    }
  }

  const trimmedContent = content.trim()

  if (trimmedContent.startsWith('WEBVTT')) {
    return parseVTT(content)
  } else if (trimmedContent.startsWith('{') || trimmedContent.startsWith('[')) {
    return parseJSONTranscript(content)
  } else if (content.includes('-->') && /\d{2}:\d{2}:\d{2},\d{3}/.test(content)) {
    return parseSRT(content)
  } else if (content.includes('-->') && /\d{2}:\d{2}:\d{2}\.\d{3}/.test(content)) {
    return parseVTT(content)
  }

  console.warn('[SubtitleParser] Could not detect subtitle format, trying SRT as fallback')
  return parseSRT(content)
}

function timeToSeconds(
  hours: string,
  minutes: string,
  seconds: string,
  milliseconds: string
): number {
  return (
    parseInt(hours) * 3600 +
    parseInt(minutes) * 60 +
    parseInt(seconds) +
    parseInt(milliseconds) / 1000
  )
}

export function secondsToSRTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 1000)
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`
}

export function secondsToVTTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 1000)

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`
}
