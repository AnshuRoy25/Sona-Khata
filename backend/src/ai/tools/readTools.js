import Order from "../../models/Order.js";
import Transaction from "../../models/Transaction.js";
import { buildVoiceContext } from "../../services/voiceContext.js";
import { myOrders, findMyOrder, goldOnOrder } from "./helpers.js";

// tools that only read data

export async function listOrders(args, user) {
  const orders = await Order.find(myOrders(user))
    .populate("jeweller", "name shopName")
    .populate("karigar", "name");

  const result = [];
  for (let i = 0; i < orders.length; i++) {
    const o = orders[i];
    result.push({
      orderNo: o.orderNo,
      item: o.item,
      jeweller: o.jeweller.shopName || o.jeweller.name,
      karigar: o.karigar.name,
      status: o.status,
      deadline: o.deadline,
    });
  }
  return result;
}

export async function getOrderDetails(args, user) {
  const order = await findMyOrder(args.orderNo, user);
  if (!order) return { error: "No order " + args.orderNo + " found for you" };
  await order.populate("jeweller", "name shopName");
  await order.populate("karigar", "name");

  const txns = await Transaction.find({ order: order._id }).sort({ createdAt: 1 });
  const entries = [];
  for (let i = 0; i < txns.length; i++) {
    const t = txns[i];
    let state = "waiting";
    if (t.locked) state = "confirmed by both";
    if (t.rejection.rejected) state = "rejected";
    entries.push({
      type: t.type,
      grams: t.weightMg / 1000,
      isFinal: t.isFinal,
      state: state,
      jewellerConfirmed: t.confirmations.jeweller.confirmed,
      karigarConfirmed: t.confirmations.karigar.confirmed,
      date: t.createdAt,
    });
  }

  const gold = await goldOnOrder(order._id);
  const usedMg = gold.issuedMg - gold.returnedMg;
  const delivered = order.status === "delivered";

  return {
    orderNo: order.orderNo,
    item: order.item,
    jeweller: order.jeweller.shopName || order.jeweller.name,
    karigar: order.karigar.name,
    status: order.status,
    deadline: order.deadline,
    labourCharge: order.labourCharge,
    entries: entries,
    hisaab: {
      givenGrams: gold.issuedMg / 1000,
      returnedGrams: gold.returnedMg / 1000,
      agreedWastageGrams: order.agreedWastageMg / 1000,
      stillWithKarigarGrams: delivered ? 0 : usedMg / 1000,
      differenceGrams: delivered ? (usedMg - order.agreedWastageMg) / 1000 : null,
    },
  };
}

export async function getLateOrders(args, user) {
  const filter = myOrders(user);
  filter.status = { $in: ["pending_confirmation", "open"] };
  filter.deadline = { $lt: new Date() };

  const orders = await Order.find(filter)
    .populate("jeweller", "name shopName")
    .populate("karigar", "name");

  const result = [];
  for (let i = 0; i < orders.length; i++) {
    const o = orders[i];
    const daysLate = Math.floor((Date.now() - o.deadline.getTime()) / 86400000);
    result.push({
      orderNo: o.orderNo,
      item: o.item,
      karigar: o.karigar.name,
      jeweller: o.jeweller.shopName || o.jeweller.name,
      daysLate: daysLate,
    });
  }
  return { count: result.length, orders: result };
}

export async function getBalance(args, user) {
  const orders = await Order.find(myOrders(user));

  let goldOutMg = 0;
  let runningOrders = 0;
  let labourDue = 0;
  let deliveredOrders = 0;

  for (let i = 0; i < orders.length; i++) {
    const o = orders[i];
    if (o.status === "open" || o.status === "pending_confirmation") {
      const gold = await goldOnOrder(o._id);
      goldOutMg = goldOutMg + gold.issuedMg - gold.returnedMg;
      runningOrders = runningOrders + 1;
    }
    if (o.status === "delivered") {
      labourDue = labourDue + (o.labourCharge || 0);
      deliveredOrders = deliveredOrders + 1;
    }
  }

  return {
    goldWithKarigarGrams: goldOutMg / 1000,
    runningOrders: runningOrders,
    labourDueRupees: labourDue,
    labourMeaning: user.role === "jeweller" ? "labour you have to pay" : "labour you will receive",
    deliveredOrders: deliveredOrders,
  };
}

export async function findPerson(args, user) {
  const context = await buildVoiceContext(user);

  const people = [];
  for (let i = 0; i < context.peopleDetails.length; i++) {
    const p = context.peopleDetails[i];
    people.push({ name: p.label, phone: p.phone });
  }

  if (people.length === 0) {
    return { found: false, message: "You have not worked with anyone yet. Ask the user for the phone number." };
  }

  return {
    lookingFor: args.name,
    people: people,
    note: "Pick the person the user means. The name may be in Hindi script or spelled differently. If two people could match, ask which one.",
  };
}

export async function listPendingEntries(args, user) {
  const orders = await Order.find(myOrders(user))
    .populate("jeweller", "name shopName")
    .populate("karigar", "name");

  const result = [];
  for (let i = 0; i < orders.length; i++) {
    const o = orders[i];
    const mySide = o.jeweller._id.equals(user._id) ? "jeweller" : "karigar";
    const otherName = mySide === "jeweller" ? o.karigar.name : o.jeweller.shopName || o.jeweller.name;

    const txns = await Transaction.find({ order: o._id, locked: false });
    for (let j = 0; j < txns.length; j++) {
      const t = txns[j];
      if (t.rejection.rejected) continue;
      if (t.confirmations[mySide].confirmed) continue;

      result.push({
        entryId: String(t._id),
        orderNo: o.orderNo,
        item: o.item,
        type: t.type,
        grams: t.weightMg / 1000,
        isFinal: t.isFinal,
        recordedBy: otherName,
        note: t.note,
      });
    }
  }
  return { count: result.length, entries: result };
}
