import Order from "../../models/Order.js";
import Transaction from "../../models/Transaction.js";

// orders where I am the jeweller or the karigar
export function myOrders(user) {
  return { $or: [{ jeweller: user._id }, { karigar: user._id }] };
}

// find one of my orders by its number
export async function findMyOrder(orderNo, user) {
  const filter = myOrders(user);
  filter.orderNo = orderNo;
  return Order.findOne(filter);
}

// run a controller like a route would, and keep what it sends back
export async function callController(fn, user, params, body) {
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

export function notConfirmed() {
  return { error: "User has not said yes yet. Repeat the details and ask for confirmation first." };
}

// gold given and returned on one order, counting only entries both sides confirmed
export async function goldOnOrder(orderId) {
  const txns = await Transaction.find({ order: orderId, locked: true });
  let issuedMg = 0;
  let returnedMg = 0;
  for (let i = 0; i < txns.length; i++) {
    if (txns[i].type === "issue") issuedMg = issuedMg + txns[i].weightMg;
    if (txns[i].type === "return" || txns[i].type === "scrap") returnedMg = returnedMg + txns[i].weightMg;
  }
  return { issuedMg: issuedMg, returnedMg: returnedMg };
}
