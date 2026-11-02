import { useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import Icon from "./Icon.jsx";
import Modal from "./Modal.jsx";
import LanguageSwitch from "./LanguageSwitch.jsx";
import { useLang } from "../context/LanguageContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { LedgerProvider, useLedgerData } from "../context/LedgerContext.jsx";
import { VoiceProvider, useVoice } from "../context/VoiceContext.jsx";
import { isWaitingFor } from "../lib/orderUtils.js";

function initials(name) {
  const parts = (name || "").trim().split(" ");
  let result = "";
  for (let i = 0; i < parts.length && result.length < 2; i++) {
    if (parts[i]) result += parts[i][0].toUpperCase();
  }
  return result || "?";
}

// number of entries waiting for this user's confirmation
function countWaiting(ledger, role) {
  let count = 0;
  for (let i = 0; i < ledger.orders.length; i++) {
    const detail = ledger.details[ledger.orders[i]._id];
    if (!detail) continue;
    for (let j = 0; j < detail.transactions.length; j++) {
      if (isWaitingFor(detail.transactions[j], role)) count = count + 1;
    }
  }
  return count;
}

function Shell() {
  const { user, logout } = useAuth();
  const ledger = useLedgerData();
  const { openVoice } = useVoice();
  const { t } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const [askLogout, setAskLogout] = useState(false);

  // "Orders" covers the list and order pages, but not the new order form
  const onOrders = location.pathname.startsWith("/orders") && location.pathname !== "/orders/new";

  const waiting = countWaiting(ledger, user.role);

  function handleLogout() {
    setAskLogout(false);
    logout();
    navigate("/", { replace: true });
  }

  let place = user.role === "jeweller" ? t("common.jeweller") : t("common.karigar");
  if (user.shopName) place = user.shopName;
  else if (user.city) place = place + ", " + user.city;

  // the big mic in the middle of the phone tab bar
  const micTab = (
    <button className="mtab mtab-assistant" onClick={openVoice} aria-label={t("nav.assistant")}>
      <span className="mtab-mic">
        <Icon name="mic" size={24} />
      </span>
    </button>
  );

  return (
    <div className="shell">
      <aside className="sidebar">
        <NavLink to="/dashboard" className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-name">GoldLedger</span>
        </NavLink>

        <nav className="nav">
          <NavLink to="/dashboard" className="nav-link">
            <Icon name="overview" />
            {t("nav.overview")}
            {waiting > 0 && <span className="nav-count">{waiting}</span>}
          </NavLink>
          <NavLink to="/orders" className={() => "nav-link" + (onOrders ? " active" : "")}>
            <Icon name="orders" />
            {t("nav.orders")}
          </NavLink>
          {user.role === "jeweller" && (
            <NavLink to="/orders/new" className="nav-link nav-link-new">
              <Icon name="plus" />
              {t("nav.newOrder")}
            </NavLink>
          )}
        </nav>

        <button className="sidebar-voice" onClick={openVoice}>
          <span className="sidebar-voice-icon">
            <Icon name="mic" size={20} />
          </span>
          <span>
            <strong>{t("nav.assistant")}</strong>
            <small>{t("nav.assistantSub")}</small>
          </span>
        </button>

        <div className="sidebar-lang">
          <LanguageSwitch />
        </div>

        <div className="sidebar-user">
          <span className="avatar">{initials(user.name)}</span>
          <span className="sidebar-user-text">
            <strong>{user.name}</strong>
            <small>{place}</small>
          </span>
          <button
            className="icon-btn"
            onClick={() => setAskLogout(true)}
            title={t("nav.logout")}
            aria-label={t("nav.logout")}
          >
            <Icon name="logout" />
          </button>
        </div>
      </aside>

      {/* phones: top bar */}
      <header className="mobile-top">
        <NavLink to="/dashboard" className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-name">GoldLedger</span>
        </NavLink>
        <div className="mobile-top-actions">
          <LanguageSwitch />
          <button
            className="icon-btn"
            onClick={() => setAskLogout(true)}
            title={t("nav.logout")}
            aria-label={t("nav.logout")}
          >
            <Icon name="logout" />
          </button>
        </div>
      </header>

      <main className="main">
        <Outlet />
      </main>

      {/* phones: bottom tabs */}
      <nav className="mobile-tabs">
        <NavLink to="/dashboard" className="mtab">
          <span className="mtab-icon">
            <Icon name="overview" size={22} />
            {waiting > 0 && <span className="mtab-count">{waiting}</span>}
          </span>
          {t("nav.overview")}
        </NavLink>
        {user.role === "karigar" && micTab}
        <NavLink to="/orders" className={() => "mtab" + (onOrders ? " active" : "")}>
          <span className="mtab-icon">
            <Icon name="orders" size={22} />
          </span>
          {t("nav.orders")}
        </NavLink>
        {user.role === "jeweller" && micTab}
        {user.role === "jeweller" && (
          <NavLink to="/orders/new" className="mtab">
            <span className="mtab-icon">
              <Icon name="plus" size={22} />
            </span>
            {t("nav.newOrder")}
          </NavLink>
        )}
      </nav>

      {askLogout && (
        <Modal title={t("logout.title")} onClose={() => setAskLogout(false)}>
          <p className="modal-text">{t("logout.text")}</p>
          <div className="form-actions">
            <button className="btn" onClick={() => setAskLogout(false)}>
              {t("common.cancel")}
            </button>
            <button className="btn btn-danger" onClick={handleLogout} autoFocus>
              {t("logout.confirm")}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function AppLayout() {
  return (
    <LedgerProvider>
      <VoiceProvider>
        <Shell />
      </VoiceProvider>
    </LedgerProvider>
  );
}
