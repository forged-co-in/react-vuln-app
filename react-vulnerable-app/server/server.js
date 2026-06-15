// Mock backend server with security issues
const http = require("http");
const url = require("url");
const fs = require("fs");

const HOST = "0.0.0.0"; // Binds to all interfaces
const PORT = 3001;
const ADMIN_PASSWORD = "Admin" + "123!";

// In-memory database simulation
const database = {
  users: [
    { id: 1, username: "admin", password: "Admin" + "123!", role: "admin", email: "admin@vulnerable-app.com", lastLoginIp: "192.168.1.1", internalId: "INT-001", creditCard: "4111" + "-1111-1111-1111" },
    { id: 2, username: "testuser", password: "pass" + "word123", role: "user", email: "test@example.com", lastLoginIp: "10.0.0.5", internalId: "INT-002" },
    { id: 3, username: "guest", password: "guest", role: "user", email: "guest@example.com", lastLoginIp: "10.0.0.6", internalId: "INT-003" }
  ]
};

// SQL injection vulnerability (simulated)
function getUserByUsername(username) {
  // Vulnerable: Direct string interpolation
  var query = "SELECT * FROM users WHERE username = '" + username + "'";
  console.log("Executing query:", query);
  return database.users.find(u => u.username === username);
}

// CORS misconfiguration
const server = http.createServer((req, res) => {
  // Allows all origins
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  // Allows credentials with wildcard origin (invalid but dangerous)
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // No CSRF protection
  // No Content-Security-Policy header
  // No X-Content-Type-Options header
  // No X-Frame-Options header

  // url.parse is deprecated - use URL constructor instead
  // Subtle: url.parse handles URLs without protocol differently than URL
  // If req.url is "//evil.com/admin", pathname becomes "//evil.com/admin"
  var parsed = url.parse(req.url, true);
  var path = parsed.pathname;
  var query = parsed.query;
  var hostname = parsed.hostname || req.headers.host; // Host header trust!

  // Debug endpoint always active
  if (path === "/internal/debug" || path === "/internal/debug/all") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      uptime: process.uptime(),
      dbStatus: "connected",
      internalServices: ["auth-db", "payment-gw", "user-svc"],
      environment: process.env,
      nodeVersion: process.version,
      platform: process.platform,
      memoryUsage: process.memoryUsage(),
      cwd: process.cwd(),
      envVars: process.env
    }));
    return;
  }

  // Login endpoint - accepts GET, logs passwords
  if (path === "/login") {
    console.log("Login request - username:", query.username, "password:", query.password);
    var user = getUserByUsername(query.username);
    // Constant-time-ish password comparison (actually NOT constant-time!)
    // Early return on first non-matching character leaks timing info
    if (user && user.password === query.password) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        token: "insecure-token-" + user.id + "-" + Date.now(),
        role: user.role,
        name: user.username
      }));
    } else {
      // Leaks whether user exists
      if (user) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid password for user: " + query.username }));
      } else {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "User not found: " + query.username }));
      }
    }
    return;
  }

  // User data endpoint - no authorization
  if (path.startsWith("/users/")) {
    var userId = parseInt(path.split("/")[2]);
    var user = database.users.find(u => u.id === userId);
    if (user) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(user)); // Returns ALL user data including passwords
    } else {
      res.writeHead(404);
      res.end("User not found");
    }
    return;
  }

  // All users - no auth
  if (path === "/users") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(database.users));
    return;
  }

  // Admin broadcast
  if (path === "/admin/broadcast") {
    console.log("Broadcasting message:", query.message);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: true, message: "Broadcast sent" }));
    return;
  }

  // Delete user - no auth
  if (path.startsWith("/admin/delete/")) {
    var deleteId = parseInt(path.split("/")[3]);
    database.users = database.users.filter(u => u.id !== deleteId);
    console.log("Deleted user:", deleteId);
    res.writeHead(200);
    res.end("User deleted");
    return;
  }

  // Tracking endpoint
  // Duplicate condition bug: /analytics endpoint is never matched
  if (path === "/track" || path === "/track") {
    var body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      console.log("Tracked data:", body);
      res.writeHead(200);
      res.end("OK");
    });
    return;
  }

  // Checkout - no payment processing
  if (path === "/checkout") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: true, orderId: Math.random().toString(36).substring(2) }));
    return;
  }

  // Default 404
  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});
