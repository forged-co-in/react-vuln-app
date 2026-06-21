const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config({ path: "../.env" });

const app = express();
const PORT = 3000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// ==========================================
// FIREBASE ADMIN STORAGE INITIALIZATION
// ==========================================
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const serviceAccount = require("./firebase-service-account.json");

if (getApps().length === 0) {
  initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

// ==========================================
// MIDDLEWARES & CACHE
// ==========================================
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
const otpVerificationCache = new Map();

const PROMO_CODES = {
  "SAVE10": { type: "percentage", value: 10 },
  "MEGA20": { type: "percentage", value: 20 },
  "FLAT15": { type: "flat", value: 15 }
};

// ==========================================
// NODEMAILER EMAIL UTILITY SMTP CHANNEL
// ==========================================
const mailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS  
  }
});

// ==========================================
// REAL-TIME WEBSOCKET NOTIFICATION CHANNELS
// ==========================================
io.on("connection", (socket) => {
  console.log(`⚡ Client connected to socket session stream: ${socket.id}`);
  
  socket.on("disconnect", () => {
    console.log("🛑 Client disconnected from system communication socket.");
  });
});

function sendLiveBroadcastNotification(title, message) {
  io.emit("system_notification", { title, message, timestamp: new Date().toLocaleTimeString() });
}

// ==========================================
// PROMO CODE VALIDATION ENDPOINT
// ==========================================
app.post("/api/cart/validate-promo", (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: "No code supplied." });

  const cleanCode = code.toUpperCase().trim();
  const promo = PROMO_CODES[cleanCode];

  if (!promo) {
    return res.status(404).json({ error: "Invalid coupon code or expired rules." });
  }

  return res.status(200).json({ success: true, code: cleanCode, ...promo });
});

