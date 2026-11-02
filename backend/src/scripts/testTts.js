import fs from "fs";
import config from "../config/config.js";

async function testTts() {
  const response = await fetch("https://api.vachana.ai/api/v1/tts/inference", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key-ID": config.gnaniApiKey,
    },
    body: JSON.stringify({
      text: "नमस्ते, यह एक परीक्षण संदेश है। आपका दिन शुभ हो!  Hello, this is a test message. Have a great day!",
      model: "timbre-v2.5",
      voice: "Poorvi",
      language: "hi-en",
      audio_config: {
        container: "mp3",
        sample_rate: 24000,
      },
    }),
  });

  if (!response.ok) {
    console.log("TTS failed:", response.status, await response.text());
    return;
  }

  const audio = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync("test-audio.mp3", audio);
  console.log("Saved test-audio.mp3,", audio.length, "bytes");
}

testTts();