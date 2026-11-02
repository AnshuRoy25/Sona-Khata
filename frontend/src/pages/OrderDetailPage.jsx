import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { getOrder, issueExtraGold, recordReturn } from "../api/endpoints.js";
import { notifyLedgerChanged } from "../hooks/useLedger.js";
import Icon from "../components/Icon.jsx";
import Grams from "../components/Grams.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import SpeakButton from "../components/SpeakButton.jsx";
import EntryActions from "../components/EntryActions.jsx";
import MovementForm from "../components/MovementForm.jsx";
import {
  jewellerLabel,
  karigarLabel,
  deadlineInfo,
  isWaitingFor,
  entryState,
  recordedBySide,
  entrySpeech,
  orderSpeech,
  ENTRY_LABELS,
} from "../lib/orderUtils.js";
import { mgToGrams, formatRupees, formatDate, formatDateTime, formatGrams } from "../lib/format.js";

export default function OrderDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const role = user.role;

  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(
    async function () {
      try {
        const result = await getOrder(id);
        setData(result);
        setError("");
      } catch (err) {
        setError(err.message);
      }
    },
    [id]
  );

  useEffect(
    function () {
      load();
      window.addEventListener("ledger:changed", load);
      return function () {
        window.removeEventListener("ledger:changed", load);
      };
    },
    [load]
  );

  if (error) {
    return (
      <div className="page">
        <Link to="/orders" className="back-link">
          <Icon name="back" size={16} />
          Orders
        </Link>
        <p className="notice notice-red">{error}</p>
      </div>
    );
  }

  if (!data) {
    return <div className="page-loading">Loading order</div>;
  }

  const order = data.order;
  const transactions = data.transactions;
  const summary = data.summary;
  const due = deadlineInfo(order);
  const finished = order.status === "delivered" || order.status === "settled";

  async function handleMovement(body) {
    if (role === "jeweller") {
      await issueExtraGold(order._id, body);
      toast.success("Extra gold recorded. Waiting for the karigar to confirm.");
    } else {
      await recordReturn(order._id, body);
      toast.success("Return recorded. Waiting for the jeweller to confirm.");
    }
    notifyLedgerChanged();
  }

  // ---------- timeline ----------

  function renderTimeline() {
    const items = [];

    for (let i = 0; i < transactions.length; i++) {
      const txn = transactions[i];
      const state = entryState(txn);
      const by = recordedBySide(order, txn);
      const byName = by === "jeweller" ? jewellerLabel(order.jeweller) : karigarLabel(order.karigar);

      const sides = [
        { key: "jeweller", name: jewellerLabel(order.jeweller) },
        { key: "karigar", name: karigarLabel(order.karigar) },
      ];
      const ticks = [];
      for (let s = 0; s < sides.length; s++) {
        const c = txn.confirmations[sides[s].key];
        ticks.push(
          <span key={sides[s].key} className={"tick" + (c.confirmed ? " is-done" : "")}>
            <span className="tick-mark" aria-hidden="true">
              {c.confirmed && <Icon name="check" size={12} />}
            </span>
            {sides[s].name}
            <small>{c.confirmed ? formatDateTime(c.at) : "not yet"}</small>
          </span>
        );
      }

      items.push(
        <li key={txn._id} className={"entry entry-" + state}>
          <span className="entry-rail" aria-hidden="true" />
          <div className="entry-body">
            <div className="entry-top">
              <div>
                <span className="entry-type">
                  {ENTRY_LABELS[txn.type]}
                  {txn.isFinal ? ", final" : ""}
                </span>
                <small className="muted">
                  {formatDateTime(txn.createdAt)}, recorded by {byName}
                </small>
              </div>
              <Grams value={mgToGrams(txn.weightMg)} size="lg" />
            </div>

            {txn.note && <p className="entry-note">{txn.note}</p>}
            {txn.transcript && <p className="entry-note devanagari">Spoken: {txn.transcript}</p>}

            <div className="ticks">{ticks}</div>

            {state === "rejected" && (
              <p className="notice notice-red">
                Rejected on {formatDateTime(txn.rejection.at)}
                {txn.rejection.reason ? ": " + txn.rejection.reason : ""}. This entry does not count.
              </p>
            )}

            {isWaitingFor(txn, role) && (
              <div className="entry-waiting">
                <span>Check this against your own scale before you confirm.</span>
                <EntryActions transaction={txn} speechText={entrySpeech(order, txn)} />
              </div>
            )}
          </div>
        </li>
      );
    }

    return <ol className="timeline">{items}</ol>;
  }

  // ---------- reconciliation ----------

  function renderReconciliation() {
    const balance = summary.issuedGrams - summary.returnedGrams;

    return (
      <div className="recon">
        <div className="recon-row">
          <span>Gold issued</span>
          <span className="num">{formatGrams(summary.issuedGrams)} g</span>
        </div>
        <div className="recon-row">
          <span>Gold returned</span>
          <span className="num">{formatGrams(summary.returnedGrams)} g</span>
        </div>
        {finished && (
          <div className="recon-row">
            <span>Used in making</span>
            <span className="num">{formatGrams(summary.usedGrams)} g</span>
          </div>
        )}
        <div className="recon-row">
          <span>Agreed wastage</span>
          <span className="num">{formatGrams(summary.agreedWastageGrams)} g</span>
        </div>

        {finished ? (
          <div className={"recon-total " + (summary.matched ? "is-match" : "is-off")}>
            <span>Difference</span>
            <span className="num">
              {summary.deltaGrams > 0 ? "+" : ""}
              {formatGrams(summary.deltaGrams)} g
            </span>
            <p>
              {summary.matched
                ? "The gold matches the agreement. Ready to settle."
                : summary.deltaGrams > 0
                ? formatGrams(summary.deltaGrams) + " g more was used than agreed."
                : formatGrams(-summary.deltaGrams) + " g less was used than agreed."}
            </p>
          </div>
        ) : (
          <div className="recon-total is-open">
            <span>Still with karigar</span>
            <span className="num">{formatGrams(balance)} g</span>
            <p>The difference is worked out once the final return is confirmed by both sides.</p>
          </div>
        )}
        <p className="recon-foot">Only entries confirmed by both sides are counted.</p>
      </div>
    );
  }

  // ---------- action panel ----------

  function renderAction() {
    if (order.status !== "open") {
      let message = "No more gold can be added to this order.";
      if (order.status === "pending_confirmation") {
        message =
          role === "karigar"
            ? "Confirm that you received the gold to start work on this order."
            : "The karigar has to confirm the gold first. You can add more after that.";
      }
      if (order.status === "delivered") message = "The piece is delivered. Next step is settlement.";
      if (order.status === "cancelled") message = "This order was cancelled because the first entry was rejected.";
      return <p className="panel-empty">{message}</p>;
    }

    return (
      <div className="panel-pad">
        <MovementForm mode={role === "jeweller" ? "issue" : "return"} onSubmit={handleMovement} />
      </div>
    );
  }

  // ---------- page ----------

  return (
    <div className="page">
      <Link to="/orders" className="back-link">
        <Icon name="back" size={16} />
        Orders
      </Link>

      <header className="order-head">
        <div>
          <div className="order-head-line">
            <span className="order-no order-no-lg">{order.orderNo}</span>
            <StatusBadge status={order.status} />
          </div>
          <h1>
            {order.item}
            {order.quantity > 1 ? " × " + order.quantity : ""}
          </h1>
          <p className="muted">
            {jewellerLabel(order.jeweller)} to {karigarLabel(order.karigar)}, started {formatDate(order.createdAt)}
          </p>
        </div>
        <div className="order-head-side">
          <span className={"due-chip tone-" + due.tone}>
            <Icon name="clock" size={16} />
            {due.text}
          </span>
          <SpeakButton text={orderSpeech(order, summary)} label="Read aloud" />
        </div>
      </header>

      <div className="detail-grid">
        <div className="detail-main">
          <section className="panel">
            <div className="panel-head">
              <h2>Gold movements</h2>
              <span className="muted">Same record for both sides</span>
            </div>
            {renderTimeline()}
          </section>
        </div>

        <div className="detail-side">
          <section className="panel">
            <div className="panel-head">
              <h2>Hisaab</h2>
            </div>
            {renderReconciliation()}
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>{role === "jeweller" ? "Issue more gold" : "Return gold"}</h2>
            </div>
            {renderAction()}
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>Agreement</h2>
            </div>
            <dl className="facts">
              <div>
                <dt>Jeweller</dt>
                <dd>
                  {jewellerLabel(order.jeweller)}
                  <small>{order.jeweller.phone}</small>
                </dd>
              </div>
              <div>
                <dt>Karigar</dt>
                <dd>
                  {karigarLabel(order.karigar)}
                  <small>{order.karigar.phone}</small>
                </dd>
              </div>
              <div>
                <dt>Agreed wastage</dt>
                <dd className="num">{formatGrams(mgToGrams(order.agreedWastageMg))} g</dd>
              </div>
              <div>
                <dt>Labour charge</dt>
                <dd className="num">{formatRupees(order.labourCharge)}</dd>
              </div>
              <div>
                <dt>Deadline</dt>
                <dd>{formatDate(order.deadline)}</dd>
              </div>
              {order.occasionDate && (
                <div>
                  <dt>Occasion</dt>
                  <dd>{formatDate(order.occasionDate)}</dd>
                </div>
              )}
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
