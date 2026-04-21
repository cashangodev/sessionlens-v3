import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const WHISPER_MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB (OpenAI Whisper limit)

// Supported audio formats for Whisper
const SUPPORTED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/wav',
  'audio/mp4',
  'audio/webm',
  'audio/ogg',
  'audio/aac',
  'audio/flac',
];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!SUPPORTED_AUDIO_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Unsupported audio format: ${file.type}. Supported formats: MP3, WAV, M4A, WebM, OGG, AAC, FLAC`,
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > WHISPER_MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return NextResponse.json(
        {
          error: `Audio file is too large (${sizeMB}MB). Maximum size is 25MB`,
        },
        { status: 413 }
      );
    }

    // Write file to temporary location
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `transcribe-${Date.now()}-${file.name}`);
    const buffer = await file.arrayBuffer();
    fs.writeFileSync(tempFilePath, Buffer.from(buffer));

    try {
      // Call OpenAI Whisper API
      const transcript = await client.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: 'whisper-1',
        language: 'en', // English only as per requirements
      });

      return NextResponse.json(
        { transcript: transcript.text },
        { status: 200 }
      );
    } finally {
      // Clean up temporary file
      try {
        fs.unlinkSync(tempFilePath);
      } catch {
        // Ignore cleanup errors
      }
    }
  } catch (error) {
    console.error('Transcription API error:', error);

    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        return NextResponse.json(
          { error: 'OpenAI API authentication failed. Check your API key.' },
          { status: 401 }
        );
      }
      if (error.message.includes('rate_limit')) {
        return NextResponse.json(
          { error: 'OpenAI API rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to transcribe audio. Please try again.' },
      { status: 500 }
    );
  }
}
