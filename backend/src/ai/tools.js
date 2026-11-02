import Order from "../models/Order.js";
import Transaction from "../models/Transaction.js";
import { createOrder, recordReturn, issueExtraGold } from "../controllers/orderController.js";
import { confirmTransaction, rejectTransaction } from "../controllers/transactionController.js";
import { buildVoiceContext } from "../services/voiceContext.js";

// ================= what the LLM sees =================

// builds one tool definition in the format Gemini expects
function tool(name, description, properties, required) {
  return {
    type: "function",
    function: {
      name: name,
      description: description,
      parameters: { type: "object", properties: properties || {}, required: required || [] },
    },
  };
}

export const toolDefinitions = [
  tool("list_orders", "List the user's orders with order number, item, other person's name and status."),

  tool(
    "get_order_details",
    "Get one order's full details: all gold entries, who confirmed them, and the hisaab (gold given, returned, wastage, difference).",
    { orderNo: { type: "string", description: "Order number like GL-1001" } },
    ["orderNo"]
  ),

  tool("get_late_orders", "List running orders that are past their deadline."),

  tool("get_balance", "Total gold currently with karigars across running orders, and labour money due on delivered orders."),

  tool(
    "find_person",
    "Get everyone the user has worked with (name and phone). Use it to find the person the user named, even if the name is in Hindi script or spelled differently.",
    { name: { type: "string", description: "Name or part of the name, like Rajesh" } },
    ["name"]
  ),

  tool(
    "create_order",
    "Jeweller only. Create a new order and issue gold to a karigar. Only call after the user said yes to the details.",
    {
      karigarPhone: { type: "string" },
      item: { type: "string", description: "What is being made, like Rani haar" },
      weightGrams: { type: "number", description: "Gold given now, in grams" },
      wastageGrams: { type: "number", description: "Agreed wastage in grams" },
      deadline: { type: "string", description: "YYYY-MM-DD" },
      labourCharge: { type: "number", description: "Labour in rupees, if said" },
      quantity: { type: "number" },
      note: { type: "string" },
      confirmedByUser: { type: "boolean", description: "true only if the user said yes to these exact details" },
    },
    ["karigarPhone", "item", "weightGrams", "wastageGrams", "deadline", "confirmedByUser"]
  ),

  tool(
    "issue_extra_gold",
    "Jeweller only. Give more gold on an open order. Only call after the user said yes.",
    {
      orderNo: { type: "string" },
      weightGrams: { type: "number" },
      note: { type: "string" },
      confirmedByUser: { type: "boolean" },
    },
    ["orderNo", "weightGrams", "confirmedByUser"]
  ),

  tool(
    "record_return",
    "Karigar only. Record gold given back to the jeweller. isFinal true when the work is complete (kaam poora). Only call after the user said yes.",
    {
      orderNo: { type: "string" },
      weightGrams: { type: "number" },
      isFinal: { type: "boolean" },
      note: { type: "string" },
      confirmedByUser: { type: "boolean" },
    },
    ["orderNo", "weightGrams", "isFinal", "confirmedByUser"]
  ),

  tool(
    "list_pending_entries",
    "Entries recorded by the other side that are waiting for this user's confirmation. Call this to get entryId before confirming or rejecting."
  ),

  tool(
    "confirm_entry",
    "Confirm a pending entry. Only call after the user clearly said yes for that entry.",
    { entryId: { type: "string" }, confirmedByUser: { type: "boolean" } },
    ["entryId", "confirmedByUser"]
  ),

  tool(
    "reject_entry",
    "Reject a pending entry that is wrong. Ask the user for the reason if not given.",
    { entryId: { type: "string" }, reason: { type: "string" }, confirmedByUser: { type: "boolean" } },
    ["entryId", "confirmedByUser"]
  ),
];

// ================= helpers =================

// orders where I am the jeweller or the karigar
function myOrders(user) {
  return { $or: [{ jeweller: user._id }, { karigar: user._id }] };
}

// find one of my orders by its number
async function findMyOrder(orderNo, user) {
  const filter = myOrders(user);
  filter.orderNo = orderNo;
  return Order.findOne(filter);
}

