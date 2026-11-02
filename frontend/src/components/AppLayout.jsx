import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import Icon from "./Icon.jsx";
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
  const navigate = useNavigate();
  const location = useLocation();

  // "Orders" covers the list and order pages, but not the new order form
  const onOrders = location.pathname.startsWith("/orders") && location.pathname !== "/orders/new";

  const waiting = countWaiting(ledger, user.role);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  let place = user.role === "jeweller" ? "Jeweller" : "Karigar";
  if (user.shopName) place = user.shopName;
  else if (user.city) place = place + ", " + user.city;

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-name">GoldLedger</span>
        </div>

        <nav className="nav">
          <NavLink to="/" end className="nav-link">
            <Icon name="overview" />
            Overview
            {waiting > 0 && <span className="nav-count">{waiting}</span>}
          </NavLink>
          <NavLink to="/orders" className={() => "nav-link" + (onOrders ? " active" : "")}>
            <Icon name="orders" />
            Orders
          </NavLink>
          {user.role === "jeweller" && (
            <NavLink to="/orders/new" className="nav-link nav-link-new">
              <Icon name="plus" />
              New order
            </NavLink>
          )}
        </nav>

        <button className="sidebar-voice" onClick={openVoice}>
          <span className="sidebar-voice-icon">
            <Icon name="mic" size={20} />
          </span>
          <span>
            <strong>Talk to assistant</strong>
            <small>Hindi, English or both</small>
          </span>
        </button>

        <div className="sidebar-user">
          <span className="avatar">{initials(user.name)}</span>
          <span className="sidebar-user-text">
            <strong>{user.name}</strong>
            <small>{place}</small>
          </span>
          <button className="icon-btn" onClick={handleLogout} title="Log out" aria-label="Log out">
            <Icon name="logout" />
          </button>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>

      <button className="fab-voice" onClick={openVoice} aria-label="Talk to assistant">
        <Icon name="mic" size={24} />
      </button>
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
