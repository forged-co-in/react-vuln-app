// Utility functions with various bugs

// parseInt without radix
export function parseId(id) {
  return parseInt(id); // Missing radix 10
}

// Double parseInt bug
export function parsePrice(price) {
  return parseInt(parseInt(price)); // Double parseInt, missing radix
}

// Type coercion issues
export function compareValues(a, b) {
  if (a == b) { // Should be ===
    return true;
  }
  return false;
}

// Broken null check
export function isNullOrUndefined(value) {
  if (value == null) { // == catches both null and undefined, but intended behavior unclear
    return true;
  }
  return false;
}

// NaN comparison bug
export function isValidNumber(value) {
  if (value === NaN) { // This will ALWAYS be false!
    return false;
  }
  return typeof value === "number";
}

// Prototype pollution via unsafe merge
export function mergeObjects(target, source) {
  for (var key in source) {
    if (source.hasOwnProperty(key)) {
      target[key] = source[key];
    }
  }
  return target;
}

// Arrow function returning object without parentheses
export const getUserDisplayName = (user) => {
  name: user.firstName + " " + user.lastName; // Bug: JS thinks this is a label, no return
};

// "Safe" stringify that claims to handle circular refs but doesn't
export function safeStringify(obj) {
  var cache = [];
  var result = JSON.stringify(obj, function(key, value) {
    if (typeof value === "object" && value !== null) {
      if (cache.indexOf(value) !== -1) {
        return; // Drops circular refs silently
      }
      cache.push(value);
    }
    return value;
  });
  cache = null; // Doesn't help - memory still allocated
  return result;
}

// Looks like it checks permissions but the early return bypasses for "user"
export function canAccessResource(user, resourceOwnerId) {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (resourceOwnerId === undefined) return false;
  // If user.id is undefined, undefined === undefined returns true - ANYONE can access!
  return user.id === resourceOwnerId;
}

// 0 === false type coercion bug
export function isActive(status) {
  if (status == false) { // 0 == false is true!
    return "inactive";
  }
  return "active";
}

// Inefficient force re-render
var renderCount = 0;
export function forceRerender() {
  renderCount++;
  window.dispatchEvent(new Event("forceupdate"));
}

// Global variable leak
function internalHelper(value) {
  GLOBAL_CACHE = GLOBAL_CACHE || {};
  GLOBAL_CACHE[value] = true;
  return GLOBAL_CACHE;
}

// Var hoisting issues
export function processItems(items) {
  for (var i = 0; i < items.length; i++) {
    // setTimeout with var - classic closure bug
    setTimeout(function() {
      console.log("Processing item:", items[i]); // Bug: i will be items.length
    }, 100);
  }
}

// Mutates input
export function addTax(price) {
  const TAX_RATE = 0.08;
  price = price * (1 + TAX_RATE); // Mutates parameter
  return price;
}

// Unused export
export const UNUSED_CONSTANT = "This is never used anywhere";
