import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import sendSms from "../utils/sendSms.js";
import { saveOTP, getOTP, deleteOTP, generateOTP } from "../utils/otpStore.js";

const PHONE_REGEX = /^[6-9]\d{9}$/;

// POST /api/auth/login/send-otp
export async function sendLoginOtp(req, res) {
  try {
    const { phone } = req.body;

    if (!phone || !PHONE_REGEX.test(phone)) {
      return res.status(400).json({ message: "Enter a valid 10 digit phone number" });
    }

    const user = await User.findOne({ phone: phone });
    if (!user) {
      return res.status(404).json({ message: "No account found with this number, please register" });
    }

    const code = generateOTP();
    saveOTP(phone, { code });
    await sendSms(phone, `Your GoldLedger OTP is ${code}. Valid for 5 minutes.`);

    res.json({ message: "OTP sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not send OTP" });
  }
}

// POST /api/auth/login/verify-otp
export async function verifyLoginOtp(req, res) {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ message: "Phone and OTP are required" });
    }

    const record = getOTP(phone);

    if (!record || record.expiresAt < new Date()) {
      deleteOTP(phone);
      return res.status(400).json({ message: "OTP expired or not found" });
    }
    if (record.code !== String(otp)) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    deleteOTP(phone);

    const user = await User.findOne({ phone: phone });
    if (!user) {
      return res.status(404).json({ message: "No account found with this number, please register" });
    }

    const token = generateToken(user);
    res.json({ message: "Login successful", token: token, user: user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not log in" });
  }
}