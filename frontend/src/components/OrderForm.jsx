import { useState } from "react";
import { todayInput } from "../lib/format.js";

const PHONE_REGEX = /^[6-9]\d{9}$/;

function toText(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

// Form for a new order. Used for typing an order and for checking a voice draft.
// initial: values to start with (e.g. from a voice draft)
// knownKarigars: [{ name, phone }] the jeweller has worked with
export default function OrderForm({ initial, knownKarigars, onSubmit, submitLabel, onCancel }) {
  const start = initial || {};
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

    if (!PHONE_REGEX.test(values.karigarPhone)) found.karigarPhone = "Enter the karigar's 10 digit mobile number";
    if (!values.item.trim()) found.item = "What is being made?";
    if (values.weightGrams === "" || isNaN(weight) || weight <= 0) found.weightGrams = "Enter the gold weight in grams";
    if (values.wastageGrams === "" || isNaN(wastage) || wastage < 0) {
      found.wastageGrams = "Enter the agreed wastage (0 is fine)";
    } else if (weight > 0 && wastage >= weight) {
      found.wastageGrams = "Wastage must be less than the weight issued";
    }
    if (!values.deadline) {
      found.deadline = "Pick a deadline";
    } else if (values.deadline <= todayInput()) {
      found.deadline = "Deadline must be after today";
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
      {start.karigarName && !start.karigarPhone && (
        <p className="notice notice-amber">
          {start.karigarName} is not one of your karigars yet. Enter their phone number. They need a GoldLedger account.
        </p>
      )}

      <div className="field">
        <label htmlFor="karigarPhone">Karigar's phone</label>
        <input
          id="karigarPhone"
          type="tel"
          inputMode="numeric"
          maxLength={10}
          list="known-karigars"
          value={values.karigarPhone}
          onChange={(e) => setField("karigarPhone", e.target.value.replace(/\D/g, ""))}
          placeholder="10 digit mobile number"
        />
        <datalist id="known-karigars">{karigarOptions}</datalist>
        {matchedName && !errors.karigarPhone && <span className="field-hint">{matchedName}</span>}
        {errors.karigarPhone && <span className="field-error">{errors.karigarPhone}</span>}
      </div>

      <div className="field-row">
        <div className="field grow">
          <label htmlFor="item">Item</label>
          <input
            id="item"
            type="text"
            value={values.item}
            onChange={(e) => setField("item", e.target.value)}
            placeholder="e.g. Rani haar, Kangan"
          />
          {errors.item && <span className="field-error">{errors.item}</span>}
        </div>
        <div className="field narrow">
          <label htmlFor="quantity">Pieces</label>
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
          <label htmlFor="weightGrams">Gold issued</label>
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
          <label htmlFor="wastageGrams">Agreed wastage</label>
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
          <label htmlFor="labourCharge">Labour charge</label>
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
          <label htmlFor="deadline">Deadline</label>
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
          <label htmlFor="occasionDate">Occasion date (optional)</label>
          <input
            id="occasionDate"
            type="date"
            value={values.occasionDate}
            onChange={(e) => setField("occasionDate", e.target.value)}
          />
          <span className="field-hint">A wedding or festival that cannot move</span>
        </div>
      </div>

      <div className="field">
        <label htmlFor="note">Note (optional)</label>
        <input
          id="note"
          type="text"
          value={values.note}
          onChange={(e) => setField("note", e.target.value)}
          placeholder="Design details, stones, anything to remember"
        />
      </div>

      {serverError && <p className="notice notice-red">{serverError}</p>}

      <div className="form-actions">
        {onCancel && (
          <button type="button" className="btn" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving..." : submitLabel || "Issue gold"}
        </button>
      </div>
    </form>
  );
}
