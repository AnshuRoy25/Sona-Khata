import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useLang } from "../context/LanguageContext.jsx";
import { usePageTitle } from "../hooks/usePageTitle.js";
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
  entryLabel,
} from "../lib/orderUtils.js";
import { mgToGrams, formatRupees, formatDate, formatDateTime, formatGrams } from "../lib/format.js";

export default function OrderDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const { t } = useLang();
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

  usePageTitle(data ? data.order.orderNo + " " + data.order.item : t("nav.orders"));

  if (error) {
    return (
      <div className="page">
        <Link to="/orders" className="back-link">
          <Icon name="back" size={16} />
          {t("nav.orders")}
        </Link>
        <p className="notice notice-red">{error}</p>
      </div>
    );
  }

  if (!data) {
    return <div className="page-loading">{t("detail.loading")}</div>;
  }

  const order = data.order;
  const transactions = data.transactions;
  const summary = data.summary;
  const due = deadlineInfo(order);
  const finished = order.status === "delivered" || order.status === "settled";

  async function handleMovement(body) {
    if (role === "jeweller") {
      await issueExtraGold(order._id, body);
      toast.success(t("detail.extraSaved"));
    } else {
      await recordReturn(order._id, body);
      toast.success(t("detail.returnSaved"));
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
            <small>{c.confirmed ? formatDateTime(c.at) : t("detail.notYet")}</small>
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
                  {entryLabel(txn.type)}
                  {txn.isFinal ? t("detail.final") : ""}
                </span>
                <small className="muted">
                  {t("detail.recordedBy", { date: formatDateTime(txn.createdAt), name: byName })}
                </small>
              </div>
              <Grams value={mgToGrams(txn.weightMg)} size="lg" />
            </div>

            {txn.note && <p className="entry-note">{txn.note}</p>}

            <div className="ticks">{ticks}</div>

            {state === "rejected" && (
              <p className="notice notice-red">
                {t("detail.rejectedOn", { date: formatDateTime(txn.rejection.at) })}
                {txn.rejection.reason ? ": " + txn.rejection.reason : ""}. {t("detail.notCounted")}
              </p>
            )}

            {isWaitingFor(txn, role) && (
              <div className="entry-waiting">
                <span>{t("detail.checkScale")}</span>
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
          <span>{t("auth.receipt.issued")}</span>
          <span className="num">{formatGrams(summary.issuedGrams)} g</span>
        </div>
        <div className="recon-row">
          <span>{t("auth.receipt.returned")}</span>
          <span className="num">{formatGrams(summary.returnedGrams)} g</span>
        </div>
        {finished && (
          <div className="recon-row">
            <span>{t("detail.used")}</span>
            <span className="num">{formatGrams(summary.usedGrams)} g</span>
          </div>
        )}
        <div className="recon-row">
          <span>{t("auth.receipt.wastage")}</span>
          <span className="num">{formatGrams(summary.agreedWastageGrams)} g</span>
        </div>

        {finished ? (
          <div className={"recon-total " + (summary.matched ? "is-match" : "is-off")}>
            <span>{t("detail.difference")}</span>
            <span className="num">
              {summary.deltaGrams > 0 ? "+" : ""}
              {formatGrams(summary.deltaGrams)} g
            </span>
            <p>
              {summary.matched
                ? t("detail.matched")
                : summary.deltaGrams > 0
                ? t("detail.moreUsed", { grams: formatGrams(summary.deltaGrams) })
                : t("detail.lessUsed", { grams: formatGrams(-summary.deltaGrams) })}
            </p>
          </div>
        ) : (
          <div className="recon-total is-open">
            <span>{t("detail.stillWith")}</span>
            <span className="num">{formatGrams(balance)} g</span>
            <p>{t("detail.openNote")}</p>
          </div>
        )}
        <p className="recon-foot">{t("detail.onlyConfirmed")}</p>
      </div>
    );
  }

  // ---------- action panel ----------

  function renderAction() {
    if (order.status !== "open") {
      let message = t("detail.noMore");
      if (order.status === "pending_confirmation") {
        message = role === "karigar" ? t("detail.pendingK") : t("detail.pendingJ");
      }
      if (order.status === "delivered") message = t("detail.deliveredMsg");
      if (order.status === "cancelled") message = t("detail.cancelledMsg");
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
        {t("nav.orders")}
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
            {t("detail.to", {
              jeweller: jewellerLabel(order.jeweller),
              karigar: karigarLabel(order.karigar),
              date: formatDate(order.createdAt),
            })}
          </p>
        </div>
        <div className="order-head-side">
          <span className={"due-chip tone-" + due.tone}>
            <Icon name="clock" size={16} />
            {due.text}
          </span>
          <SpeakButton text={orderSpeech(order, summary)} label={t("detail.readAloud")} />
        </div>
      </header>

      <div className="detail-grid">
        <div className="detail-main">
          <section className="panel">
            <div className="panel-head">
              <h2>{t("detail.movements")}</h2>
              <span className="muted">{t("detail.sameRecord")}</span>
            </div>
            {renderTimeline()}
          </section>
        </div>

        <div className="detail-side">
          <section className="panel">
            <div className="panel-head">
              <h2>{t("detail.hisaab")}</h2>
            </div>
            {renderReconciliation()}
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>{role === "jeweller" ? t("detail.issueMore") : t("detail.returnGold")}</h2>
            </div>
            {renderAction()}
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>{t("detail.agreement")}</h2>
            </div>
            <dl className="facts">
              <div>
                <dt>{t("common.jeweller")}</dt>
                <dd>
                  {jewellerLabel(order.jeweller)}
                  <small>{order.jeweller.phone}</small>
                </dd>
              </div>
              <div>
                <dt>{t("common.karigar")}</dt>
                <dd>
                  {karigarLabel(order.karigar)}
                  <small>{order.karigar.phone}</small>
                </dd>
              </div>
              <div>
                <dt>{t("auth.receipt.wastage")}</dt>
                <dd className="num">{formatGrams(mgToGrams(order.agreedWastageMg))} g</dd>
              </div>
              <div>
                <dt>{t("form.labour")}</dt>
                <dd className="num">{formatRupees(order.labourCharge)}</dd>
              </div>
              <div>
                <dt>{t("form.deadline")}</dt>
                <dd>{formatDate(order.deadline)}</dd>
              </div>
              {order.occasionDate && (
                <div>
                  <dt>{t("detail.occasion")}</dt>
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
