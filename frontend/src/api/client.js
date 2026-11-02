import { API_URL } from "../config.js";

const TOKEN_KEY = "goldledger_token";
const USER_KEY = "goldledger_user";

// ---------- saved login ----------

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getSavedUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

export function saveLogin(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearLogin() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// ---------- requests ----------

// called when the backend says the token is no longer valid
let onUnauthorized = null;
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

// options: { method, body (object, sent as JSON), form (FormData), expect: "json" | "blob" }
export async function request(path, options) {
  const opts = options || {};
  const headers = {};

  const token = getToken();
  if (token) {
    headers["Authorization"] = "Bearer " + token;
  }

  let body;
  if (opts.form) {
    body = opts.form; // the browser sets the multipart header itself
  } else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }

  let response;
  try {
    response = await fetch(API_URL + path, {
      method: opts.method || "GET",
      headers: headers,
      body: body,
    });
  } catch (err) {
    throw new Error("Cannot reach the server. Check that the backend is running.");
  }

  if (response.status === 401 && token) {
    if (onUnauthorized) onUnauthorized();
    throw new Error("Your session has ended. Please log in again.");
  }

  if (!response.ok) {
    let message = "Something went wrong (" + response.status + ")";
    try {
      const data = await response.json();
      if (data && data.message) message = data.message;
    } catch (err) {
      // body was not JSON, keep the default message
    }
    throw new Error(message);
  }

  if (opts.expect === "blob") {
    return response.blob();
  }
  return response.json();
}
