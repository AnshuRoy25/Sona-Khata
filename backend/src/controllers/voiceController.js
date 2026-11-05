import { speak } from "../ai/voice/gnani.js";

// POST /api/voice/speak  { text }
export async function speakText(req, res) {
  try {
    const text = req.body ? req.body.text : undefined;

    if (!text) {
      return res.status(400).json({ message: "Text is required" });
    }

    const audio = await speak(text);

    res.set("Content-Type", "audio/mpeg");
    res.send(audio);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not generate speech" });
  }
}