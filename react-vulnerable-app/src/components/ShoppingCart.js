import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { validatePromoCode, checkoutUserCart } from '../utils/api'; 

function ShoppingCart({ cartItems = [], updateQuantity, removeFromCart }) {
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false); 
  
  const navigate = useNavigate();

  // Compute standard base running subtotal values
  const runningSubtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  // Compute discount savings value metrics safely
  let discountAmount = 0;
  if (appliedPromo) {
    if (appliedPromo.type === "percentage") {
      discountAmount = runningSubtotal * (appliedPromo.value / 100);
    } else if (appliedPromo.type === "flat") {
      discountAmount = appliedPromo.value;
    }
  }
  const finalCheckoutTotal = Math.max(0, runningSubtotal - discountAmount);

  function handleApplyPromo(e) {
    e.preventDefault();
    setPromoError("");
    
    validatePromoCode(promoInput)
      .then(res => {
        if (res.success) {
          setAppliedPromo(res);
          alert(`Success! Applied promo code: ${res.code} (${res.value}${res.type === 'percentage' ? '%' : '$'} OFF)`);
        } else {
          setPromoError(res.error || "Invalid discount coupon string.");
          setAppliedPromo(null);
        }
      })
      .catch(() => setPromoError("Server handshake failure during discount verification."));
  }

  // ✅ FIXED CHECKOUT ACTION SYSTEM
  async function executeSecureCheckout() {
    // 🛠️ FIX 1: Read correctly from sessionStorage to match App.js login systems
    const savedUser = sessionStorage.getItem("currentUser");
    if (!savedUser) {
      alert("Please log in to complete your purchase transaction order!");
      navigate("/login");
      return;
    }

    const currentUserObj = JSON.parse(savedUser);
    const usernameString = currentUserObj.name || currentUserObj.username;

    if (!usernameString) {
      alert("User identification error. Please re-login.");
      return;
    }

    setIsCheckingOut(true);

    const checkoutPayload = {
      username: usernameString.toLowerCase().trim(), // Force case normalization
      items: cartItems,
      totalBill: finalCheckoutTotal,
      promoApplied: appliedPromo ? appliedPromo.code : "NONE"
    };

    try {
      const result = await checkoutUserCart(checkoutPayload);
      if (result.success) {
        alert(`🎉 Success! Your order ${result.orderId} is verified. Inventory structural counts adjusted.`);
        
        // 🛠️ FIX 2: Dynamic redirect targeting the dynamic route component path layout!
        navigate(`/orders/${usernameString.toLowerCase().trim()}`);
        
        // Instantly force clean app synchronization update cycle reload
        setTimeout(() => {
          window.location.reload();
        }, 50);
      } else {
        alert("❌ Checkout Denied: " + result.error);
      }
    } catch (err) {
      console.error("Error sending checkout sequence bundle:", err);
      alert("Critical network failure processing payment batch pipeline.");
    } finally {
      setIsCheckingOut(false);
    }
  }

  return (
    <div style={{ padding: "30px", maxWidth: "800px", margin: "auto", fontFamily: "sans-serif" }}>
      <h2>Your Shopping Cart</h2>

      {cartItems.length === 0 ? (
        <p style={{ color: "#666" }}>Your cart is empty. Explore the products catalog to add items!</p>
      ) : (
        <div>
          {/* Cart Items List */}
          {cartItems.map(item => (
            <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #ddd", padding: "15px 0" }}>
              <div>
                <h4 style={{ margin: "0 0 5px 0" }}>{item.name}</h4>
                <p style={{ margin: 0, color: "#666" }}>Unit Price: ${item.price}</p>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input 
                  type="number" 
                  min="1" 
                  value={item.quantity} 
                  onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                  style={{ width: "50px", padding: "5px", textAlign: "center" }}
                />
                <button 
                  onClick={() => removeFromCart(item.id)}
                  style={{ background: "#dc3545", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer" }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          {/* Pricing Calculations Summary Sidebar */}
          <div style={{ marginTop: "30px", background: "#f8f9fa", padding: "20px", borderRadius: "8px" }}>
            <p style={{ display: "flex", justifyContent: "space-between" }}><span>Cart Subtotal:</span> <strong>${runningSubtotal.toFixed(2)}</strong></p>
            
            {appliedPromo && (
              <p style={{ display: "flex", justifyContent: "space-between", color: "green" }}>
                <span>Discount Applied ({appliedPromo.code}):</span> 
                <strong>-${discountAmount.toFixed(2)}</strong>
              </p>
            )}
            <hr />
            <h3 style={{ display: "flex", justifyContent: "space-between", margin: "10px 0" }}>
              <span>Total Billable:</span> 
              <span style={{ color: "#28a745" }}>${finalCheckoutTotal.toFixed(2)}</span>
            </h3>

            {/* Checkout Action Button */}
            <button 
              onClick={executeSecureCheckout}
              disabled={isCheckingOut || cartItems.length === 0}
              style={{ 
                width: "100%", 
                marginTop: "15px", 
                padding: "12px", 
                background: isCheckingOut ? "#ccc" : "#28a745", 
                color: "#fff", 
                border: "none", 
                borderRadius: "6px", 
                cursor: isCheckingOut ? "not-allowed" : "pointer", 
                fontSize: "16px", 
                fontWeight: "bold" 
              }}
            >
              {isCheckingOut ? "Verifying Inventory Allocations..." : "Proceed to Secure Checkout"}
            </button>
          </div>

          {/* Promo Code Input Block */}
          <form onSubmit={handleApplyPromo} style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <input 
              type="text" 
              placeholder="Enter Promo Code (e.g. MEGA20, SAVE10)" 
              value={promoInput}
              onChange={e => setPromoInput(e.target.value)}
              style={{ padding: "10px", borderRadius: "4px", border: "1px solid #ccc", width: "100%", maxWidth: "300px" }}
              disabled={!!appliedPromo}
            />
            <button 
              type="submit" 
              style={{ background: "#007bff", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
              disabled={!!appliedPromo}
            >
              Apply Coupon
            </button>
          </form>
          {promoError && <p style={{ color: "red", fontSize: "14px", marginTop: "5px" }}>⚠️ {promoError}</p>}
        </div>
      )}
    </div>
  );
}

export default ShoppingCart;