import Order from "../models/Order.js";

export async function buildVoiceContext(user) {
  const filter = {};
  let otherSide;

  if (user.role === "jeweller") {
    filter.jeweller = user._id;
    otherSide = "karigar";
  } else {
    filter.karigar = user._id;
    otherSide = "jeweller";
  }

  const orders = await Order.find(filter).populate(otherSide, "name shopName phone");

  // collect each person once
  const people = [];
  const seen = {};

  for (let i = 0; i < orders.length; i++) {
    const p = orders[i][otherSide];
    if (!p) continue;

    const id = String(p._id);
    if (seen[id]) continue;
    seen[id] = true;

    let label = p.name;
    if (otherSide === "jeweller" && p.shopName) {
      label = p.shopName;
    }

    people.push({ id: p._id, label: label, phone: p.phone });
  }

  const names = [];
  for (let i = 0; i < people.length; i++) {
    names.push(people[i].label);
  }

  return {
    role: user.role,
    name: user.name,
    today: new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }), // YYYY-MM-DD
    otherSide: otherSide,
    people: names,        // just names, for the brain's prompt
    peopleDetails: people, // with id + phone, for our code
    orders: orders,        // reused by the actions, so we don't query again
  };
}