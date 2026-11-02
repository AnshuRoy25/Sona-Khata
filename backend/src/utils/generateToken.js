import jwt from "jsonwebtoken";
import config from "../config/config.js";

function generateToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

export default generateToken;