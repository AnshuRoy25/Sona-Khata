import mongoose from "mongoose";
import User from "../models/User.js";
import Order from "../models/Order.js";
import Transaction from "../models/Transaction.js";
import generateOrderNumber from "../utils/orderNumber.js";
import { gramsToMg } from "../utils/weight.js";
import reconcile from "../services/reconcile.js";

// POST /api/orders  (jeweller only)
export async function createOrder(req, res) {
  try {

    if (req.user.role !== "jeweller") {
      return res.status(403).json({ message: "Only jewellers can create orders" });
    }

    const {
      karigarPhone,
      item,
      quantity,
      weightGrams,
      wastageGrams,
      labourCharge,
      deadline,
      occasionDate,
      note,
    } = req.body;

    if (!karigarPhone || !item || weightGrams === undefined || wastageGrams === undefined || !deadline) {
      return res.status(400).json({
        message: "karigarPhone, item, weightGrams, wastageGrams and deadline are required",
      });
    }

    // find the karigar
    const karigar = await User.findOne({ phone: karigarPhone });
    if (!karigar) {
      return res.status(404).json({ message: "No karigar registered with this number" });
    }
    if (karigar.role !== "karigar") {
      return res.status(400).json({ message: "This number belongs to a jeweller, not a karigar" });
    }

    // check numbers
    const weight = Number(weightGrams);
    const wastage = Number(wastageGrams);

    if (isNaN(weight) || weight <= 0) {
      return res.status(400).json({ message: "Weight must be more than 0" });
    }
    if (isNaN(wastage) || wastage < 0) {
      return res.status(400).json({ message: "Wastage cannot be negative" });
    }
    if (wastage >= weight) {
      return res.status(400).json({ message: "Wastage must be less than the weight issued" });
    }

    // check dates
    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) {
      return res.status(400).json({ message: "Invalid deadline date" });
    }
    if (deadlineDate <= new Date()) {
      return res.status(400).json({ message: "Deadline must be in the future" });
    }

    let occasion;
    if (occasionDate) {
      occasion = new Date(occasionDate);
      if (isNaN(occasion.getTime())) {
        return res.status(400).json({ message: "Invalid occasion date" });
      }
    }

    // create the order
    const orderNo = await generateOrderNumber();

    const order = await Order.create({
      orderNo: orderNo,
      jeweller: req.user._id,
      karigar: karigar._id,
      item: item,
      quantity: quantity,
      agreedWastageMg: gramsToMg(wastage),
      labourCharge: labourCharge,
      deadline: deadlineDate,
      occasionDate: occasion,
    });

    // create the first issue entry, jeweller side already confirmed
    let issue;
    try {
      issue = await Transaction.create({
        order: order._id,
        type: "issue",
        weightMg: gramsToMg(weight),
        note: note,
        recordedBy: req.user._id,
        confirmations: {
          jeweller: { confirmed: true, at: new Date() },
        },
      });
    } catch (err) {
      // don't leave an order with no gold entry
      await Order.deleteOne({ _id: order._id });
      throw err;
    }

    res.status(201).json({ order: order, transaction: issue });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not create order" });
  }
}

// GET /api/orders  (optional ?status=open)
export async function listOrders(req, res) {
  try {
    const filter = {};

    if (req.user.role === "jeweller") {
      filter.jeweller = req.user._id;
    } else {
      filter.karigar = req.user._id;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const orders = await Order.find(filter)
      .populate("jeweller", "name shopName phone")
      .populate("karigar", "name phone")
      .sort({ deadline: 1 })

    res.json({ orders: orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not fetch orders" });
  }
}

// GET /api/orders/:id
export async function getOrder(req, res) {
  try {
    const id = req.params.id;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid order id" });
    }

    const order = await Order.findById(id)
      .populate("jeweller", "name shopName phone")
      .populate("karigar", "name phone");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const userId = req.user._id;
    const isParty = order.jeweller._id.equals(userId) || order.karigar._id.equals(userId);
    if (!isParty) {
      return res.status(403).json({ message: "You are not part of this order" });
    }

    const transactions = await Transaction.find({ order: order._id }).sort({ createdAt: 1 });
    const summary = reconcile(order, transactions);

    res.json({ order: order, transactions: transactions, summary: summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not fetch order" });
  }
}

// POST /api/orders/:id/returns  (karigar only)
export async function recordReturn(req, res) {
  try {
    if (req.user.role !== "karigar") {
      return res.status(403).json({ message: "Only karigars can record returns" });
    }

    const { weightGrams, note, isFinal } = req.body;

    const weight = Number(weightGrams);
    if (isNaN(weight) || weight <= 0) {
      return res.status(400).json({ message: "Weight must be more than 0" });
    }

    const order = await Order.findOne({ _id: req.params.id, karigar: req.user._id });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (order.status !== "open") {
      return res.status(400).json({ message: "Returns can only be added to open orders" });
    }

    const txn = await Transaction.create({
      order: order._id,
      type: "return",
      weightMg: gramsToMg(weight),
      note: note,
      isFinal: isFinal === true,
      recordedBy: req.user._id,
      confirmations: {
        karigar: { confirmed: true, at: new Date() },
      },
    });

    res.status(201).json({ transaction: txn });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not record return" });
  }
}

// POST /api/orders/:id/issues  (jeweller only, extra gold mid-way)
export async function issueExtraGold(req, res) {
  try {
    if (req.user.role !== "jeweller") {
      return res.status(403).json({ message: "Only jewellers can issue gold" });
    }

    const { weightGrams, note } = req.body;

    const weight = Number(weightGrams);
    if (isNaN(weight) || weight <= 0) {
      return res.status(400).json({ message: "Weight must be more than 0" });
    }

    const order = await Order.findOne({ _id: req.params.id, jeweller: req.user._id });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (order.status !== "open") {
      return res.status(400).json({ message: "Extra gold can only be issued on open orders" });
    }

    const txn = await Transaction.create({
      order: order._id,
      type: "issue",
      weightMg: gramsToMg(weight),
      note: note,
      recordedBy: req.user._id,
      confirmations: {
        jeweller: { confirmed: true, at: new Date() },
      },
    });

    res.status(201).json({ transaction: txn });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not issue gold" });
  }
}