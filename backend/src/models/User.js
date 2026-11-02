import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    role: { type: String, enum: ["jeweller", "karigar"], required: true },
    language: {
      type: String,
      enum: ["hinglish", "hi", "kn", "ta", "en"],
      default: "hinglish",
    },
    shopName: { type: String, trim: true }, // only for jewellers
    city: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);