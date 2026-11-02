import { Link, useNavigate } from "react-router-dom";
import { createOrder } from "../api/endpoints.js";
import { useLedgerData, collectPeople } from "../context/LedgerContext.jsx";
import { useVoice } from "../context/VoiceContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { notifyLedgerChanged } from "../hooks/useLedger.js";
import OrderForm from "../components/OrderForm.jsx";
import Icon from "../components/Icon.jsx";

export default function NewOrderPage() {
  const ledger = useLedgerData();
  const { openVoice } = useVoice();
  const toast = useToast();
  const navigate = useNavigate();

  const karigars = collectPeople(ledger.orders, "jeweller");

  async function handleSubmit(body) {
    const data = await createOrder(body);
    toast.success("Order " + data.order.orderNo + " created. Waiting for the karigar to confirm.");
    notifyLedgerChanged();
    navigate("/orders/" + data.order._id);
  }

  return (
    <div className="page page-narrow">
      <Link to="/orders" className="back-link">
        <Icon name="back" size={16} />
        Orders
      </Link>

      <header className="page-head">
        <div>
          <h1>New order</h1>
          <p className="muted">
            The gold is recorded as issued by you. It counts in the ledger once the karigar confirms receiving it.
          </p>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={openVoice}>
            <Icon name="mic" size={16} />
            Speak it instead
          </button>
        </div>
      </header>

      <section className="panel panel-pad">
        <OrderForm knownKarigars={karigars} onSubmit={handleSubmit} onCancel={() => navigate(-1)} />
      </section>
    </div>
  );
}
