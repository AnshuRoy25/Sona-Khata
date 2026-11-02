import { mgToGrams, shortGrams, spokenDate, daysFromToday } from "./format.js";

export const STATUS_INFO = {
  pending_confirmation: { label: "Awaiting receipt", tone: "blue" },
  open: { label: "In progress", tone: "amber" },
  delivered: { label: "Delivered", tone: "green" },
  disputed: { label: "Disputed", tone: "red" },
  settled: { label: "Settled", tone: "grey" },
  cancelled: { label: "Cancelled", tone: "grey" },
};

export const ENTRY_LABELS = {
  issue: "Gold issued",
  return: "Gold returned",
  scrap: "Scrap returned",
};

// the jeweller as karigars refer to him: shop name first
export function jewellerLabel(jeweller) {
  if (!jeweller) return "Unknown jeweller";
  return jeweller.shopName || jeweller.name;
}

export function karigarLabel(karigar) {
  if (!karigar) return "Unknown karigar";
  return karigar.name;
}

// the person on the other side of the order, from the viewer's point of view
export function otherParty(order, role) {
  if (role === "jeweller") return karigarLabel(order.karigar);
  return jewellerLabel(order.jeweller);
}

export function isActive(order) {
  return order.status === "open" || order.status === "pending_confirmation";
}

export function isLate(order) {
  return isActive(order) && daysFromToday(order.deadline) < 0;
}

// short text about the deadline, plus a tone for colouring it
export function deadlineInfo(order) {
  const days = daysFromToday(order.deadline);

  if (!isActive(order)) {
    return { text: "Due " + spokenDate(order.deadline), tone: "muted" };
  }
  if (days < 0) {
    const late = -days;
    return { text: late === 1 ? "1 day late" : late + " days late", tone: "red" };
  }
  if (days === 0) {
    return { text: "Due today", tone: "amber" };
  }
  if (days <= 3) {
    return { text: days === 1 ? "Due tomorrow" : "Due in " + days + " days", tone: "amber" };
  }
  return { text: "Due in " + days + " days", tone: "muted" };
}

// entry is still open and waiting for this side to confirm or reject
export function isWaitingFor(transaction, side) {
  if (transaction.locked) return false;
  if (transaction.rejection && transaction.rejection.rejected) return false;
  return !transaction.confirmations[side].confirmed;
}

// "who recorded this entry", as a side name
export function recordedBySide(order, transaction) {
  const jewellerId = order.jeweller && order.jeweller._id ? order.jeweller._id : order.jeweller;
  if (String(transaction.recordedBy) === String(jewellerId)) return "jeweller";
  return "karigar";
}

export function entryState(transaction) {
  if (transaction.rejection && transaction.rejection.rejected) return "rejected";
  if (transaction.locked) return "locked";
  return "pending";
}

// ---------- sentences for Timbre ----------

// read out an entry before the other side confirms it
export function entrySpeech(order, transaction) {
  const grams = shortGrams(mgToGrams(transaction.weightMg));
  const by = recordedBySide(order, transaction);

  if (transaction.type === "issue") {
    return (
      jewellerLabel(order.jeweller) +
      " ne likha hai, " +
      grams +
      " gram sona diya, " +
      order.item +
      " ke liye. Sahi hai?"
    );
  }

  let sentence;
  if (by === "karigar") {
    sentence = karigarLabel(order.karigar) + " ne likha hai, " + grams + " gram wapas diya, " + order.item;
  } else {
    sentence = jewellerLabel(order.jeweller) + " ne likha hai, " + grams + " gram wapas mila, " + order.item;
  }
  if (transaction.isFinal) sentence += ", kaam poora";
  return sentence + ". Sahi hai?";
}

// read out the whole order
export function orderSpeech(order, summary) {
  let sentence =
    "Order " +
    order.orderNo +
    ". " +
    order.item +
    ". " +
    jewellerLabel(order.jeweller) +
    " se " +
    karigarLabel(order.karigar) +
    " ko " +
    shortGrams(summary.issuedGrams) +
    " gram diya gaya.";

  if (summary.returnedGrams > 0) {
    sentence += " " + shortGrams(summary.returnedGrams) + " gram wapas aaya.";
  }

  sentence += " Wastage " + shortGrams(summary.agreedWastageGrams) + " gram tay hua.";

  if (order.status === "delivered" || order.status === "settled") {
    if (summary.matched) {
      sentence += " Hisaab barabar hai.";
    } else {
      sentence += " Hisaab mein " + shortGrams(Math.abs(summary.deltaGrams)) + " gram ka farak hai.";
    }
  } else {
    sentence += " Deadline " + spokenDate(order.deadline) + ".";
  }

  if (order.labourCharge) {
    sentence += " Majdoori " + order.labourCharge + " rupaye.";
  }

  return sentence;
}
