import { useState } from "react";
import { todayInput } from "../lib/format.js";
import { useLang } from "../context/LanguageContext.jsx";

const PHONE_REGEX = /^[6-9]\d{9}$/;

function toText(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

// Form for a new order.
// knownKarigars: [{ name, phone }] the jeweller has worked with
export default function OrderForm({ knownKarigars, onSubmit, submitLabel, onCancel }) {
  const { t } = useLang();
  const start = {};
  const karigars = knownKarigars || [];

  const [values, setValues] = useState({
    karigarPhone: toText(start.karigarPhone),
    item: toText(start.item),
    quantity: toText(start.quantity || 1),
    weightGrams: toText(start.weightGrams),
    wastageGrams: toText(start.wastageGrams),
    labourCharge: toText(start.labourCharge),
    deadline: toText(start.deadline),
    occasionDate: toText(start.occasionDate),
    note: toText(start.note),
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");

  function setField(name, value) {
    const next = Object.assign({}, values);
    next[name] = value;
    setValues(next);
  }

  // name of the karigar whose phone is typed, if we know them
  let matchedName = "";
  for (let i = 0; i < karigars.length; i++) {
    if (karigars[i].phone === values.karigarPhone) matchedName = karigars[i].name;
  }

  function validate() {
    const found = {};
    const weight = Number(values.weightGrams);
    const wastage = Number(values.wastageGrams);

    if (!PHONE_REGEX.test(values.karigarPhone)) found.karigarPhone = t("form.err.phone");
    if (!values.item.trim()) found.item = t("form.err.item");
    if (values.weightGrams === "" || isNaN(weight) || weight <= 0) found.weightGrams = t("form.err.weight");
    if (values.wastageGrams === "" || isNaN(wastage) || wastage < 0) {
      found.wastageGrams = t("form.err.wastage");
    } else if (weight > 0 && wastage >= weight) {
      found.wastageGrams = t("form.err.wastageBig");
    }
    if (!values.deadline) {
      found.deadline = t("form.err.deadline");
    } else if (values.deadline <= todayInput()) {
      found.deadline = t("form.err.deadlinePast");
    }

    setErrors(found);
    return Object.keys(found).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setServerError("");
    if (!validate()) return;

    const body = {
      karigarPhone: values.karigarPhone,
      item: values.item.trim(),
      quantity: Number(values.quantity) || 1,
      weightGrams: Number(values.weightGrams),
      wastageGrams: Number(values.wastageGrams),
      labourCharge: values.labourCharge === "" ? 0 : Number(values.labourCharge),
      deadline: values.deadline,
    };
    if (values.occasionDate) body.occasionDate = values.occasionDate;
    if (values.note.trim()) body.note = values.note.trim();

    setSaving(true);
    try {
      await onSubmit(body);
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const karigarOptions = [];
  for (let i = 0; i < karigars.length; i++) {
    karigarOptions.push(
      <option key={karigars[i].phone} value={karigars[i].phone}>
        {karigars[i].name}
      </option>
    );
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor="karigarPhone">{t("form.karigarPhone")}</label>
        <input
          id="karigarPhone"
          type="tel"
          inputMode="numeric"
          maxLength={10}
          list="known-karigars"
          value={values.karigarPhone}
          onChange={(e) => setField("karigarPhone", e.target.value.replace(/\D/g, ""))}
          placeholder={t("form.phonePlaceholder")}
        />
        <datalist id="known-karigars">{karigarOptions}</datalist>
        {matchedName && !errors.karigarPhone && <span className="field-hint">{matchedName}</span>}
        {errors.karigarPhone && <span className="field-error">{errors.karigarPhone}</span>}
      </div>

      <div className="field-row">
        <div className="field grow">
          <label htmlFor="item">{t("form.item")}</label>
          <input
            id="item"
            type="text"
            value={values.item}
            onChange={(e) => setField("item", e.target.value)}
            placeholder={t("form.itemPlaceholder")}
          />
          {errors.item && <span className="field-error">{errors.item}</span>}
        </div>
        <div className="field narrow">
          <label htmlFor="quantity">{t("form.pieces")}</label>
          <input
            id="quantity"
            type="number"
            min="1"
            value={values.quantity}
            onChange={(e) => setField("quantity", e.target.value)}
          />
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="weightGrams">{t("form.goldIssued")}</label>
          <div className="input-unit">
            <input
              id="weightGrams"
              type="number"
              step="0.001"
              min="0"
              value={values.weightGrams}
              onChange={(e) => setField("weightGrams", e.target.value)}
              placeholder="0.000"
            />
            <span>g</span>
          </div>
          {errors.weightGrams && <span className="field-error">{errors.weightGrams}</span>}
        </div>
        <div className="field">
          <label htmlFor="wastageGrams">{t("form.wastage")}</label>
          <div className="input-unit">
            <input
              id="wastageGrams"
              type="number"
              step="0.001"
              min="0"
              value={values.wastageGrams}
              onChange={(e) => setField("wastageGrams", e.target.value)}
              placeholder="0.000"
            />
            <span>g</span>
          </div>
          {errors.wastageGrams && <span className="field-error">{errors.wastageGrams}</span>}
        </div>
        <div className="field">
          <label htmlFor="labourCharge">{t("form.labour")}</label>
          <div className="input-unit input-unit-left">
            <span>₹</span>
            <input
              id="labourCharge"
              type="number"
              min="0"
              value={values.labourCharge}
              onChange={(e) => setField("labourCharge", e.target.value)}
              placeholder="0"
            />
          </div>
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="deadline">{t("form.deadline")}</label>
          <input
            id="deadline"
            type="date"
            min={todayInput()}
            value={values.deadline}
            onChange={(e) => setField("deadline", e.target.value)}
          />
          {errors.deadline && <span className="field-error">{errors.deadline}</span>}
        </div>
        <div className="field">
          <label htmlFor="occasionDate">{t("form.occasion")}</label>
          <input
            id="occasionDate"
            type="date"
            value={values.occasionDate}
            onChange={(e) => setField("occasionDate", e.target.value)}
          />
          <span className="field-hint">{t("form.occasionHint")}</span>
        </div>
      </div>

      <div className="field">
        <label htmlFor="note">{t("form.note")}</label>
        <input
          id="note"
          type="text"
          value={values.note}
          onChange={(e) => setField("note", e.target.value)}
          placeholder={t("form.notePlaceholder")}
        />
      </div>

      {serverError && <p className="notice notice-red">{serverError}</p>}

      <div className="form-actions">
        {onCancel && (
          <button type="button" className="btn" onClick={onCancel}>
            {t("common.cancel")}
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? t("common.saving") : submitLabel || t("form.issue")}
        </button>
      </div>
    </form>
  );
}
