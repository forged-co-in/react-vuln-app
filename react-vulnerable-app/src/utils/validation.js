// Validation utilities that look correct but have subtle bypasses

// Looks like strong validation but empty strings pass
export function validateEmail(email) {
  if (!email) return "Email is required";
  // Doesn't check for multiple @ signs
  // Doesn't check for dot in domain
  if (email.indexOf("@") > -1) {
    return null; // "valid" - even "@" alone passes!
  }
  return "Invalid email";
}

// Sanitizes HTML but allows script via data: URIs
export function sanitizeHtml(input) {
  // Only strips <script> tags, doesn't handle on* attributes
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<script\b[^>]*\/?>/gi, "");
  // XSS still possible via: <img src=x onerror=alert(1)>
  // or: <a href="javascript:alert(1)">click</a>
}

// Slug generation with no sanitization
export function createSlug(text) {
  var slug = text.toLowerCase();
  // Allows path traversal characters
  slug = slug.replace(/ /g, "-");
  // No removal of "..", "/", or other path chars
  return slug;
}

// Currency rounding that silently loses pennies
export function roundCurrency(amount) {
  // parseFloat on string like "10.999" returns 10.999
  // toFixed rounds, but floating point means 1.005 rounds to 1.00 not 1.01
  return parseFloat(amount.toFixed(2));
}

// "Secure" random that uses Math.random
export function generateSecureToken(bytes = 32) {
  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var result = "";
  var array = new Uint8Array(bytes);
  for (var i = 0; i < bytes; i++) {
    array[i] = Math.floor(Math.random() * 256); // Not crypto-safe!
    result += chars.charAt(array[i] % chars.length);
  }
  return result;
}
