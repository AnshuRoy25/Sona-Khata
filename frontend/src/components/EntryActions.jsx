import { useState } from "react";
import { confirmEntry, rejectEntry } from "../api/endpoints.js";
import { useToast } from "../context/ToastContext.jsx";
import { notifyLedgerChanged } from "../hooks/useLedger.js";
import Icon from "./Icon.jsx";
import SpeakButton from "./SpeakButton.jsx";

// Confirm / Reject buttons for an entry that is waiting on the viewer
export default function EntryActions({ transaction, speechText, onDone }) {
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const toast = useToast();

  async function handleConfirm() {
    setBusy(true);
    try {
      await confirmEntry(transaction._id);
      toast.success("Entry confirmed");
      notifyLedgerChanged();
      if (onDone) onDone();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleReject(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await rejectEntry(transaction._id, reason.trim());
      toast.success("Entry rejected");
      setRejecting(false);
      notifyLedgerChanged();
      if (onDone) onDone();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (rejecting) {
    return (
      <form className="reject-form" onSubmit={handleReject}>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="What is wrong? e.g. only 98 g received"
          autoFocus
        />
        <button type="submit" className="btn btn-danger btn-sm" disabled={busy}>
          Reject entry
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRejecting(false)}>
          Cancel
        </button>
      </form>
    );
  }

  return (
    <div className="entry-actions">
      <button className="btn btn-primary btn-sm" onClick={handleConfirm} disabled={busy}>
        <Icon name="check" size={16} />
        Confirm
      </button>
      <button className="btn btn-sm" onClick={() => setRejecting(true)} disabled={busy}>
        Reject
      </button>
      {speechText && <SpeakButton text={speechText} small />}
    </div>
  );
}
