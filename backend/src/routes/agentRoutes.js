import express from "express";
import auth from "../middleware/auth.js";   // same as in voiceRoutes.js
import upload from "../middleware/upload.js";       // same multer memoryStorage as voiceRoutes.js
import { agentChat, agentVoice } from "../controllers/agentController.js";

const router = express.Router();

router.post("/chat", auth, agentChat);
router.post("/voice", auth, upload.single("audio"), agentVoice);

export default router;