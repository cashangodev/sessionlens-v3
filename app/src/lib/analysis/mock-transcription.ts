/**
 * Transcribe audio using OpenAI's Whisper API.
 * Sends the audio file to /api/transcribe endpoint which handles the API call.
 *
 * @param file - The audio File object to transcribe
 * @returns The transcribed text
 * @throws Error if transcription fails
 */
export async function transcribeAudio(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/transcribe', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error || `Transcription failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data.transcript;
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
export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB (OpenAI Whisper limit)
