import { listOrders, getOrderDetails, getLateOrders, getBalance, findPerson, listPendingEntries } from "./readTools.js";
import { createOrderTool, issueExtraGoldTool, recordReturnTool, confirmEntryTool, rejectEntryTool } from "./writeTools.js";

// tool name -> function
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