// =========================================================================
// 📦 FIXED: INVENTORY TRACKING & DYNAMIC CUSTOMER CHECKOUT SYSTEM
// =========================================================================
app.post("/api/orders/checkout", async (req, res) => {
  const { username, items, totalBill, promoApplied } = req.body;
  
  if (!username || !items || items.length === 0) {
    return res.status(400).json({ error: "Cannot process empty checkout payload items." });
  }

  const batch = db.batch();

  try {
    for (const item of items) {
      const productRef = db.collection("products").doc(item.id);
      const productDoc = await productRef.get();

      if (!productDoc.exists) {
        return res.status(404).json({ error: `Product "${item.name}" no longer exists in our catalog.` });
      }

      const currentStock = productDoc.data().stock || 0;
      if (currentStock < item.quantity) {
        return res.status(400).json({ error: `Insufficient inventory for ${item.name}. Units remaining: ${currentStock}` });
      }

      batch.update(productRef, { stock: currentStock - item.quantity });
    }

    const orderID = "ORD-" + Math.floor(100000 + Math.random() * 900000) + "-" + Date.now();
    const orderRef = db.collection("orders").doc(orderID);
    
    // =========================================================================
    // 🛠️ CRITICAL LOGICAL FIXED ROOT CAUSE: 
    // Uses the dynamic 'username' passed from the checkout form payload instead of hardcoding "adminsecure"!
    // =========================================================================
    const orderPayload = {
      orderId: orderID,
      username: username.toLowerCase().trim(), // ✅ Dynamic lookup profile binding context
      items: items,
      totalPaid: parseFloat(totalBill),
      promoUsed: promoApplied || "NONE",
      status: "Processing Order",
      timestamp: new Date().toISOString()
    };
    
    batch.set(orderRef, orderPayload);

    const cartRef = db.collection("carts").doc(username.toLowerCase().trim());
    batch.set(cartRef, { items: [] });

    await batch.commit();

    sendLiveBroadcastNotification(
      "📦 Order Placed!", 
      `Customer "${username}" completed an order checkout transaction loop worth $${parseFloat(totalBill).toFixed(2)}!`
    );

    return res.status(201).json({ success: true, message: "Checkout processed successfully!", orderId: orderID });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// =========================================================================
// 📦 ORDER MANAGEMENT: EXTENDED ADMIN CONTROL ENDPOINTS
// =========================================================================

// FETCH ALL HISTORICAL ORDERS (ADMIN FUNCTION)
app.get("/api/admin/orders", async (req, res) => {
  try {
    const ordersSnapshot = await db.collection("orders").get();
    const allOrdersList = [];
    
    ordersSnapshot.forEach(doc => {
      allOrdersList.push(doc.data());
    });

    // Sort order documents chronologically (Newest first)
    allOrdersList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return res.status(200).json(allOrdersList);
  } catch (error) {
    return res.status(500).json({ error: "Failed to read system order nodes: " + error.message });
  }
});

// UPDATE INCREMENTAL STATUS LIFECYCLE STEP (ADMIN FUNCTION)
app.post("/api/admin/orders/:orderId/status", async (req, res) => {
  const { nextStatus } = req.body;
  const { orderId } = req.params;

  if (!nextStatus) {
    return res.status(400).json({ error: "Explicit status string parameters required." });
  }

  try {
    const orderRef = db.collection("orders").doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return res.status(404).json({ error: "Target operational order document not found." });
    }

    const currentOrderData = orderDoc.data();

    await orderRef.update({ 
      status: nextStatus,
      updatedAt: new Date().toISOString()
    });

    // ✅ FIXED: Correctly uses the notifNextStatus string clean utility function
    sendLiveBroadcastNotification(
      "📦 Order Log Advanced!", 
      `Invoice #${orderId} for user "${currentOrderData.username}" updated to: ${notifNextStatus(nextStatus)}.`
    );

    return res.status(200).json({ success: true, message: `Lifecycle advanced successfully to ${nextStatus}!` });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update transaction status: " + error.message });
  }
});

// Small helper to keep notification strings cleaner
function notifNextStatus(status) {
  return status === "Order Confirmed" ? "Confirmed" : status === "Order Shipped" ? "Shipped" : status === "Out for Delivery" ? "Out for Delivery" : "Delivered";
}

// =========================================================================
// 📦 USER ACCESS: FETCH HISTORICAL ORDERS FOR A SPECIFIC USER SIGNATURE
// =========================================================================
app.get("/api/orders/:username", async (req, res) => {
  try {
    const ordersSnapshot = await db.collection("orders")
      .where("username", "==", req.params.username.toLowerCase())
      .get();
    
    const historicalList = [];
    ordersSnapshot.forEach(doc => historicalList.push(doc.data()));
    
    // Sort chronologically (Newest items display first)
    historicalList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return res.status(200).json(historicalList);
  } catch (error) {
    return res.status(500).json({ error: "Failed to load order tracker rows: " + error.message });
  }
});

// ==========================================
// FEATURE 5: PRODUCT REVIEWS & RATING CLUSTERS
// ==========================================
app.post("/api/products/:id/reviews", async (req, res) => {
  const { username, rating, comment } = req.body;
  const productId = req.params.id;

  if (!username || !rating) {
    return res.status(400).json({ error: "Missing required rating fields parameters." });
  }

  try {
    const reviewRef = db.collection("products").doc(productId).collection("reviews").doc(username.toLowerCase());
    
    const reviewData = {
      username: username.trim(),
      rating: parseInt(rating),
      comment: comment || "",
      createdAt: new Date().toISOString()
    };

    await reviewRef.set(reviewData);
    return res.status(201).json({ success: true, message: "Review scores injected cleanly!" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get("/api/products/:id/reviews", async (req, res) => {
  try {
    const reviewsSnapshot = await db.collection("products").doc(req.params.id).collection("reviews").get();
    const activeReviews = [];
    reviewsSnapshot.forEach(doc => activeReviews.push(doc.data()));
    return res.status(200).json(activeReviews);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// ==========================================
// STOREFRONT USER & ADMIN CONTROL ROUTES
// ==========================================
app.post("/api/register", async (req, res) => {
  const { username, password, email, role } = req.body;
  if (!username || !password || !email) return res.status(400).json({ error: "Missing required fields" });

  try {
    const userMatchRef = db.collection("users").doc(username.toLowerCase());
    const userSnapshot = await userMatchRef.get();
    if (userSnapshot.exists) return res.status(400).json({ error: "Username already exists" });

    const newUserProfile = {
      username: username.toLowerCase(), password, email,
      role: role === "admin" ? "admin" : "user", createdAt: new Date().toISOString()
    };

    await userMatchRef.set(newUserProfile);
    await db.collection("carts").doc(username.toLowerCase()).set({ items: [] });

    sendLiveBroadcastNotification("New Member Join!", `${username} just signed up onto our network!`);

    return res.status(201).json({ success: true, message: "User account generated successfully!" });
  } catch (error) { return res.status(500).json({ error: error.message }); }
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const userDoc = await db.collection("users").doc(username.toLowerCase()).get();
    if (!userDoc.exists || userDoc.data().password !== password) {
      return res.status(401).json({ error: "Invalid login credentials match failure." });
    }
    const userData = userDoc.data();

    if (userData.role && userData.role.trim() === "admin") {
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      otpVerificationCache.set(userData.username, { generatedOtp, expiry: Date.now() + 300000 });

      await mailTransporter.sendMail({
        from: process.env.EMAIL_USER, 
        to: userData.email,
        subject: `${generatedOtp} is your security verification code`,
        text: `Your passcode is: ${generatedOtp}`
      });
      
      return res.status(200).json({ requires2Fa: true, username: userData.username });
    }
    return res.status(200).json({ token: `user-session-${userData.username}-${Date.now()}`, role: userData.role, name: userData.username });
  } catch (error) { return res.status(500).json({ error: error.message }); }
});

app.post("/api/verify-2fa", async (req, res) => {
  const { username, otp } = req.body;
  const cacheMatch = otpVerificationCache.get(username);
  if (!cacheMatch || cacheMatch.generatedOtp !== otp || Date.now() > cacheMatch.expiry) {
    return res.status(401).json({ error: "Invalid token parameters." });
  }
  try {
    otpVerificationCache.delete(username);
    const userDoc = await db.collection("users").doc(username).get();
    const userData = userDoc.data();
    
    return res.status(200).json({ 
      token: `admin-secure-session-${userData.username}-${Date.now()}`, 
      role: "admin", 
      name: userData.username 
    });
  } catch (error) { return res.status(500).json({ error: error.message }); }
});

app.get("/api/products", async (req, res) => {
  try {
    const productsSnapshot = await db.collection("products").get();
    const productsList = [];
    productsSnapshot.forEach(doc => productsList.push(doc.data()));
    return res.status(200).json(productsList);
  } catch (error) { return res.status(500).json({ error: error.message }); }
});

app.post("/api/admin/products", async (req, res) => {
  const { name, price, description, stock, image } = req.body;

  if (!name || !price) {
    return res.status(400).json({ error: "Product name and price are required." });
  }

  try {
    const productID = name.toLowerCase().replace(/[^a-z0-9]/g, "-");

    const newProduct = { 
      id: productID, 
      name, 
      price: parseFloat(price), 
      description: description || "", 
      stock: parseInt(stock) || 0, 
      image: image || "", 
      updatedAt: new Date().toISOString() 
    };

    await db.collection("products").doc(productID).set(newProduct);

    sendLiveBroadcastNotification(
      "🔥 Flash Deal Alert!", 
      `New inventory item introduced: "${name}" is now up for retail grabs! Only $${price}!`
    );

    return res.status(201).json({ success: true, message: "Product created successfully!", product: newProduct });
  } catch (error) { 
    return res.status(500).json({ error: error.message }); 
  }
});

app.put("/api/admin/products/:id", async (req, res) => {
  const { name, price, description, stock, image } = req.body;
  try {
    const productRef = db.collection("products").doc(req.params.id);
    const productSnapshot = await productRef.get();
    if (!productSnapshot.exists) return res.status(404).json({ error: "Target product not found." });

    const updatedData = {
      name: name || productSnapshot.data().name,
      price: price ? parseFloat(price) : productSnapshot.data().price,
      description: description !== undefined ? description : productSnapshot.data().description,
      stock: stock !== undefined ? parseInt(stock) : productSnapshot.data().stock,
      image: image !== undefined ? image : productSnapshot.data().image, 
      updatedAt: new Date().toISOString()
    };
    
    await productRef.update(updatedData);
    return res.status(200).json({ success: true, message: "Product updated successfully!" });
  } catch (error) { 
    return res.status(500).json({ error: error.message }); 
  }
});

app.delete("/api/admin/products/:id", async (req, res) => {
  try {
    await db.collection("products").doc(req.params.id).delete();
    return res.status(200).json({ success: true, message: "Product removed successfully." });
  } catch (error) { return res.status(500).json({ error: error.message }); }
});

app.get("/api/search", async (req, res) => {
  const queryParam = req.query.q ? req.query.q.toLowerCase().trim() : "";
  if (queryParam.length < 2) return res.status(200).json({ results: [] });
  try {
    const productsSnapshot = await db.collection("products").get();
    const matchedResults = [];
    productsSnapshot.forEach(doc => {
      const p = doc.data();
      if ((p.name && p.name.toLowerCase().includes(queryParam)) || (p.description && p.description.toLowerCase().includes(queryParam))) {
        matchedResults.push({ id: p.id, title: p.name, snippet: p.description, price: p.price });
      }
    });
    return res.status(200).json({ results: matchedResults });
  } catch (error) { return res.status(500).json({ error: error.message }); }
});

app.get("/api/admin/users", async (req, res) => {
  try {
    const usersSnapshot = await db.collection("users").get();
    const usersList = [];
    usersSnapshot.forEach(doc => { const { password, ...cleanProfile } = doc.data(); usersList.push(cleanProfile); });
    return res.status(200).json(usersList);
  } catch (error) { return res.status(500).json({ error: error.message }); }
});

app.put("/api/admin/users/:username", async (req, res) => {
  const { email, role } = req.body;
  try {
    const userRef = db.collection("users").doc(req.params.username.toLowerCase());
    const userSnapshot = await userRef.get();
    if (!userSnapshot.exists) return res.status(404).json({ error: "User profile not found." });
    const updatedFields = {};
    if (email) updatedFields.email = email.trim();
    if (role) updatedFields.role = role.trim();
    await userRef.update(updatedFields);
    return res.status(200).json({ success: true, message: "User properties updated successfully!" });
  } catch (error) { return res.status(500).json({ error: error.message }); }
});

app.delete("/api/admin/users/:username", async (req, res) => {
  try {
    await db.collection("users").doc(req.params.username.toLowerCase()).delete();
    await db.collection("carts").doc(req.params.username.toLowerCase()).delete();
    return res.status(200).json({ success: true, message: "Target user removed cleanly." });
  } catch (error) { return res.status(500).json({ error: error.message }); }
});
// =========================================================================
// 🛒 PERSISTENT SHOPPING CART BACKEND ENDPOINTS
// =========================================================================

// FETCH USER CART FROM SERVER DATA SYNC
app.get("/api/cart/:username", async (req, res) => {
  try {
    const cartRef = db.collection("carts").doc(req.params.username.toLowerCase().trim());
    const cartDoc = await cartRef.get();

    if (!cartDoc.exists) {
      return res.status(200).json({ items: [] });
    }
    return res.status(200).json(cartDoc.data());
  } catch (error) {
    return res.status(500).json({ error: "Failed to read cloud cart matrix: " + error.message });
  }
});

// COMMIT SYNC USER CART STATE MATRIX DOWNSTREAM
app.post("/api/cart/:username/sync", async (req, res) => {
  const { items } = req.body;
  try {
    const cartRef = db.collection("carts").doc(req.params.username.toLowerCase().trim());
    
    await cartRef.set({
      items: items || [],
      updatedAt: new Date().toISOString()
    });

    return res.status(200).json({ success: true, message: "Cloud cart state mapped successfully!" });
  } catch (error) {
    return res.status(500).json({ error: "Failed to write cloud cart matrices: " + error.message });
  }
});
server.listen(PORT, () => {
  console.log(`🚀 Cloud Native Server active on port ${PORT}`);
});