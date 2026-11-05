import { runAgent } from "../ai/agent/runAgent.js";
import { transcribe } from "../ai/voice/gnani.js";
// POST /api/agent/chat
export async function agentChat(req, res) {
  try {
    const history = req.body.history || [];
    if (history.length === 0) {
      return res.status(400).json({ message: "Message is required" });
    }

    const out = await runAgent(history, req.user);
    res.json({ reply: out.reply, toolsUsed: out.toolsUsed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Agent could not answer" });
  }
}

// POST /api/agent/voice
export async function agentVoice(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No audio sent" });
    }

    const transcript = await transcribe(req.file.buffer, req.file.originalname);
    if (!transcript) {
      return res.status(400).json({ message: "Could not hear anything, please speak again" });
    }

    let history = [];
    if (req.body.history) {
      history = JSON.parse(req.body.history);
    }
    history.push({ role: "user", content: transcript });

    const out = await runAgent(history, req.user);
    res.json({ transcript: transcript, reply: out.reply, toolsUsed: out.toolsUsed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Agent could not answer" });
  }
}