import { DEMO_TRANSCRIPT } from './demo-transcript';

/**
 * Mock audio transcription for MVP.
 * In production, this will call AssemblyAI / OpenAI Whisper.
 * For now, returns the demo transcript after a simulated delay.
 */
export async function mockTranscribeAudio(fileName: string): Promise<string> {
  // Simulate transcription delay (1-2 seconds)
  const delay = 1000 + Math.random() * 1000;
  await new Promise((resolve) => setTimeout(resolve, delay));

  // Return demo transcript as stand-in
  return DEMO_TRANSCRIPT;
}

/** Format file size in human-readable form */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/** Estimate audio duration from file size (rough: ~1MB per minute for mp3) */
export function estimateDuration(bytes: number): string {
  const minutes = Math.max(1, Math.round(bytes / (1024 * 1024)));
  if (minutes < 60) return `~${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMin = minutes % 60;
  return `~${hours}h ${remainingMin}m`;
}

/** Accepted audio file extensions */
export const ACCEPTED_AUDIO_TYPES = '.mp3,.wav,.m4a,.webm,.ogg,.aac,.flac';
export const ACCEPTED_AUDIO_MIME = 'audio/mpeg,audio/wav,audio/mp4,audio/webm,audio/ogg,audio/aac,audio/flac';
export const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024; // 500MB
