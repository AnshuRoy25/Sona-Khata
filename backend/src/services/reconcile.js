import { mgToGrams } from "../utils/weight.js";

const TOLERANCE_MG = 50; // 0.05 g, ignore tiny scale differences

// works out the gold math for one order, using only locked entries
function reconcile(order, transactions) {
  let issuedMg = 0;
  let returnedMg = 0;

  for (let i = 0; i < transactions.length; i++) {
    const t = transactions[i];

    if (!t.locked) continue; // only count entries both sides confirmed

    if (t.type === "issue") {
      issuedMg = issuedMg + t.weightMg;
    } else if (t.type === "return") {
      returnedMg = returnedMg + t.weightMg;
    }
  }

  const usedMg = issuedMg - returnedMg;
  const deltaMg = usedMg - order.agreedWastageMg;
  const matched = Math.abs(deltaMg) <= TOLERANCE_MG;

  return {
    issuedGrams: mgToGrams(issuedMg),
    returnedGrams: mgToGrams(returnedMg),
    usedGrams: mgToGrams(usedMg),
    agreedWastageGrams: mgToGrams(order.agreedWastageMg),
    deltaGrams: mgToGrams(deltaMg),
    matched: matched,
  };
}

export default reconcile;