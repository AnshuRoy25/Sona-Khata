import { useState } from "react";
import { useLang } from "../context/LanguageContext.jsx";

function toText(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

// Form for gold moving on a running order.
// mode "issue": jeweller gives more gold. mode "return": karigar gives gold back.
export default function MovementForm({ mode, initial, onSubmit, onCancel, submitLabel }) {
  const { t } = useLang();
  const start = initial || {};
  const [weight, setWeight] = useState(toText(start.weightGrams));
  const [note, setNote] = useState(toText(start.note));
  const [isFinal, setIsFinal] = useState(Boolean(start.isFinal));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const grams = Number(weight);
    if (weight === "" || isNaN(grams) || grams <= 0) {
      setError(t("move.err.weight"));
      return;
    }

    const body = { weightGrams: grams };
    if (note.trim()) body.note = note.trim();
    if (mode === "return") body.isFinal = isFinal;

    setSaving(true);
    try {
      await onSubmit(body);
      setWeight("");
      setNote("");
      setIsFinal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  let defaultLabel = t("move.issueBtn");
  if (mode === "return") defaultLabel = t("move.returnBtn");

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor={mode + "-weight"}>{mode === "return" ? t("move.returned") : t("move.extra")}</label>
        <div className="input-unit">
          <input
            id={mode + "-weight"}
            type="number"
            step="0.001"
            min="0"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="0.000"
          />
          <span>g</span>
        </div>
      </div>

      <div className="field">
        <label htmlFor={mode + "-note"}>{t("form.note")}</label>
        <input
          id={mode + "-note"}
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={mode === "return" ? t("move.notePlaceholderReturn") : t("move.notePlaceholderIssue")}
        />
      </div>

      {mode === "return" && (
        <label className="check-row">
          <input type="checkbox" checked={isFinal} onChange={(e) => setIsFinal(e.target.checked)} />
          <span>
            {t("move.final")}
            <small>{t("move.finalHint")}</small>
          </span>
        </label>
      )}

      {error && <p className="notice notice-red">{error}</p>}

      <div className="form-actions">
        {onCancel && (
          <button type="button" className="btn" onClick={onCancel}>
            {t("common.cancel")}
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? t("common.saving") : submitLabel || defaultLabel}
        </button>
      </div>
    </form>
  );
}
