import { fetchSpeech } from "../api/endpoints.js";

// Phones only allow audio that starts from a tap. The assistant's reply arrives
// a few seconds after the tap, so a brand new player would be blocked.
// Fix: one shared player, "unlocked" by playing a tiny silent sound during the tap,
// then reused for every reply.

// 0.1 s of silence
const SILENT_WAV =
  "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAACAgICA";

const player = new Audio();
player.preload = "auto";

// text → object URL of the mp3, so the same sentence is generated only once
const cache = new Map();
let onEndCallback = null;

player.onended = function () {
  const done = onEndCallback;
  onEndCallback = null;
  if (done) done();
};

// call this at the very start of a tap handler (mic, send, suggestion)
export function unlockAudio() {
  if (!player.paused) return;
  player.src = SILENT_WAV;
  player.play().catch(function () {
    // nothing to do, we try again on the next tap
  });
}

export function stopSpeaking() {
  player.pause();
  const done = onEndCallback;
  onEndCallback = null;
  if (done) done();
}

// plays the sentence through Timbre (via our backend)
// resolves when playback starts; onEnd runs when it finishes or is stopped
export async function speak(text, onEnd) {
  stopSpeaking();

  let url = cache.get(text);
  if (!url) {
    const blob = await fetchSpeech(text);
    url = URL.createObjectURL(blob);
    cache.set(text, url);
  }

  player.src = url;
  onEndCallback = onEnd || null;
  await player.play();
  return player;
}