// run a controller like a route would, and keep what it sends back
async function callController(fn, user, params, body) {
  const out = { status: 200, data: null };
  const res = {
    status(code) {
      out.status = code;
      return res;
    },
    json(data) {
      out.data = data;
      return res;
    },
  };
  await fn({ user: user, params: params, body: body, query: {} }, res);
  return out;
}

function notConfirmed() {
  return { error: "User has not said yes yet. Repeat the details and ask for confirmation first." };
}

// gold given and returned on one order, counting only entries both sides confirmed
async function goldOnOrder(orderId) {
  const txns = await Transaction.find({ order: orderId, locked: true });
  let issuedMg = 0;
  let returnedMg = 0;
  for (let i = 0; i < txns.length; i++) {
    if (txns[i].type === "issue") issuedMg = issuedMg + txns[i].weightMg;
    if (txns[i].type === "return" || txns[i].type === "scrap") returnedMg = returnedMg + txns[i].weightMg;
  }
  return { issuedMg: issuedMg, returnedMg: returnedMg };
}

// ================= read tools =================

async function listOrders(args, user) {
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

async function getOrderDetails(args, user) {
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

async function getLateOrders(args, user) {
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

async function getBalance(args, user) {
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

async function findPerson(args, user) {
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

async function listPendingEntries(args, user) {
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

// ================= write tools (they reuse the controllers) =================

async function createOrderTool(args, user) {
  if (args.confirmedByUser !== true) return notConfirmed();

  const out = await callController(createOrder, user, {}, args);
  if (out.status >= 400) return { error: out.data.message };

  return { done: true, orderNo: out.data.order.orderNo, status: out.data.order.status };
}

async function issueExtraGoldTool(args, user) {
  if (args.confirmedByUser !== true) return notConfirmed();

  const order = await findMyOrder(args.orderNo, user);
  if (!order) return { error: "No order " + args.orderNo + " found for you" };

  const out = await callController(issueExtraGold, user, { id: String(order._id) }, args);
  if (out.status >= 400) return { error: out.data.message };

  return { done: true, orderNo: order.orderNo, grams: args.weightGrams, waitingFor: "karigar" };
}

async function recordReturnTool(args, user) {
  if (args.confirmedByUser !== true) return notConfirmed();

  const order = await findMyOrder(args.orderNo, user);
  if (!order) return { error: "No order " + args.orderNo + " found for you" };

  const out = await callController(recordReturn, user, { id: String(order._id) }, args);
  if (out.status >= 400) return { error: out.data.message };

  return { done: true, orderNo: order.orderNo, grams: args.weightGrams, isFinal: args.isFinal === true, waitingFor: "jeweller" };
}

async function confirmEntryTool(args, user) {
  if (args.confirmedByUser !== true) return notConfirmed();

  const out = await callController(confirmTransaction, user, { id: args.entryId }, {});
  if (out.status >= 400) return { error: out.data.message };

  return { done: true, locked: out.data.transaction.locked, orderStatus: out.data.order.status };
}

async function rejectEntryTool(args, user) {
  if (args.confirmedByUser !== true) return notConfirmed();

  const out = await callController(rejectTransaction, user, { id: args.entryId }, { reason: args.reason });
  if (out.status >= 400) return { error: out.data.message };

  return { done: true, orderStatus: out.data.order.status };
}

// ================= tool name → function =================

const handlers = {
  list_orders: listOrders,
  get_order_details: getOrderDetails,
  get_late_orders: getLateOrders,
  get_balance: getBalance,
  find_person: findPerson,
  create_order: createOrderTool,
  issue_extra_gold: issueExtraGoldTool,
  record_return: recordReturnTool,
  list_pending_entries: listPendingEntries,
  confirm_entry: confirmEntryTool,
  reject_entry: rejectEntryTool,
};

export async function runTool(name, args, user) {
  const handler = handlers[name];
  if (!handler) return { error: "Unknown tool " + name };

  try {
    return await handler(args, user);
  } catch (err) {
    return { error: err.message };
  }
}