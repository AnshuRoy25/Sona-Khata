import { createOrder, recordReturn, issueExtraGold } from "../../controllers/orderController.js";
import { confirmTransaction, rejectTransaction } from "../../controllers/transactionController.js";
import { findMyOrder, callController, notConfirmed } from "./helpers.js";

// tools that change data (they reuse the controllers)

export async function createOrderTool(args, user) {
  if (args.confirmedByUser !== true) return notConfirmed();

  const out = await callController(createOrder, user, {}, args);
  if (out.status >= 400) return { error: out.data.message };

  return { done: true, orderNo: out.data.order.orderNo, status: out.data.order.status };
}

export async function issueExtraGoldTool(args, user) {
  if (args.confirmedByUser !== true) return notConfirmed();

  const order = await findMyOrder(args.orderNo, user);
  if (!order) return { error: "No order " + args.orderNo + " found for you" };

  const out = await callController(issueExtraGold, user, { id: String(order._id) }, args);
  if (out.status >= 400) return { error: out.data.message };

  return { done: true, orderNo: order.orderNo, grams: args.weightGrams, waitingFor: "karigar" };
}

export async function recordReturnTool(args, user) {
  if (args.confirmedByUser !== true) return notConfirmed();

  const order = await findMyOrder(args.orderNo, user);
  if (!order) return { error: "No order " + args.orderNo + " found for you" };

  const out = await callController(recordReturn, user, { id: String(order._id) }, args);
  if (out.status >= 400) return { error: out.data.message };

  return { done: true, orderNo: order.orderNo, grams: args.weightGrams, isFinal: args.isFinal === true, waitingFor: "jeweller" };
}

export async function confirmEntryTool(args, user) {
  if (args.confirmedByUser !== true) return notConfirmed();

  const out = await callController(confirmTransaction, user, { id: args.entryId }, {});
  if (out.status >= 400) return { error: out.data.message };

  return { done: true, locked: out.data.transaction.locked, orderStatus: out.data.order.status };
}

export async function rejectEntryTool(args, user) {
  if (args.confirmedByUser !== true) return notConfirmed();

  const out = await callController(rejectTransaction, user, { id: args.entryId }, { reason: args.reason });
  if (out.status >= 400) return { error: out.data.message };

  return { done: true, orderStatus: out.data.order.status };
}
