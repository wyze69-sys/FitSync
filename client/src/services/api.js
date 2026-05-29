/**
 * Base API utility for making authenticated HTTP requests.
 * All service files use this to communicate with the backend.
 */

const API_BASE = "/api";

/**
 * Get the stored auth token from localStorage.
 */
function getToken() {
  return localStorage.getItem("fitsync_token");
}

/**
 * Make an authenticated API request.
 * @param {string} endpoint - API endpoint path (e.g., "/workouts")
 * @param {object} options - fetch options (method, body, etc.)
 * @returns {Promise<any>} Parsed JSON response
 */
async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (options.body && typeof options.body === "object" && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error || `Request failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return data;
}

export { apiRequest, getToken, API_BASE };
