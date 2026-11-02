import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    type: { type: String, enum: ["issue", "return", "scrap"], required: true },
    weightMg: { type: Number, required: true, min: 1 },
    note: { type: String, trim: true },
    isFinal: { type: Boolean, default: false }, // karigar's last return for this order

    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // both sides must confirm
    confirmations: {
      jeweller: {
        confirmed: { type: Boolean, default: false },
        at: { type: Date },
      },
      karigar: {
        confirmed: { type: Boolean, default: false },
        at: { type: Date },
      },
    },
    locked: { type: Boolean, default: false },

    rejection: {
      rejected: { type: Boolean, default: false },
      by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      at: { type: Date },
      reason: { type: String, trim: true },
    },

    // voice evidence
    audioUrl: { type: String },
    transcript: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Transaction", transactionSchema);