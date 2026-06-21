const API_BASE = "http://localhost:3000/api";

export async function loginUser(username, password) {
  const response = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  return response.json();
}

export async function verifyAdmin2Fa(username, otp) {
  const response = await fetch(`${API_BASE}/verify-2fa`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, otp })
  });
  return response.json();
}

export async function fetchUserCartFromServer(username) {
  const response = await fetch(`${API_BASE}/cart/${username}`);
  if (!response.ok) return { items: [] };
  return response.json();
}

export async function syncUserCartToServer(username, cartItems) {
  const response = await fetch(`${API_BASE}/cart/${username}/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: cartItems })
  });
  return response.json();
}

export async function adminGetAllUsers() {
  const response = await fetch(`${API_BASE}/admin/users`);
  return response.json();
}

export async function adminDeleteTargetUser(username) {
  const response = await fetch(`${API_BASE}/admin/users/${username}`, {
    method: "DELETE"
  });
  return response.json();
}
// Add these back onto the bottom of your src/utils/api.js ONLY if your legacy widgets still use them:
export async function apiGet(endpoint) {
  const response = await fetch(`http://localhost:3000/api${endpoint}`);
  return response.json();
}

export async function apiPost(endpoint, data) {
  const response = await fetch(`http://localhost:3000/api${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return response.json();
}
// ✅ FIX: Export getUserData so UserProfile.js can successfully import it
export async function getUserData(userId) {
  return apiGet(`/users/${userId}`);
}

// Admin Product Management Requests
export async function adminAddProduct(productData) {
  return apiPost('/admin/products', productData);
}

export async function adminUpdateProduct(productId, productData) {
  const token = localStorage.getItem("authToken");
  const response = await fetch(`http://localhost:3000/api/admin/products/${productId}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(productData)
  });
  return response.json();
}

export async function adminDeleteProduct(productId) {
  const token = localStorage.getItem("authToken");
  const response = await fetch(`http://localhost:3000/api/admin/products/${productId}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` }
  });
  return response.json();
}

// Admin User Modification Request
export async function adminUpdateUserData(username, updatedData) {
  const token = localStorage.getItem("authToken");
  const response = await fetch(`http://localhost:3000/api/admin/users/${username}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(updatedData)
  });
  return response.json();
}

export async function fetchLiveProducts() {
  const response = await fetch("http://localhost:3000/api/products");
  return response.json();
}

// ==========================================
// PROMO CODE VALIDATION API HELPER
// ==========================================
export async function validatePromoCode(couponCodeString) {
  const response = await fetch("http://localhost:3000/api/cart/validate-promo", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ code: couponCodeString })
  });
  return response.json();
}
// Feature 2 & 3 checkout pipelines
export async function checkoutUserCart(checkoutPayload) {
  const response = await fetch("http://localhost:3000/api/orders/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(checkoutPayload)
  });
  return response.json();
}

export async function fetchUserOrderHistory(username) {
  const response = await fetch(`http://localhost:3000/api/orders/${username}`);
  return response.json();
}

// Feature 5 product comments pipeline queries
export async function submitProductReview(productId, reviewData) {
  const response = await fetch(`http://localhost:3000/api/products/${productId}/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(reviewData)
  });
  return response.json();
}

export async function fetchProductReviews(productId) {
  const response = await fetch(`http://localhost:3000/api/products/${productId}/reviews`);
  return response.json();
}