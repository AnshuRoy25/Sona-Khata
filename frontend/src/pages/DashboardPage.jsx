import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useLedgerData } from "../context/LedgerContext.jsx";
import { useVoice } from "../context/VoiceContext.jsx";
import Icon from "../components/Icon.jsx";
import Grams from "../components/Grams.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import EntryActions from "../components/EntryActions.jsx";
import {
  otherParty,
  isActive,
  isLate,
  isWaitingFor,
  deadlineInfo,
  entrySpeech,
  ENTRY_LABELS,
} from "../lib/orderUtils.js";
import { mgToGrams, formatRupees, formatDateTime, greeting, formatGrams } from "../lib/format.js";

export default function DashboardPage() {
  const { user } = useAuth();
  const ledger = useLedgerData();
  const { openVoice } = useVoice();
  const navigate = useNavigate();
  const role = user.role;

  // ---------- work out the numbers ----------

  const active = [];
  const late = [];
  const waiting = [];
  const activity = [];
  let goldOut = 0;
  let labourDue = 0;
  let deliveredCount = 0;

  for (let i = 0; i < ledger.orders.length; i++) {
    const order = ledger.orders[i];
    const detail = ledger.details[order._id];

    if (isActive(order)) active.push(order);
    if (isLate(order)) late.push(order);

    if (order.status === "delivered") {
      labourDue = labourDue + (order.labourCharge || 0);
      deliveredCount = deliveredCount + 1;
    }

    if (!detail) continue;

    if (isActive(order)) {
      goldOut = goldOut + (detail.summary.issuedGrams - detail.summary.returnedGrams);
    }

    for (let j = 0; j < detail.transactions.length; j++) {
      const txn = detail.transactions[j];
      if (isWaitingFor(txn, role)) waiting.push({ order: order, txn: txn });
      activity.push({ order: order, txn: txn });
    }
  }

  activity.sort(function (a, b) {
    return new Date(b.txn.updatedAt || b.txn.createdAt) - new Date(a.txn.updatedAt || a.txn.createdAt);
  });

  // ---------- pieces ----------

  function renderWaiting() {
    if (waiting.length === 0) {
      return (
        <div className="empty-inline">
          <Icon name="check" />
          <span>Nothing is waiting for you. Every entry you are part of is confirmed.</span>
        </div>
      );
    }

    const rows = [];
    for (let i = 0; i < waiting.length; i++) {
      const order = waiting[i].order;
      const txn = waiting[i].txn;
      const byName = otherParty(order, role);

      rows.push(
        <div className="waiting-row" key={txn._id}>
          <div className="waiting-weight">
            <Grams value={mgToGrams(txn.weightMg)} size="lg" />
          </div>
          <div className="waiting-text">
            <p>
              <strong>{byName}</strong> recorded {ENTRY_LABELS[txn.type].toLowerCase()}
              {txn.isFinal ? " (final return)" : ""} for{" "}
              <Link to={"/orders/" + order._id}>
                {order.item}, {order.orderNo}
              </Link>
            </p>
            <small>
              {formatDateTime(txn.createdAt)}
              {txn.note ? ". Note: " + txn.note : ""}
            </small>
          </div>
          <EntryActions transaction={txn} speechText={entrySpeech(order, txn)} />
        </div>
      );
    }
    return <div className="waiting-list">{rows}</div>;
  }

  function renderActiveTable() {
    if (active.length === 0) {
      return (
        <div className="empty-block">
          <p>No running orders.</p>
          {role === "jeweller" ? (
            <p className="muted">Ask the assistant or create an order to issue gold to a karigar.</p>
          ) : (
            <p className="muted">Orders appear here when a jeweller issues gold to you.</p>
          )}
        </div>
      );
    }

    const rows = [];
    for (let i = 0; i < active.length; i++) {
      const order = active[i];
      const detail = ledger.details[order._id];
      const due = deadlineInfo(order);
      const withKarigar = detail ? detail.summary.issuedGrams - detail.summary.returnedGrams : 0;

      rows.push(
        <tr key={order._id} onClick={() => navigate("/orders/" + order._id)} className="row-link">
          <td>
            <span className="order-no">{order.orderNo}</span>
          </td>
          <td>
            <div className="cell-main">{otherParty(order, role)}</div>
            <div className="cell-sub">{order.item}</div>
          </td>
          <td className="num-cell">{formatGrams(withKarigar)} g</td>
          <td>
            <span className={"tone-" + due.tone}>{due.text}</span>
          </td>
          <td>
            <StatusBadge status={order.status} />
          </td>
        </tr>
      );
    }

    return (
      <div className="table-scroll">
      <table className="table">
        <thead>
          <tr>
            <th>Order</th>
            <th>{role === "jeweller" ? "Karigar" : "Jeweller"}</th>
            <th className="num-cell">With karigar</th>
            <th>Due</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
      </div>
    );
  }

  function renderLate() {
    if (late.length === 0) {
      return <p className="panel-empty">Nothing is past its deadline.</p>;
    }
    const rows = [];
    for (let i = 0; i < late.length; i++) {
      const order = late[i];
      rows.push(
        <li key={order._id}>
          <Link to={"/orders/" + order._id}>
            <span>
              <strong>{otherParty(order, role)}</strong>
              <small>
                {order.item}, {order.orderNo}
              </small>
            </span>
            <span className="tone-red">{deadlineInfo(order).text}</span>
          </Link>
        </li>
      );
    }
    return <ul className="link-list">{rows}</ul>;
  }

  function renderActivity() {
    if (activity.length === 0) {
      return <p className="panel-empty">Entries will show here as gold moves.</p>;
    }
    const rows = [];
    const limit = Math.min(activity.length, 7);
    for (let i = 0; i < limit; i++) {
      const order = activity[i].order;
      const txn = activity[i].txn;

      let state = "Waiting for " + (txn.confirmations.jeweller.confirmed ? "karigar" : "jeweller");
      let tone = "blue";
      if (txn.locked) {
        state = "Confirmed by both";
        tone = "green";
      }
      if (txn.rejection && txn.rejection.rejected) {
        state = "Rejected";
        tone = "red";
      }

      rows.push(
        <li key={txn._id} className={"feed-item feed-" + tone}>
          <span className="feed-dot" aria-hidden="true" />
          <div>
            <p>
              {ENTRY_LABELS[txn.type]}, <strong>{formatGrams(mgToGrams(txn.weightMg))} g</strong> on{" "}
              <Link to={"/orders/" + order._id}>{order.orderNo}</Link>
            </p>
            <small>
              {formatDateTime(txn.createdAt)}, <span className={"tone-" + tone}>{state}</span>
            </small>
          </div>
        </li>
      );
    }
    return <ul className="feed">{rows}</ul>;
  }

  // ---------- page ----------

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>
            {greeting()}, {user.name.split(" ")[0]}
          </h1>
          <p className="muted">{today}</p>
        </div>
        <div className="page-actions">
          {role === "jeweller" && (
            <Link to="/orders/new" className="btn">
              <Icon name="plus" size={16} />
              New order
            </Link>
          )}
          <button className="btn btn-primary" onClick={openVoice}>
            <Icon name="mic" size={16} />
            Talk to assistant
          </button>
        </div>
      </header>

      {ledger.error && (
        <p className="notice notice-red">
          {ledger.error}{" "}
          <button className="link-btn" onClick={ledger.reload}>
            Try again
          </button>
        </p>
      )}

      <section className="stat-strip">
        <div className="stat stat-hero">
          <span className="stat-label">{role === "jeweller" ? "Gold with your karigars" : "Gold with you"}</span>
          <Grams value={goldOut} size="xl" />
          <span className="stat-note">
            Across {active.length} running {active.length === 1 ? "order" : "orders"}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">{role === "jeweller" ? "Labour to pay" : "Labour to receive"}</span>
          <span className="stat-value">{formatRupees(labourDue)}</span>
          <span className="stat-note">
            {deliveredCount === 1 ? "1 delivered order" : deliveredCount + " delivered orders"}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Waiting for you</span>
          <span className="stat-value">{waiting.length}</span>
          <span className="stat-note">{waiting.length === 1 ? "entry to confirm" : "entries to confirm"}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Late</span>
          <span className={"stat-value" + (late.length > 0 ? " tone-red" : "")}>{late.length}</span>
          <span className="stat-note">past the deadline</span>
        </div>
      </section>

      {ledger.loading ? (
        <div className="page-loading">Loading your ledger</div>
      ) : (
        <div className="dash-grid">
          <div className="dash-main">
            <section className="panel">
              <div className="panel-head">
                <h2>Waiting for your confirmation</h2>
              </div>
              {renderWaiting()}
            </section>

            <section className="panel">
              <div className="panel-head">
                <h2>Running orders</h2>
                <Link to="/orders" className="panel-link">
                  All orders
                </Link>
              </div>
              {renderActiveTable()}
            </section>
          </div>

          <div className="dash-side">
            <section className="panel">
              <div className="panel-head">
                <h2>Late</h2>
              </div>
              {renderLate()}
            </section>

            <section className="panel">
              <div className="panel-head">
                <h2>Recent entries</h2>
              </div>
              {renderActivity()}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
