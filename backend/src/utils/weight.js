// we store weights as integer milligrams to avoid float errors
// e.g. 100.5 g is stored as 100500 mg

export function gramsToMg(grams) {
  return Math.round(Number(grams) * 1000);
}

export function mgToGrams(mg) {
  return mg / 1000;
}