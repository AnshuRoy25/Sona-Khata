import fs from "fs";
import config from "../config/config.js";

async function testStt() {
  const fileBuffer = fs.readFileSync("test-audio.mp3");

  const form = new FormData();
  form.append("audio_file", new Blob([fileBuffer], { type: "audio/mpeg" }), "test-audio.mp3");
  form.append("model", "prisma-v3.0");
  form.append("language_code", "hi-IN,en-IN");
  form.append("format", "transcribe");

  const response = await fetch("https://api.vachana.ai/stt/v3", {
    method: "POST",
    headers: {
      "X-API-Key-ID": config.gnaniApiKey,
    },
    body: form,
  });

  const data = await response.json();
  console.log("Status:", response.status);
  console.log(data);
}

testStt();