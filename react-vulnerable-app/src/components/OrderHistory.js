import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchUserOrderHistory } from '../utils/api';

function OrderHistory({ user }) {
  const { username } = useParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // Determine target username string normalized from URL parameter or active session state fallbacks
    const cachedSession = sessionStorage.getItem("currentUser");
    const sessionObj = cachedSession ? JSON.parse(cachedSession) : null;
    const activeTargetUser = username || sessionObj?.name || sessionObj?.username || user?.name || user?.username;

    if (activeTargetUser) {
      const targetUserQuery = activeTargetUser.toLowerCase().trim();
      
      setLoading(true);
      setErrorMessage("");

      fetchUserOrderHistory(targetUserQuery)
        .then(data => { 
          if (Array.isArray(data)) {
            // ✅ EXTRA SECURITY FILTER: Displays orders matching ONLY this active user's database string records
            const personalOrders = data.filter(order => order.username?.toLowerCase() === targetUserQuery);
            setOrders(personalOrders); 
          } else {
            setOrders([]);
          }
        })
        .catch(err => {
          console.error("History fetch error loop:", err);
          setErrorMessage("Failed to establish a secure connection to the database. Make sure your server is running.");
          setOrders([]);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [username, user]);

  const getStatusStepIndex = (status) => {
    switch (status) {
      case "Processing Order": return 0;
      case "Order Confirmed": return 1;
      case "Order Shipped": return 2;
      case "Out for Delivery": return 3;
      case "Order Delivered": return 4;
      default: return 0;
    }
  };

  const trackingSteps = ["Confirmed", "Shipped", "Out for Delivery", "Delivered"];

  const activeCachedSession = sessionStorage.getItem("currentUser");
  const isAuthenticated = user || activeCachedSession;

  if (!isAuthenticated) return <p style={{ padding: "30px", textAlign: "center" }}>Please log in to view your order history tracking.</p>;
  if (loading) return <p style={{ padding: "30px", textAlign: "center" }}>Scanning purchase ledger data parameters...</p>;
  if (errorMessage) return <p style={{ padding: "30px", color: "#dc3545", textAlign: "center", fontWeight: "bold" }}>⚠️ {errorMessage}</p>;

  return (
    <div style={{ padding: "30px", maxWidth: "900px", margin: "auto", fontFamily: "sans-serif" }}>
      <h3 style={{ borderBottom: "2px solid #007bff", paddingBottom: "10px", color: "#333" }}>📦 Your Order Purchase Tracking History</h3>
      
      {orders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", background: "#f8f9fa", borderRadius: "8px", marginTop: "20px", border: "1px solid #eee" }}>
          <h4>No historical order records found for account: <span style={{ color: "#007bff" }}>"{username}"</span></h4>
          <p style={{ color: "#777", margin: "5px 0 0 0" }}>Go browse our storefront products catalog, log in as this user, and place a checkout order!</p>
        </div>
      ) : (
        orders.map(order => {
          const currentStepIndex = getStatusStepIndex(order.status);

          return (
            <div key={order.orderId} style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "25px", marginBottom: "35px", backgroundColor: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
              
              {/* Order Card Meta Header Info Box */}
              <div style={{ display: "flex", justifyContent: "space-between", background: "#f8f9fa", padding: "12px 20px", borderRadius: "6px", marginBottom: "20px" }}>
                <span><strong>Invoice ID:</strong> <span style={{ color: "#007bff" }}>{order.orderId}</span></span>
                <span style={{ color: "#17a2b8", fontWeight: "bold" }}>🚚 {order.status}</span>
              </div>
              <p style={{ fontSize: "13px", color: "#666", margin: "0 0 25px 0" }}>Purchased on: {new Date(order.timestamp).toLocaleString()}</p>

              {/* =========================================================================
                  🌄 GEEKSFORGEEKS CHRONOLOGICAL TRACKING ROADMAP TIMELINE BAR LAYOUT
                  ========================================================================= */}
              <div style={{ margin: "40px 0 45px 0", padding: "0 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", position: "relative", alignItems: "center" }}>
                  
                  {/* Underlay tracking bar progress line tracks */}
                  <div style={{ position: "absolute", left: "0", right: "0", top: "14px", height: "5px", background: "#e9ecef", zIndex: 1 }} />
                  <div style={{ position: "absolute", left: "0", top: "14px", height: "5px", background: "#28a745", zIndex: 2, transition: "width 0.4s ease", width: `${(currentStepIndex / 4) * 100}%` }} />

                  {/* Processing Circle Landmark node */}
                  <div style={{ zIndex: 3, textAlign: "center", width: "100px" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#28a745", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", margin: "auto", boxShadow: "0 0 0 4px #fff, 0 2px 4px rgba(0,0,0,0.15)", fontWeight: "bold" }}>✓</div>
                    <span style={{ fontSize: "11px", fontWeight: "bold", display: "block", marginTop: "8px", color: "#28a745" }}>Processing</span>
                  </div>

                  {trackingSteps.map((stepName, index) => {
                    const stepValueIndex = index + 1;
                    const isPassed = currentStepIndex >= stepValueIndex;

                    return (
                      <div key={stepName} style={{ zIndex: 3, textAlign: "center", width: "100px" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: isPassed ? "#28a745" : "#fff", color: isPassed ? "#fff" : "#ccc", border: isPassed ? "none" : "3px solid #e9ecef", display: "flex", alignItems: "center", justifyContent: "center", margin: "auto", fontWeight: "bold", fontSize: "13px", boxShadow: "0 0 0 4px #fff, 0 2px 4px rgba(0,0,0,0.15)", transition: "all 0.3s ease" }}>
                          {isPassed ? "✓" : ""}
                        </div>
                        <span style={{ fontSize: "11px", fontWeight: isPassed ? "bold" : "normal", display: "block", marginTop: "8px", color: isPassed ? "#28a745" : "#777" }}>{stepName}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Product breakdown table list summary segment */}
              <div style={{ background: "#fafafa", padding: "15px 20px", borderRadius: "6px", border: "1px solid #f0f0f0" }}>
                <h5 style={{ margin: "0 0 8px 0", color: "#555" }}>Items Ordered:</h5>
                {order.items?.map((item, idx) => (
                  <p key={idx} style={{ margin: "6px 0", fontSize: "14px", color: "#333" }}>
                    • <strong>{item.name}</strong> <span style={{ color: "#777" }}>x{item.quantity}</span> — ${parseFloat(item.price).toFixed(2)} each
                  </p>
                ))}
                <div style={{ textAlign: "right", borderTop: "1px solid #eee", marginTop: "12px", paddingTop: "12px", fontWeight: "bold", fontSize: "16px", color: "#28a745" }}>
                  Total Paid: ${parseFloat(order.totalPaid).toFixed(2)}
                </div>
              </div>

            </div>
          );
        })
      )}
    </div>
  );
}

export default OrderHistory;