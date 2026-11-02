import { Link, useNavigate } from "react-router-dom";
import { createOrder } from "../api/endpoints.js";
import { useLedgerData, collectPeople } from "../context/LedgerContext.jsx";
import { useVoice } from "../context/VoiceContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useLang } from "../context/LanguageContext.jsx";
import { usePageTitle } from "../hooks/usePageTitle.js";
import { notifyLedgerChanged } from "../hooks/useLedger.js";
import OrderForm from "../components/OrderForm.jsx";
import Icon from "../components/Icon.jsx";

export default function NewOrderPage() {
  const ledger = useLedgerData();
  const { openVoice } = useVoice();
  const toast = useToast();
  const navigate = useNavigate();
  const { t } = useLang();
  usePageTitle(t("new.title"));

  const karigars = collectPeople(ledger.orders, "jeweller");

  async function handleSubmit(body) {
    const data = await createOrder(body);
    toast.success(t("new.created", { orderNo: data.order.orderNo }));
    notifyLedgerChanged();
    navigate("/orders/" + data.order._id);
  }

  return (
    <div className="page page-narrow">
      <Link to="/orders" className="back-link">
        <Icon name="back" size={16} />
        {t("nav.orders")}
      </Link>

      <header className="page-head">
        <div>
          <h1>{t("new.title")}</h1>
          <p className="muted">{t("new.text")}</p>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={openVoice}>
            <Icon name="mic" size={16} />
            {t("new.speak")}
          </button>
        </div>
      </header>

      <section className="panel panel-pad">
        <OrderForm knownKarigars={karigars} onSubmit={handleSubmit} onCancel={() => navigate(-1)} />
      </section>
    </div>
  );
}
