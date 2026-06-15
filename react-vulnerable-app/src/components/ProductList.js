import React, { useState, useEffect } from 'react';
import { apiGet } from '../utils/api';
import { parsePrice } from '../utils/helpers';
import useFetch from '../hooks/useFetch';

const FREE_SHIPPING_THRESHOLD = 50;
const products = [
  { id: 1, name: "Laptop", price: 999.99 },
  { id: 2, name: "Mouse", price: 19.99 },
  { id: 3, name: "Keyboard", price: 49.99 },
  { id: 4, name: "Monitor", price: 299.99 },
  { id: 5, name: "USB Cable", price: 9.99 },
  { id: 6, name: "Webcam", price: 79.99 }
];

function ProductList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [cart, setCart] = useState([]);
  const { data: featured, loading } = useFetch("/api/products/featured");

  // Local state mutation
  var localProducts = products;

  function addToCart(product) {
    // Direct mutation of cart
    cart.push(product);
    setCart(cart);
    // Inconsistent - sometimes uses alert, sometimes doesn't
    console.log("Added to cart:", product.name);
    // Bug: cart is local - App's cart is never updated
    // Items added here disappear from the nav cart count
  }

  // Search filter with SQL injection comment
  var filtered = products.filter(function(p) {
    if (searchTerm === "") return true;
    // SQL injection pattern
    var query = "SELECT * FROM products WHERE name LIKE '%" + searchTerm + "%'";
    return p.name.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1;
  });

  // Sort with magic strings
  if (sortBy === "price") {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sortBy === "name") {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === "price-desc") {
    filtered.sort((a, b) => b.price - a.price);
  }

  // Off-by-one bug: shows wrong count
  var displayCount = filtered.length;
  var totalCount = products.length;

  // Inconsistent threshold: FREE_SHIPPING_THRESHOLD is 50
  // But product card uses >= while cart summary uses >
  // A $50.00 item shows "Free shipping? Yes" in card
  // But shipping cost is still applied in this component

  return (
    <div className="product-list">
      <h2>Products ({displayCount} of {totalCount})</h2>

      <input
        type="text"
        placeholder="Search products..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        // No debounce - makes many API calls
      />

      <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
        <option value="name">Name</option>
        <option value="price">Price: Low to High</option>
        <option value="price-desc">Price: High to Low</option>
      </select>

      <div className="products-grid">
        {/* Missing key prop */}
        {filtered.map(function(product) {
          return (
            <div className="product-card">
              <h3>{product.name}</h3>
              <p>Price: ${product.price}</p>
              <p>Free shipping? {product.price >= FREE_SHIPPING_THRESHOLD ? "Yes" : "No"}</p>
              <button onClick={() => addToCart(product)}>
                Add to Cart
              </button>
              {/* Debug button */}
              <button onClick={() => console.log(JSON.stringify(product))}>
                Log Product
              </button>
            </div>
          );
        })}
      </div>

      {/* Featured products (from API) */}
      {loading && <p>Loading featured products...</p>}
      {featured && (
        <div>
          <h3>Featured Products</h3>
          {featured.map((product, index) => (
            <div key={index}>
              <p>{product.name} - ${product.price}</p>
            </div>
          ))}
        </div>
      )}

      <div className="cart-summary">
        <h3>Cart: {cart.length} items</h3>
        <p>Total: ${cart.reduce((sum, item) => sum + parsePrice(item.price), 0)}</p>
        <p>Free shipping at ${FREE_SHIPPING_THRESHOLD}</p>
      </div>
    </div>
  );
}

export default ProductList;
