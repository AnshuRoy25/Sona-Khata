import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderNo: { type: String, required: true, unique: true }, // e.g. R-1042
    jeweller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    karigar: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // agreed terms
    item: { type: String, required: true, trim: true },
    quantity: { type: Number, default: 1, min: 1 },
    agreedWastageMg: { type: Number, required: true, min: 0 },
    labourCharge: { type: Number, default: 0, min: 0 }, // in rupees
    deadline: { type: Date, required: true },
    occasionDate: { type: Date }, // wedding date etc, can't be moved

    status: {
      type: String,
      enum: ["pending_confirmation", "open", "delivered", "disputed", "settled", "cancelled"],
      default: "pending_confirmation",
    },
  },
  { timestamps: true }
);


export default mongoose.model("Order", orderSchema);