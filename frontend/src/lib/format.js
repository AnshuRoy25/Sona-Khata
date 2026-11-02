import { dateLocale } from "./i18n.js";

// ---------- weights ----------

export function mgToGrams(mg) {
  return (mg || 0) / 1000;
}

// 100 → "100.000"
export function formatGrams(grams) {
  const value = Number(grams || 0);
  return value.toLocaleString("en-IN", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

// short form for sentences: 100 → "100", 1.5 → "1.5"
export function shortGrams(grams) {
  const value = Number(grams || 0);
  return value.toLocaleString("en-IN", { maximumFractionDigits: 3 });
}

// ---------- money ----------

export function formatRupees(amount) {
  const value = Number(amount || 0);
  return "₹" + value.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

// ---------- dates ----------

export function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(dateLocale(), { day: "numeric", month: "short", year: "numeric" });
}

export function formatShortDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(dateLocale(), { day: "numeric", month: "short" });
}

export function formatDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  const date = d.toLocaleDateString(dateLocale(), { day: "numeric", month: "short" });
  const time = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  return date + ", " + time;
}

// "22 November", used in spoken sentences
export function spokenDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "long" });
}

// whole days from today to a date, negative if the date has passed
export function daysFromToday(value) {
  const target = new Date(value);
  const today = new Date();
  target.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today) / (24 * 60 * 60 * 1000));
}

// today as YYYY-MM-DD (for date inputs)
export function todayInput() {
  return toDateInput(new Date());
}

export function toDateInput(date) {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + month + "-" + day;
}

// which greeting key to use: dash.morning / dash.afternoon / dash.evening
export function greetingKey() {
  const hour = new Date().getHours();
  if (hour < 12) return "dash.morning";
  if (hour < 17) return "dash.afternoon";
  return "dash.evening";
}

// "Tuesday, 3 November" in the current language
export function dateLongToday() {
  return new Date().toLocaleDateString(dateLocale(), { weekday: "long", day: "numeric", month: "long" });
}
