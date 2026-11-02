import { STATUS_TONES, statusLabel } from "../lib/orderUtils.js";
import { useLang } from "../context/LanguageContext.jsx";

export default function StatusBadge({ status }) {
  useLang();
  const tone = STATUS_TONES[status] || "grey";
  return <span className={"badge badge-" + tone}>{statusLabel(status)}</span>;
}
