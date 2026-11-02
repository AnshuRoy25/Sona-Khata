import { fetchSpeech } from "../api/endpoints.js";

// text → object URL of the mp3, so the same sentence is generated only once
const cache = new Map();
let current = null;

export function stopSpeaking() {
  if (current) {
    current.pause();
    current = null;
  }
}

// plays the sentence through Timbre (via our backend)
// resolves when playback starts; onEnd runs when it finishes
export async function speak(text, onEnd) {
  stopSpeaking();

  let url = cache.get(text);
  if (!url) {
    const blob = await fetchSpeech(text);
    url = URL.createObjectURL(blob);
    cache.set(text, url);
  }

  const audio = new Audio(url);
  current = audio;

  audio.onended = function () {
    if (current === audio) current = null;
    if (onEnd) onEnd();
  };

  await audio.play();
  return audio;
}
