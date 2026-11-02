import { Router } from "express";
import { speakText} from "../controllers/voiceController.js";
import auth from "../middleware/auth.js";

const router = Router();

router.post("/speak", auth, speakText);


export default router;