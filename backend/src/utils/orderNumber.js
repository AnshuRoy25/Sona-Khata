import Order from "../models/Order.js";

// GL-1001, GL-1002, ...
async function generateOrderNumber() {
  const count = await Order.countDocuments();
  return `GL-${1001 + count}`;
}

export default generateOrderNumber;