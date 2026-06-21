import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { validatePromoCode, checkoutUserCart } from '../utils/api'; 

function ShoppingCart({ cartItems = [], updateQuantity, removeFromCart, triggerGlobalAlert }) {
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false); 
  
  const navigate = useNavigate();
  const runningSubtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

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
          if (triggerGlobalAlert) {
            triggerGlobalAlert(`Coupon code '${res.code}' applied successfully!`, "success");
          }
        } else {
          setPromoError(res.error || "Invalid discount coupon string.");
          setAppliedPromo(null);
        }
      })
      .catch(() => setPromoError("Server handshake failure during verification."));
  }

  async function executeSecureCheckout() {
    const savedUser = sessionStorage.getItem("currentUser");
    if (!savedUser) {
      if (triggerGlobalAlert) triggerGlobalAlert("Authentication required to finish transaction.", "error");
      navigate("/login");
      return;
    }

    const currentUserObj = JSON.parse(savedUser);
    const usernameString = currentUserObj.name || currentUserObj.username;

    setIsCheckingOut(true);

    const checkoutPayload = {
      username: usernameString.toLowerCase().trim(),
      items: cartItems,
      totalBill: finalCheckoutTotal,
      promoApplied: appliedPromo ? appliedPromo.code : "NONE"
    };

    try {
      const result = await checkoutUserCart(checkoutPayload);
      if (result.success) {
        // ✅ TASK 3 FIX: Directs successful purchase verification straight into our custom layout notification window
        if (triggerGlobalAlert) {
          triggerGlobalAlert(`🎉 Transaction Confirmed! Invoice ID: ${result.orderId}`, "success");
        }
        navigate(`/orders/${usernameString.toLowerCase().trim()}`);
        setTimeout(() => { window.location.reload(); }, 50);
      } else {
        setPromoError(result.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCheckingOut(false);
    }
  }

  return (
    <div style={{ padding: "40px 4rem", maxWidth: "900px", margin: "auto" }}>
      <h2 style={{ fontSize: "1.75rem", fontWeight: "700", marginBottom: "25px", letterSpacing: "-0.02em" }}>Your Shopping Cart</h2>

      {cartItems.length === 0 ? (
        <p style={{ color: "#475569", padding: "20px 0" }}>Your cart is empty. Explore the products catalog to add items!</p>
      ) : (
        <div>
          {cartItems.map(item => (
            <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e9ecef", padding: "20px 0" }}>
              <div>
                <h4 style={{ margin: "0 0 4px 0", fontSize: "1.1rem", fontWeight: "600", textTransform: "capitalize" }}>{item.name}</h4>
                <p style={{ margin: 0, color: "#475569", fontSize: "0.9rem" }}>Unit Price: ${parseFloat(item.price).toFixed(2)}</p>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", border: "1px solid #e9ecef", borderRadius: "4px", overflow: "hidden", background: "#f8f9fa" }}>
                  <button 
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    style={{ border: "none", background: "transparent", padding: "6px 12px", cursor: "pointer", fontWeight: "700", color: "#475569" }}
                  >
                    −
                  </button>
                  
                  {/* ✅ TASK 4 FIX: Implemented custom utility classes to drop default native layout input spinners */}
                  <input 
                    type="number" 
                    min="1" 
                    value={item.quantity} 
                    readOnly
                    className="clean-core-quantity-input"
                    style={{ width: "40px", border: "none", borderLeft: "1px solid #e9ecef", borderRight: "1px solid #e9ecef", background: "#ffffff", padding: "6px 0", textAlign: "center", fontSize: "0.875rem", fontWeight: "600" }}
                  />
                  
                  <button 
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    style={{ border: "none", background: "transparent", padding: "6px 12px", cursor: "pointer", fontWeight: "700", color: "#475569" }}
                  >
                    +
                  </button>
                </div>
                
                <button 
                  onClick={() => removeFromCart(item.id)}
                  style={{ background: "transparent", color: "#dc2626", border: "1px solid rgba(220, 38, 38, 0.2)", padding: "6px 14px", borderRadius: "4px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "600" }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          <div style={{ marginTop: "30px", background: "#f8f9fa", padding: "24px", borderRadius: "6px", border: "1px solid #e9ecef" }}>
            <p style={{ display: "flex", justifyContent: "space-between", color: "#475569", fontSize: "0.95rem", marginBottom: "10px" }}>
              <span>Cart Subtotal:</span> <strong>${runningSubtotal.toFixed(2)}</strong>
            </p>
            {appliedPromo && (
              <p style={{ display: "flex", justifyContent: "space-between", color: "#16a34a", fontSize: "0.95rem", marginBottom: "10px" }}>
                <span>Discount Applied ({appliedPromo.code}):</span> <strong>-${discountAmount.toFixed(2)}</strong>
              </p>
            )}
            <hr style={{ border: "none", borderTop: "1px solid #e9ecef", margin: "15px 0" }} />
            <h3 style={{ display: "flex", justifyContent: "space-between", margin: "0 0 20px 0", fontSize: "1.3rem", fontWeight: "700" }}>
              <span>Total Billable:</span> <span style={{ color: "#2563eb" }}>${finalCheckoutTotal.toFixed(2)}</span>
            </h3>

            <button 
              onClick={executeSecureCheckout}
              disabled={isCheckingOut || cartItems.length === 0}
              style={{ width: "100%", padding: "12px", background: isCheckingOut ? "#ced4da" : "#2563eb", color: "#fff", border: "none", borderRadius: "4px", cursor: isCheckingOut ? "not-allowed" : "pointer", fontSize: "0.95rem", fontWeight: "700" }}
            >
              {isCheckingOut ? "Completing Purchase..." : "Proceed to Secure Checkout"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ShoppingCart;