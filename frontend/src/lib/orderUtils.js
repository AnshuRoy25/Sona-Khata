import { mgToGrams, shortGrams, spokenDate, daysFromToday, formatDate } from "./format.js";
import { t } from "./i18n.js";

// colour of each order status
export const STATUS_TONES = {
  pending_confirmation: "blue",
  open: "amber",
  delivered: "green",
  disputed: "red",
  settled: "grey",
  cancelled: "grey",
};

export function statusLabel(status) {
  return t("status." + status);
}

// "Gold issued", "Gold returned", "Scrap returned"
export function entryLabel(type) {
  return t("entry." + type);
}

// the jeweller as karigars refer to him: shop name first
export function jewellerLabel(jeweller) {
  if (!jeweller) return t("common.jeweller");
  return jeweller.shopName || jeweller.name;
}

export function karigarLabel(karigar) {
  if (!karigar) return t("common.karigar");
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
    return { text: t("due.on", { date: formatDate(order.deadline) }), tone: "muted" };
  }
  if (days < 0) {
    const late = -days;
    return { text: late === 1 ? t("due.lateOne") : t("due.lateMany", { days: late }), tone: "red" };
  }
  if (days === 0) {
    return { text: t("due.today"), tone: "amber" };
  }
  if (days === 1) {
    return { text: t("due.tomorrow"), tone: "amber" };
  }
  return { text: t("due.inDays", { days: days }), tone: days <= 3 ? "amber" : "muted" };
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
