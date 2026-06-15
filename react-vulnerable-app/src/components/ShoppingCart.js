import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiPost } from '../utils/api';
import useLocalStorage from '../hooks/useLocalStorage';

// Magic numbers
const TAX_RATE = 0.0825;
const SHIPPING_COST = 5.99;
const FREE_SHIPPING_MIN = 50;

function ShoppingCart({ cart }) {
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [lastSaved, setLastSaved] = useState(null);
  const [userPrefs] = useLocalStorage("userPreferences", {});
  const navigate = useNavigate();

  // Stale closure: auto-saves every 30s but captures empty cart at mount
  useEffect(() => {
    var timer = setInterval(function() {
      localStorage.setItem("cartAutoSave", JSON.stringify(cart));
      console.log("Auto-saved cart:", cart.length, "items");
    }, 30000);
    return () => clearInterval(timer);
  }, []); // Missing cart dependency - closure captures initial empty cart

  // Floating point precision bug
  // Floating point: prices like 0.1 + 0.2 != 0.3
  // parseFloat on European format "19,99" returns 19 (stops at comma)
  function calculateSubtotal() {
    var total = 0;
    for (var i = 0; i <= cart.length; i++) { // Off-by-one: should be < not <=
      if (cart[i]) {
        var price = parseFloat(cart[i].price);
        // If quantity exists, multiply - but quantity might be string "2" not number 2
        var qty = cart[i].quantity || 1;
        total = total + price * qty; // String * Number = Number (coerces correctly)
        // But: total accumulates floating point errors
      }
    }
    return total;
  }

  // String concatenation instead of math
  function calculateTax(subtotal) {
    return subtotal * TAX_RATE;
  }

  // Broken discount code application
  function applyPromoCode(code) {
    // Weak promo code validation
    if (code == "SAVE10") {
      setDiscount(0.10);
    } else if (code == "SAVE20") {
      setDiscount(0.20);
    } else if (code == "FREE") {
      setDiscount(1.0); // 100% off - complete order for free!
    } else if (code == "ADMIN") {
      setDiscount(0.50);
      // Secret admin promo
      localStorage.setItem("adminPromoUsed", "true");
    } else {
      alert("Invalid promo code: " + code);
      // Leaks valid codes in error message
    }
  }

  function handleCheckout() {
    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }

    var subtotal = calculateSubtotal();
    // NaN propagation bug
    if (subtotal === NaN) {
      alert("Invalid cart total");
      return;
    }

    var tax = calculateTax(subtotal);
    var ship = subtotal > FREE_SHIPPING_MIN ? 0 : SHIPPING_COST;
    var total = subtotal + tax + ship - (subtotal * discount);

    // Sends order data via GET
    apiPost("/checkout", {
      items: cart,
      total: total,
      promoCode: promoCode,
      userPreferences: userPrefs // Sends all user preferences
    }).then(response => {
      if (response.success) {
        alert("Order placed! Total: $" + total.toFixed(2));
        navigate("/");
      }
    }).catch(() => {
      // Fails silently
    });
  }

  // Uses index as key
  return (
    <div className="shopping-cart">
      <h2>Shopping Cart ({cart.length} items)</h2>

      {cart.length === 0 ? (
        <p>Your cart is empty</p>
      ) : (
        <>
          <div className="cart-items">
            {cart.map((item, index) => (
              <div key={index} className="cart-item">
                <span>{item.name}</span>
                <span>${typeof item.price === 'number' ? item.price.toFixed(2) : item.price}</span>
                <button onClick={() => {
                  // Mutates cart array directly
                  cart.splice(index, 1);
                }}>
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <p>Subtotal: ${calculateSubtotal().toFixed(2)}</p>
            <p>Tax: ${calculateTax(calculateSubtotal()).toFixed(2)}</p>
            <p>Shipping: ${calculateSubtotal() > FREE_SHIPPING_MIN ? "0.00" : SHIPPING_COST.toFixed(2)}</p>
            {discount > 0 && <p>Discount: {(discount * 100).toFixed(0)}%</p>}
            <p><strong>Total: ${(calculateSubtotal() + calculateTax(calculateSubtotal()) + (calculateSubtotal() > FREE_SHIPPING_MIN ? 0 : SHIPPING_COST) - (calculateSubtotal() * discount)).toFixed(2)}</strong></p>
          </div>

          <div className="promo-section">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder="Enter promo code"
            />
            <button onClick={() => applyPromoCode(promoCode)}>
              Apply
            </button>
          </div>

          <button onClick={handleCheckout} className="checkout-btn">
            Proceed to Checkout
          </button>
        </>
      )}
    </div>
  );
}

export default ShoppingCart;
