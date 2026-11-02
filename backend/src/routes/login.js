import { Router } from "express";
import { sendLoginOtp, verifyLoginOtp } from "../controllers/loginController.js";

const router = Router();

router.post("/send-otp", sendLoginOtp);
router.post("/verify-otp", verifyLoginOtp);

export default router;