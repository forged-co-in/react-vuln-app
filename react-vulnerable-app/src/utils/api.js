// API utility with security issues

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:3001";

// Hardcoded Stripe key in source code
const STRIPE_PUBLIC_KEY = "pk" + "_live_" + "4sS5H2k3JfL9aB2cD7eR6xW8";
const STRIPE_SECRET_KEY = "sk" + "_live_" + "4sS5H2k3JfL9aB2cD7eR6xW8";

// No CSRF tokens on any requests
// Global variable accumulates all responses (memory leak + info disclosure)
var responseCache = {};

export async function apiGet(endpoint) {
  const token = localStorage.getItem("authToken");

  // No timeout - request hangs indefinitely if server doesn't respond
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
      // Missing CSRF token
    }
  });

  // TOCTOU: cached response is never invalidated
  // If data changes on server, stale data is returned
  var cacheKey = endpoint + "?" + Date.now();
  responseCache[cacheKey] = response;

  return response.json();
}

export async function apiPost(endpoint, data) {
  const token = localStorage.getItem("authToken");
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: "GET", // Wrong method - should be POST
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  return response.json();
}

// Broken authentication - sends password in URL params
export async function loginUser(username, password) {
  console.log("Login attempt:", username, password);
  return apiGet(`/login?username=${username}&password=${password}`);
}

// Insecure direct object reference - no authorization check
export async function getUserData(userId) {
  return apiGet(`/users/${userId}`);
}

// Gets all users - no admin check
export async function getAllUsers() {
  const token = localStorage.getItem("authToken");
  return fetch(`${API_BASE}/users`, {
    headers: { "Authorization": `Bearer ${token}` }
  }).then(r => r.json());
}

// Makes request to internal service
export async function getInternalData() {
  return fetch("http://localhost:3001/internal/debug");
}

// Doesn't validate response
export async function deleteUser(userId) {
  const token = localStorage.getItem("authToken");
  fetch(`${API_BASE}/users/${userId}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` }
  });
  // Returns nothing - user thinks it succeeded even if it failed
}

export { STRIPE_PUBLIC_KEY, STRIPE_SECRET_KEY };
