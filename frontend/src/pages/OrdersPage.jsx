import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useLedgerData } from "../context/LedgerContext.jsx";
import Icon from "../components/Icon.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { otherParty, deadlineInfo, isWaitingFor, isActive } from "../lib/orderUtils.js";
import { formatGrams, mgToGrams, formatRupees, formatShortDate } from "../lib/format.js";

const TABS = [
  { key: "all", label: "All" },
  { key: "pending_confirmation", label: "Awaiting receipt" },
  { key: "open", label: "In progress" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

export default function OrdersPage() {
  const { user } = useAuth();
  const ledger = useLedgerData();
  const navigate = useNavigate();
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");

  const role = user.role;
  const query = search.trim().toLowerCase();

  // count per tab, and the rows for the chosen tab
  const counts = { all: 0 };
  const rows = [];

  for (let i = 0; i < ledger.orders.length; i++) {
    const order = ledger.orders[i];
    const person = otherParty(order, role);

    if (query) {
      const haystack = (order.orderNo + " " + person + " " + order.item).toLowerCase();
      if (haystack.indexOf(query) === -1) continue;
    }

    counts.all = counts.all + 1;
    counts[order.status] = (counts[order.status] || 0) + 1;

    if (tab !== "all" && order.status !== tab) continue;

    const detail = ledger.details[order._id];
    const due = deadlineInfo(order);

    let issued = null;
    let withKarigar = null;
    let waitingHere = false;
    if (detail) {
      issued = detail.summary.issuedGrams;
      if (isActive(order)) {
        withKarigar = detail.summary.issuedGrams - detail.summary.returnedGrams;
      }
      for (let j = 0; j < detail.transactions.length; j++) {
        if (isWaitingFor(detail.transactions[j], role)) waitingHere = true;
      }
    }

    rows.push(
      <tr key={order._id} className="row-link" onClick={() => navigate("/orders/" + order._id)}>
        <td>
          <span className="order-no">{order.orderNo}</span>
          {waitingHere && <span className="dot-flag" title="Waiting for your confirmation" />}
        </td>
        <td>
          <div className="cell-main">{person}</div>
          <div className="cell-sub">Since {formatShortDate(order.createdAt)}</div>
        </td>
        <td>
          {order.item}
          {order.quantity > 1 ? " × " + order.quantity : ""}
        </td>
        <td className="num-cell">{issued === null ? "–" : formatGrams(issued) + " g"}</td>
        <td className="num-cell">{withKarigar === null ? "–" : formatGrams(withKarigar) + " g"}</td>
        <td className="num-cell">{formatGrams(mgToGrams(order.agreedWastageMg))} g</td>
        <td className="num-cell">{formatRupees(order.labourCharge)}</td>
        <td>
          <span className={"tone-" + due.tone}>{due.text}</span>
        </td>
        <td>
          <StatusBadge status={order.status} />
        </td>
      </tr>
    );
  }

  const tabButtons = [];
  for (let i = 0; i < TABS.length; i++) {
    const t = TABS[i];
    tabButtons.push(
      <button
        key={t.key}
        role="tab"
        aria-selected={tab === t.key}
        className={"tab" + (tab === t.key ? " is-active" : "")}
        onClick={() => setTab(t.key)}
      >
        {t.label}
        <span className="tab-count">{counts[t.key] || 0}</span>
      </button>
    );
  }

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Orders</h1>
          <p className="muted">
            {role === "jeweller"
              ? "Every piece of work you have given to a karigar"
              : "Every piece of work you have taken from a jeweller"}
          </p>
        </div>
        {role === "jeweller" && (
          <div className="page-actions">
            <Link to="/orders/new" className="btn btn-primary">
              <Icon name="plus" size={16} />
              New order
            </Link>
          </div>
        )}
      </header>

      <section className="panel">
        <div className="toolbar">
          <div className="tabs" role="tablist">
            {tabButtons}
          </div>
          <label className="search">
            <Icon name="search" size={16} />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order, name or item"
            />
          </label>
        </div>

        {ledger.loading ? (
          <div className="page-loading">Loading orders</div>
        ) : rows.length === 0 ? (
          <div className="empty-block">
            <p>{query ? "No orders match your search." : "No orders here yet."}</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>{role === "jeweller" ? "Karigar" : "Jeweller"}</th>
                  <th>Item</th>
                  <th className="num-cell">Issued</th>
                  <th className="num-cell">With karigar</th>
                  <th className="num-cell">Wastage</th>
                  <th className="num-cell">Labour</th>
                  <th>Due</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>{rows}</tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
