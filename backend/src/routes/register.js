import { Router } from "express";
import { sendRegisterOtp, verifyRegisterOtp } from "../controllers/registerController.js";

const router = Router();

router.post("/send-otp", sendRegisterOtp);
router.post("/verify-otp", verifyRegisterOtp);

export default router;