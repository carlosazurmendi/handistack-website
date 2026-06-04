import { meetAuth } from './google'

export type MeetSpace = {
  name: string // "spaces/abc123"
  meetingUri: string // "https://meet.google.com/xxx-xxxx-xxx"
  meetingCode?: string
}

/**
 * Create a Google Meet space with note-taking (smart notes), transcription, and
 * host moderation (the "waiting room" — guests must be admitted) enabled.
 *
 * Smart-notes and transcription require a Workspace edition / Gemini license that
 * supports them; if the edition doesn't, Google ignores those config keys rather
 * than failing. If the whole Meet API call fails (API not enabled, scope missing),
 * the caller falls back to a Calendar-native Meet link with default settings.
 */
export async function createMeetSpace(): Promise<MeetSpace | null> {
  try {
    const auth = meetAuth()
    const res = await auth.request<{
      name: string
      meetingUri: string
      meetingCode?: string
    }>({
      url: 'https://meet.googleapis.com/v2/spaces',
      method: 'POST',
      data: {
        config: {
          accessType: 'TRUSTED', // only invited / same-org join directly
          entryPointAccess: 'ALL',
          moderation: 'ON', // host controls on => uninvited guests wait to be admitted
          artifactConfig: {
            recordingConfig: { autoRecordingGeneration: 'ON' },
            transcriptionConfig: { autoTranscriptionGeneration: 'ON' },
            smartNotesConfig: { autoSmartNotesGeneration: 'ON' },
          },
        },
      },
    })
    const data = res.data
    if (!data?.meetingUri) return null
    return { name: data.name, meetingUri: data.meetingUri, meetingCode: data.meetingCode }
  } catch (err) {
    console.error('[meet] createMeetSpace failed, will fall back to Calendar Meet:', (err as Error).message)
    return null
  }
}
