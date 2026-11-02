import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import sendSms from "../utils/sendSms.js";
import { saveOTP, getOTP, deleteOTP, generateOTP } from "../utils/otpStore.js";

const PHONE_REGEX = /^[6-9]\d{9}$/;

// POST /api/auth/register/send-otp
export async function sendRegisterOtp(req, res) {
  try {
    const { phone, name, role, language, shopName, city } = req.body;

    if (!phone || !PHONE_REGEX.test(phone)) {
      return res.status(400).json({ message: "Enter a valid 10 digit phone number" });
    }
    if (!name || !role) {
      return res.status(400).json({ message: "Name and role are required" });
    }
    if (role !== "jeweller" && role !== "karigar") {
      return res.status(400).json({ message: "Role must be jeweller or karigar" });
    }

    const existingUser = await User.findOne({ phone: phone });
    if (existingUser) {
      return res.status(409).json({ message: "You already have an account linked to this number, try login" });
    }

    const code = generateOTP();
    saveOTP(phone, { code, name, role, language, shopName, city });
    await sendSms(phone, `Your GoldLedger OTP is ${code}. Valid for 5 minutes.`);

    res.json({ message: "OTP sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not send OTP" });
  }
}

// POST /api/auth/register/verify-otp
export async function verifyRegisterOtp(req, res) {
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

    const existingUser = await User.findOne({ phone: phone });
    if (existingUser) {
      return res.status(409).json({ message: "You already have an account linked to this number, try login" });
    }

    const user = await User.create({
      name: record.name,
      phone: phone,
      role: record.role,
      language: record.language,
      shopName: record.shopName,
      city: record.city,
    });

    const token = generateToken(user);
    res.status(201).json({ message: "Signup successful", token: token, user: user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not register" });
  }
}