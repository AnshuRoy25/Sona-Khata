import Order from "../models/Order.js";
import Transaction from "../models/Transaction.js";

// which side of the order is this user? "jeweller", "karigar", or null
function getSide(order, userId) {
  if (order.jeweller.equals(userId)) return "jeweller";
  if (order.karigar.equals(userId)) return "karigar";
  return null;
}

// POST /api/transactions/:id/confirm
export async function confirmTransaction(req, res) {
  try {
    const txn = await Transaction.findById(req.params.id);
    if (!txn) {
      return res.status(404).json({ message: "Entry not found" });
    }

    const order = await Order.findById(txn.order);
    const side = getSide(order, req.user._id);
    if (!side) {
      return res.status(404).json({ message: "Entry not found" });
    }

    if (txn.rejection.rejected) {
      return res.status(400).json({ message: "This entry was rejected" });
    }
    if (txn.confirmations[side].confirmed) {
      return res.status(400).json({ message: "You have already confirmed this entry" });
    }

    // tick my side
    txn.confirmations[side].confirmed = true;
    txn.confirmations[side].at = new Date();

    // both ticked → lock it
    if (txn.confirmations.jeweller.confirmed && txn.confirmations.karigar.confirmed) {
      txn.locked = true;
    }
    await txn.save();

        // move the order forward when an entry locks
    if (txn.locked) {
      if (order.status === "pending_confirmation") {
        // first issue confirmed → work starts
        order.status = "open";
        await order.save();
      } else if (txn.type === "return" && txn.isFinal && order.status === "open") {
        // final return confirmed → piece delivered
        order.status = "delivered";
        await order.save();
      }
    }

    res.json({ message: "Confirmed", transaction: txn, order: order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not confirm" });
  }
}

// POST /api/transactions/:id/reject
export async function rejectTransaction(req, res) {
  try {
    const txn = await Transaction.findById(req.params.id);
    if (!txn) {
      return res.status(404).json({ message: "Entry not found" });
    }

    const order = await Order.findById(txn.order);
    const side = getSide(order, req.user._id);
    if (!side) {
      return res.status(404).json({ message: "Entry not found" });
    }

    if (txn.rejection.rejected) {
      return res.status(400).json({ message: "This entry is already rejected" });
    }
    if (txn.confirmations[side].confirmed) {
      return res.status(400).json({ message: "You cannot reject an entry you created or confirmed" });
    }

    txn.rejection.rejected = true;
    txn.rejection.by = req.user._id;
    txn.rejection.at = new Date();
    txn.rejection.reason = req.body ? req.body.reason : undefined;
    await txn.save();

    // first issue rejected → order cancelled
    if (order.status === "pending_confirmation") {
      order.status = "cancelled";
      await order.save();
    }

    res.json({ message: "Rejected", transaction: txn, order: order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not reject" });
  }
}