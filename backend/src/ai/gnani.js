import fs from "fs";
import path from "path";
import config from "../config/config.js";

const STT_URL = "https://api.vachana.ai/stt/v3";
const TTS_URL = "https://api.vachana.ai/api/v1/tts/inference";

// audio file on disk → text
// audio bytes → text
export async function transcribe(buffer, fileName) {
  const form = new FormData();
  form.append("audio_file", new Blob([buffer]), fileName);
  form.append("model", "prisma-v3.0");
  form.append("language_code", "hi-IN,en-IN");
  form.append("format", "transcribe");

  const response = await fetch(STT_URL, {
    method: "POST",
    headers: { "X-API-Key-ID": config.gnaniApiKey },
    body: form,
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    console.error("Prisma error:", response.status, data);
    throw new Error("Transcription failed");
  }

  return data.transcript;
}

// text → mp3 audio (as a Buffer)
export async function speak(text) {
  const response = await fetch(TTS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key-ID": config.gnaniApiKey,
    },
    body: JSON.stringify({
      text: text,
      model: "timbre-v2.5",
      voice: "Poorvi",
      language: "hi-en",
      audio_config: { container: "mp3", sample_rate: 24000 },
    }),
  });

  if (!response.ok) {
    console.error("Timbre error:", response.status, await response.text());
    throw new Error("Speech generation failed");
  }

  return Buffer.from(await response.arrayBuffer());
}