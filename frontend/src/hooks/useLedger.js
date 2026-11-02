import { useCallback, useEffect, useState } from "react";
import { listOrders, getOrder } from "../api/endpoints.js";

// fire this after anything changes the ledger, so every open page reloads
export function notifyLedgerChanged() {
  window.dispatchEvent(new Event("ledger:changed"));
}

// Loads all of the user's orders, plus the entries and gold summary of each.
// details[orderId] = { transactions, summary }
export function useLedger() {
  const [orders, setOrders] = useState([]);
  const [details, setDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async function () {
    try {
      const data = await listOrders();
      const list = data.orders;

      // cancelled orders have nothing left to show
      const withDetails = [];
      for (let i = 0; i < list.length; i++) {
        if (list[i].status !== "cancelled") withDetails.push(list[i]);
      }

      const requests = [];
      for (let i = 0; i < withDetails.length; i++) {
        requests.push(getOrder(withDetails[i]._id));
      }
      const results = await Promise.all(requests);

      const map = {};
      for (let i = 0; i < results.length; i++) {
        map[results[i].order._id] = {
          transactions: results[i].transactions,
          summary: results[i].summary,
        };
      }

      setOrders(list);
      setDetails(map);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(
    function () {
      load();

      // reload after changes made elsewhere in the app, and when the tab comes back into view
      window.addEventListener("ledger:changed", load);
      window.addEventListener("focus", load);
      return function () {
        window.removeEventListener("ledger:changed", load);
        window.removeEventListener("focus", load);
      };
    },
    [load]
  );

  return { orders: orders, details: details, loading: loading, error: error, reload: load };
}
