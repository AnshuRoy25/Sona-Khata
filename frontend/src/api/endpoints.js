import { request } from "./client.js";

// ---------- auth ----------

export function sendLoginOtp(phone) {
  return request("/auth/login/send-otp", { method: "POST", body: { phone: phone } });
}

export function verifyLoginOtp(phone, otp) {
  return request("/auth/login/verify-otp", { method: "POST", body: { phone: phone, otp: otp } });
}

// details = { phone, name, role, language, shopName, city }
export function sendRegisterOtp(details) {
  return request("/auth/register/send-otp", { method: "POST", body: details });
}

export function verifyRegisterOtp(phone, otp) {
  return request("/auth/register/verify-otp", { method: "POST", body: { phone: phone, otp: otp } });
}

export function getMe() {
  return request("/user/me");
}

// ---------- orders ----------

export function listOrders() {
  return request("/orders");
}

// returns { order, transactions, summary }
export function getOrder(id) {
  return request("/orders/" + id);
}

// body = { karigarPhone, item, quantity, weightGrams, wastageGrams, labourCharge, deadline, occasionDate, note }
export function createOrder(body) {
  return request("/orders", { method: "POST", body: body });
}

// jeweller gives more gold on a running order
export function issueExtraGold(orderId, body) {
  return request("/orders/" + orderId + "/issues", { method: "POST", body: body });
}

// karigar gives gold / finished work back
export function recordReturn(orderId, body) {
  return request("/orders/" + orderId + "/returns", { method: "POST", body: body });
}

// ---------- entries (transactions) ----------

export function confirmEntry(transactionId) {
  return request("/transactions/" + transactionId + "/confirm", { method: "POST", body: {} });
}

export function rejectEntry(transactionId, reason) {
  return request("/transactions/" + transactionId + "/reject", {
    method: "POST",
    body: { reason: reason },
  });
}

// ---------- assistant ----------

// history = [{ role: "user" | "assistant", content }], last one is the user's message
// returns { reply, toolsUsed }
export function agentChat(history) {
  return request("/agent/chat", { method: "POST", body: { history: history } });
}

// audio + earlier history → { transcript, reply, toolsUsed }
export function agentVoice(audioBlob, history) {
  const form = new FormData();
  form.append("audio", audioBlob, "speech.wav");
  form.append("history", JSON.stringify(history));
  return request("/agent/voice", { method: "POST", form: form });
}

// text → mp3 blob (Gnani Timbre)
export function fetchSpeech(text) {
  return request("/voice/speak", { method: "POST", body: { text: text }, expect: "blob" });
}
