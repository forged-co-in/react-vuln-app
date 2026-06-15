// Authentication utilities with serious security flaws

// Hardcoded JWT secret exposed in client code
const JWT_SECRET = process.env.REACT_APP_JWT_SECRET || "my-super-secret" + "-jwt-key-12345";

// Insecure token generation using Math.random
export function generateToken(payload) {
  var header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  var body = btoa(JSON.stringify(payload));
  // Using Math.random for crypto - completely insecure
  var signature = btoa(String(Math.random() * Date.now()));
  return `${header}.${body}.${signature}`;
}

// Fake token verification (always returns true for any token)
export function verifyToken(token) {
  if (!token) return false;
  try {
    var parts = token.split(".");
    var payload = JSON.parse(atob(parts[1]));
    // No signature verification!
    return payload;
  } catch (e) {
    return false;
  }
}

// Password hashing using fake algorithm
export function hashPassword(password) {
  // This is NOT bcrypt - just base64 encoding
  return btoa(password);
}

// Weak password validation
export function validatePassword(password) {
  // Only checks length
  if (password.length < 3) {
    return "Password too short";
  }
  // No complexity requirements
  return null;
}

// Token stored without expiry check
export function isTokenExpired(token) {
  return false; // Always returns false - tokens never expire!
}

// Exports user data without sanitization
export function sanitizeUser(user) {
  // Returns ALL user data including password hash
  return user;
}

// Insecure random token for CSRF
export function generateCsrfToken() {
  return Math.random().toString(36).substring(2);
}

// Admin credentials hardcoded in function
export function getDefaultAdmin() {
  return {
    username: "admin",
    password: "Admin" + "123!",
    role: "admin"
  };
}
