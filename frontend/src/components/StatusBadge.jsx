import { STATUS_INFO } from "../lib/orderUtils.js";

export default function StatusBadge({ status }) {
  const info = STATUS_INFO[status] || { label: status, tone: "grey" };
  return <span className={"badge badge-" + info.tone}>{info.label}</span>;
}
