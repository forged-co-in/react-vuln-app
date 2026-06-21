import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  adminGetAllUsers, adminDeleteTargetUser, adminUpdateUserData,
  fetchLiveProducts, adminAddProduct, adminUpdateProduct, adminDeleteProduct,
  apiGet, apiPost 
} from '../utils/api';
import ImageUploader from './ImageUploader';

function AdminPanel({ user }) {
  const cachedSession = sessionStorage.getItem("currentUser");
  const sessionObj = cachedSession ? JSON.parse(cachedSession) : null;

  const isSessionValid = 
    sessionObj && 
    sessionObj.role === "admin" && 
    sessionObj.token && 
    sessionObj.token.startsWith("admin-secure-session");

  const navigate = useNavigate();
  const location = useLocation();

  // Main Navigation Tabs
  const [activeTab, setActiveTab] = useState("users"); 
  
  // ✅ NEW: Sub-tabs to split active vs completed orders
  const [ordersSubTab, setOrdersSubTab] = useState("active");

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editRole, setEditRole] = useState("");
  const [editEmail, setEditEmail] = useState(""); 

  // Product Field Hook States
  const [products, setProducts] = useState([]);
  const [pName, setPName] = useState("");
  const [pPrice, setPPrice] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [pStock, setPStock] = useState("");
  const [pImage, setPImage] = useState(""); 
  const [editingProductId, setEditingProductId] = useState(null); 

  // Orders Log hooks
  const [ordersRegistry, setOrdersRegistry] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const targetedTabQuery = searchParams.get("tab");
    if (targetedTabQuery === "orders") {
      setActiveTab("orders");
    }
  }, [location]);

  useEffect(() => {
    if (!isSessionValid) {
      alert("⛔ Security Violation Intercepted: Please authenticate with a valid 2FA token.");
      sessionStorage.removeItem("currentUser"); 
      navigate("/login");
    } else {
      refreshUserList();
      refreshProductList();
      refreshOrdersRegistryList();
    }
  }, [navigate, isSessionValid]);

  useEffect(() => {
    if (!isSessionValid) return;

    const liveSystemSocket = window.socket; 
    if (liveSystemSocket) {
      const captureIncomingAlertNotification = (data) => {
        const uniqueTokenKeyId = Date.now() + Math.random();
        const notificationPayload = { ...data, id: uniqueTokenKeyId };

        setNotifications((prev) => [...prev, notificationPayload]);

        setTimeout(() => {
          setNotifications((prev) => prev.filter((item) => item.id !== uniqueTokenKeyId));
        }, 5000);
      };

      liveSystemSocket.on("system_notification", captureIncomingAlertNotification);
      return () => {
        liveSystemSocket.off("system_notification", captureIncomingAlertNotification);
      };
    }
  }, [isSessionValid]);

  function refreshUserList() {
    adminGetAllUsers().then(data => { if (Array.isArray(data)) setUsers(data); }).catch(err => console.error(err));
  }

  function refreshProductList() {
    fetchLiveProducts().then(data => { if (Array.isArray(data)) setProducts(data); }).catch(err => console.error(err));
  }

  function refreshOrdersRegistryList() {
    apiGet("/admin/orders")
      .then(data => { if (Array.isArray(data)) setOrdersRegistry(data); })
      .catch(err => console.error("Error updating order logs:", err));
  }

  if (!isSessionValid) return null; 

  function handleAdvanceOrderStatusLifecycle(orderId, currentStatus) {
    let targetedNextMilestoneStr = "";
    if (currentStatus === "Processing Order") targetedNextMilestoneStr = "Order Confirmed";
    else if (currentStatus === "Order Confirmed") targetedNextMilestoneStr = "Order Shipped";
    else if (currentStatus === "Order Shipped") targetedNextMilestoneStr = "Out for Delivery";
    else if (currentStatus === "Out for Delivery") targetedNextMilestoneStr = "Order Delivered";
    else return; 

    apiPost(`/admin/orders/${orderId}/status`, { nextStatus: targetedNextMilestoneStr })
      .then(res => {
        if (res && (res.success || !res.error)) {
          alert(`Transaction Milestone advanced to: ${targetedNextMilestoneStr}`);
          refreshOrdersRegistryList(); 
        } else {
          alert(`Server Warning: ${res?.error || "Execution failed."}`);
        }
      })
      .catch(err => {
        console.error(err);
        refreshOrdersRegistryList();
      });
  }

  function handleSaveUserChanges(username) {
    adminUpdateUserData(username, { email: editEmail, role: editRole })
      .then(res => {
        if (res.success) {
          alert("User properties modified successfully!");
          refreshUserList(); setSelectedUser(null);
        }
      }).catch(err => console.error(err));
  }

  function handleProductSubmit(e) {
    e.preventDefault();
    const payload = { name: pName, price: parseFloat(pPrice), description: pDesc, stock: parseInt(pStock), image: pImage || "" };

    if (editingProductId) {
      adminUpdateProduct(editingProductId, payload).then(res => {
        if (res.success) {
          alert("Product adjusted successfully!");
          resetProductForm(); refreshProductList();
        }
      }).catch(err => console.error(err));
    } else {
      adminAddProduct(payload).then(res => {
        if (res.success) {
          alert("Product injected to sales catalog!");
          resetProductForm(); refreshProductList();
        }
      }).catch(err => console.error(err));
    }
  }

  function handleEditProductClick(product) {
    setEditingProductId(product.id);
    setPName(product.name); setPPrice(product.price);
    setPDesc(product.description || ""); setPStock(product.stock || 0);
    setPImage(product.image || ""); 
  }

  function resetProductForm() {
    setPName(""); setPPrice(""); setPDesc(""); setPStock(""); setPImage("");
    setEditingProductId(null);
  }

  // ✅ LOGICAL SPLITTING ARRAYS FILTERING
  const activeOrders = ordersRegistry.filter(order => order.status !== "Order Delivered");
  const completedOrders = ordersRegistry.filter(order => order.status === "Order Delivered");

  return (
    <div style={{ padding: "30px", maxWidth: "1200px", margin: "auto", fontFamily: "sans-serif" }}>
      <h2>System Administrator Command Center Workspace</h2>
      
      {/* Navigation Layout Buttons */}
      <div style={{ marginBottom: "25px", display: "flex", gap: "12px" }}>
        <button onClick={() => setActiveTab("users")} style={{ padding: "12px 22px", background: activeTab === "users" ? "#007bff" : "#6c757d", color: "#fff", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: "pointer" }}>Manage User Accounts</button>
        <button onClick={() => setActiveTab("products")} style={{ padding: "12px 22px", background: activeTab === "products" ? "#28a745" : "#6c757d", color: "#fff", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: "pointer" }}>Product Inventory Editor</button>
        <button onClick={() => { setActiveTab("orders"); refreshOrdersRegistryList(); }} style={{ padding: "12px 22px", background: activeTab === "orders" ? "#17a2b8" : "#6c757d", color: "#fff", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: "pointer" }}>📄 View System Orders Log ({ordersRegistry.length})</button>
      </div>

      {activeTab === "users" && (
        <div>
          <h3>User Profiles Management Datatable</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "15px" }}>
            <thead>
              <tr style={{ background: "#343a40", color: "#fff", textAlign: "left" }}>
                <th style={{ padding: "12px", border: "1px solid #ddd" }}>Username</th>
                <th style={{ padding: "12px", border: "1px solid #ddd" }}>Email Address</th>
                <th style={{ padding: "12px", border: "1px solid #ddd" }}>Current Role</th>
                <th style={{ padding: "12px", border: "1px solid #ddd" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.username} style={{ borderBottom: "1px solid #ddd" }}>
                  <td style={{ padding: "12px", border: "1px solid #ddd" }}>{u.username}</td>
                  <td style={{ padding: "12px", border: "1px solid #ddd" }}>{u.email}</td>
                  <td style={{ padding: "12px", border: "1px solid #ddd" }}><strong style={{ color: u.role === "admin" ? "#dc3545" : "#333" }}>{u.role}</strong></td>
                  <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                    <button style={{ marginRight: "8px", background: "#17a2b8", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer" }}>Edit</button>
                    <button onClick={() => { if(window.confirm(`Drop profile layout context for ${u.username}?`)) adminDeleteTargetUser(u.username).then(() => refreshUserList()); }} style={{ background: "#dc3545", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer" }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "products" && (
        <div>
          <h3>{editingProductId ? `🔄 Edit Store Item (ID: ${editingProductId})` : "➕ Append New Product to Catalog"}</h3>
          <form onSubmit={handleProductSubmit} style={{ background: "#f8f9fa", padding: "25px", borderRadius: "8px", marginBottom: "35px", border: "1px solid #eee" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
              <input type="text" placeholder="Product Title / Name" value={pName} onChange={e => setPName(e.target.value)} style={{ padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }} required />
              <input type="number" step="0.01" placeholder="Sales Retail Price ($)" value={pPrice} onChange={e => setPPrice(e.target.value)} style={{ padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }} required />
            </div>
            <div style={{ marginBottom: "15px" }}>
              <input type="number" placeholder="Available Warehouse Stock Units" value={pStock} onChange={e => setPStock(e.target.value)} style={{ width: "100%", boxSizing: "border-box", padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }} required />
            </div>
            <div style={{ marginBottom: "15px" }}>
              <ImageUploader onUploadSuccess={(url) => setPImage(url)} />
              {pImage && <div style={{ marginTop: "10px" }}><img src={pImage} alt="preview" style={{ maxWidth: "100px", borderRadius: "4px", border: "1px solid #ccc" }} /></div>}
            </div>
            <div style={{ marginBottom: "15px" }}>
              <textarea placeholder="Product Description..." value={pDesc} onChange={e => setPDesc(e.target.value)} style={{ width: "100%", boxSizing: "border-box", padding: "10px", borderRadius: "4px", border: "1px solid #ccc", minHeight: "80px" }} />
            </div>
            <button type="submit" style={{ background: editingProductId ? "#ffc107" : "#28a745", color: editingProductId ? "#000" : "#fff", padding: "10px 20px", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: "pointer", marginRight: "10px" }}>{editingProductId ? "Commit Updates" : "Publish Item"}</button>
            {editingProductId && <button type="button" onClick={resetProductForm} style={{ background: "#6c757d", color: "#fff", padding: "10px 20px", border: "none", borderRadius: "4px", cursor: "pointer" }}>Exit Edit State</button>}
          </form>

          <h3>Active Live Store Catalog Items ({products.length})</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "15px" }}>
            <thead>
              <tr style={{ background: "#212529", color: "#fff", textAlign: "left" }}>
                <th style={{ padding: "12px", border: "1px solid #ddd", width: "80px" }}>Image</th>
                <th style={{ padding: "12px", border: "1px solid #ddd" }}>Product Name</th>
                <th style={{ padding: "12px", border: "1px solid #ddd" }}>Price</th>
                <th style={{ padding: "12px", border: "1px solid #ddd" }}>Stock Inventory</th>
                <th style={{ padding: "12px", border: "1px solid #ddd" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(prod => (
                <tr key={prod.id} style={{ borderBottom: "1px solid #ddd" }}>
                  <td style={{ padding: "12px", border: "1px solid #ddd", textAlign: "center" }}>
                    <div style={{ width: "50px", height: "50px", backgroundColor: "#f0f2f5", borderRadius: "4px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", margin: "auto" }}>
                      {prod.image ? <img src={prod.image} alt={prod.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: "10px", color: "#999" }}>📷 No Img</span>}
                    </div>
                  </td>
                  <td style={{ padding: "12px", border: "1px solid #ddd" }}><strong>{prod.name}</strong></td>
                  <td style={{ padding: "12px", border: "1px solid #ddd" }}>${prod.price}</td>
                  <td style={{ padding: "12px", border: "1px solid #ddd" }}>{prod.stock} units</td>
                  <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                    <button onClick={() => handleEditProductClick(prod)} style={{ marginRight: "8px", background: "#ffc107", color: "#000", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Edit</button>
                    <button onClick={() => { if(window.confirm(`Permanently delete: "${prod.name}"?`)) adminDeleteProduct(prod.id).then(() => refreshProductList()); }} style={{ background: "#dc3545", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer" }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "orders" && (
        <div>
          {/* ✅ SUB TAB NAVIGATION CONTROLS */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px", borderBottom: "1px solid #ddd", paddingBottom: "10px" }}>
            <button 
              onClick={() => setOrdersSubTab("active")} 
              style={{ padding: "8px 16px", background: ordersSubTab === "active" ? "#17a2b8" : "#e9ecef", color: ordersSubTab === "active" ? "#fff" : "#333", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
            >
              System Active Orders ({activeOrders.length})
            </button>
            <button 
              onClick={() => setOrdersSubTab("completed")} 
              style={{ padding: "8px 16px", background: ordersSubTab === "completed" ? "#28a745" : "#e9ecef", color: ordersSubTab === "completed" ? "#fff" : "#333", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
            >
              Completed Lifecycle Tracking ({completedOrders.length})
            </button>
          </div>

          <h3 style={{ borderBottom: "2px solid #17a2b8", paddingBottom: "8px" }}>
            📋 {ordersSubTab === "active" ? "Master Sales Order Transaction Logs (In-Progress)" : "Completed Archive Registry Logs"}
          </h3>

          {/* Conditional evaluation depending on selection parameters */}
          {((ordersSubTab === "active" ? activeOrders : completedOrders).length === 0) ? (
            <p style={{ color: "#666", padding: "20px" }}>No documents discovered inside this registry track view context.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "15px" }}>
              {(ordersSubTab === "active" ? activeOrders : completedOrders).map((item) => (
                <div key={item.orderId} style={{ border: "1px solid #ccc", borderRadius: "6px", padding: "20px", backgroundColor: "#fff", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                  
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", background: "#f8f9fa", padding: "10px", borderRadius: "4px" }}>
                    <div>
                      <strong>Order Reference Key:</strong> <span style={{ color: "#007bff" }}>{item.orderId}</span> <br />
                      <strong>Buyer Account Handle:</strong> <span style={{ fontWeight: "bold" }}>{item.username}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <strong>Status Tier:</strong> <span style={{ color: item.status === "Order Delivered" ? "green" : "#17a2b8", fontWeight: "bold" }}>{item.status}</span> <br />
                      <small style={{ color: "#777" }}>Processed: {new Date(item.timestamp).toLocaleString()}</small>
                    </div>
                  </div>

                  <div style={{ margin: "10px 0" }}>
                    <span style={{ fontWeight: "bold", fontSize: "14px" }}>Itemized Basket Breakdown:</span>
                    <ul style={{ fontSize: "13px", color: "#444", margin: "5px 0 0 0" }}>
                      {item.items?.map((prod, idx) => (
                        <li key={idx}>🎬 {prod.name} (Quantity: {prod.quantity}) — Price Mapping: ${prod.price}</li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #eee", paddingTop: "12px", marginTop: "12px" }}>
                    <div>Total Settled Value: <strong style={{ color: "green", fontSize: "16px" }}>${parseFloat(item.totalPaid).toFixed(2)}</strong></div>
                    <div>
                      {item.status !== "Order Delivered" ? (
                        <button 
                          onClick={() => handleAdvanceOrderStatusLifecycle(item.orderId, item.status)} 
                          style={{ background: "#007bff", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "4px", fontWeight: "bold", cursor: "pointer" }}
                        >
                          Advance Phase Status ➡️
                        </button>
                      ) : (
                        <span style={{ color: "green", fontWeight: "bold", fontSize: "14px" }}>
                          ✅ Lifecycle Complete (Moved to Completed)
                        </span>
                      )}
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5-Second Administrative Toast Stack Container */}
      <div style={{ position: "fixed", bottom: "20px", right: "20px", zIndex: 9999, display: "flex", flexDirection: "column", gap: "10px" }}>
        {notifications.map((notif) => (
          <div key={notif.id} style={{ background: "#212529", color: "#fff", padding: "15px 20px", borderRadius: "6px", boxShadow: "0 4px 12px rgba(0,0,0,0.25)", minWidth: "320px", maxWidth: "400px", borderLeft: "5px solid #28a745" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <strong style={{ fontSize: "14px" }}>{notif.title}</strong>
              <small style={{ color: "#aaa", fontSize: "11px" }}>{notif.timestamp}</small>
            </div>
            <p style={{ margin: 0, fontSize: "13px", lineHeight: "1.4", color: "#e0e0e0" }}>{notif.message}</p>
          </div>
        ))}
      </div>

    </div>
  );
}

export default AdminPanel;