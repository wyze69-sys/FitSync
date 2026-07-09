/**
 * Central API client for FitSync.
 *
 * Single source of truth for:
 *  - the API base URL,
 *  - auth token storage (localStorage),
 *  - the Authorization header,
 *  - JSON serialization, and
 *  - error handling.
 *
 * Every service in this folder builds on top of `apiClient`, so components never
 * call `fetch` or touch `localStorage` directly.
 */

const API_BASE = "/api";
const TOKEN_KEY = "fitsync_token";

const tokenStore = {
  get() {
    return localStorage.getItem(TOKEN_KEY);
  },
  set(token) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
  }
};

function buildQueryString(params) {
  if (!params) return "";
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.append(key, value);
    }
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

async function request(endpoint, { method = "GET", body, params, headers = {} } = {}) {
  const token = tokenStore.get();
  const finalHeaders = { ...headers };

  if (token) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  const options = { method, headers: finalHeaders };

  if (body !== undefined) {
    finalHeaders["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}${buildQueryString(params)}`, options);

  // Some endpoints (or errors) may not return JSON; guard the parse.
  let data = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (err) {
      data = null;
    }
  }

  if (!response.ok) {
    const message = (data && data.error) || `Request failed with status ${response.status}`;
    
    // Auto-logout mid-session for invalid token or account deactivation
    const isDeactivated = response.status === 403 && String(message).toLowerCase().includes("deactivated");
    if (response.status === 401 || isDeactivated) {
      tokenStore.clear();
      if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
        window.location.href = "/login";
      }
    }

    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data;
}

const apiClient = {
  get: (endpoint, params) => request(endpoint, { method: "GET", params }),
  post: (endpoint, body) => request(endpoint, { method: "POST", body }),
  put: (endpoint, body) => request(endpoint, { method: "PUT", body }),
  del: (endpoint) => request(endpoint, { method: "DELETE" }),
  request,
  token: tokenStore,
  API_BASE
};

export { apiClient, tokenStore, API_BASE };
export default apiClient;
