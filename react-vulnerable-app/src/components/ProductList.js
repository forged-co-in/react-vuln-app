import React, { useState, useEffect } from 'react';
import { fetchLiveProducts } from '../utils/api'; // Importing live api route connection hook

const FREE_SHIPPING_THRESHOLD = 50;

function ProductList({ addToCart }) {
  const [products, setProducts] = useState([]); // Controlled local state array instead of static array
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [loading, setLoading] = useState(true);

  // Read active product collection states from backend server on render lifecycle
  useEffect(() => {
    fetchLiveProducts()
      .then(data => {
        if (Array.isArray(data)) {
          setProducts(data);
        }
      })
      .catch(err => console.error("Error reading database catalog items:", err))
      .finally(() => setLoading(false));
  }, []);

  // Filter products based on search
  const filtered = products.filter(p => 
    p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort products based on dropdown selection
  if (sortBy === "price") {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sortBy === "name") {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === "price-desc") {
    filtered.sort((a, b) => b.price - a.price);
  }

  if (loading) {
    return <p style={{ padding: "30px", textAlign: "center" }}>Loading storefront catalog products...</p>;
  }

  return (
    <div className="product-list" style={{ padding: "30px", maxWidth: "1200px", margin: "auto" }}>
      <h2>Products Catalog Storefront ({filtered.length} live items)</h2>

      {/* Control Filter Toolbar */}
      <div style={{ display: "flex", gap: "15px", marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: "8px", width: "100%", maxWidth: "300px" }}
        />

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: "8px" }}>
          <option value="name">Name</option>
          <option value="price">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>
      </div>

      {/* Main Grid View */}
      {filtered.length === 0 ? (
        <p style={{ color: "#666" }}>No items match your search or inventory is completely empty right now.</p>
      ) : (
        <div className="products-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "20px" }}>
          {filtered.map(product => (
            <div className="product-card" key={product.id} style={{ border: "1px solid #ddd", padding: "20px", borderRadius: "8px", backgroundColor: "#fff", display: "flex", flexDirection: "column", justifyContent: "between" }}>
              
              {/* =========================================================================
                  🌄 NEW: PRODUCT IMAGE RENDERING CONTAINER WITH FALLBACK PLACEHOLDER BOX
                  ========================================================================= */}
              <div style={{ width: "100%", height: "180px", backgroundColor: "#f0f2f5", borderRadius: "6px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "15px", border: "1px solid #eaeaea" }}>
                {product.image ? (
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                  />
                ) : (
                  <div style={{ color: "#999", fontSize: "14px", textAlign: "center", padding: "10px" }}>
                    📷 No Image Available
                  </div>
                )}
              </div>

              <h3 style={{ marginTop: "0", marginBottom: "8px", fontSize: "18px" }}>{product.name}</h3>
              <p style={{ color: "#666", fontSize: "14px", flexGrow: 1, marginBottom: "12px" }}>{product.description}</p>
              <p style={{ fontWeight: "bold", margin: "0 0 4px 0", fontSize: "16px" }}>Price: ${product.price}</p>
              
              <p style={{ fontSize: "13px", color: product.stock > 0 ? "green" : "red", margin: "0 0 15px 0" }}>
                {product.stock > 0 ? `In Stock: ${product.stock} units` : "Out of Stock"}
              </p>

              <button 
                onClick={() => addToCart(product)}
                disabled={product.stock <= 0}
                style={{ 
                  width: "100%", 
                  padding: "10px", 
                  background: product.stock > 0 ? "#007bff" : "#ccc", 
                  color: "#fff", 
                  border: "none", 
                  borderRadius: "4px", 
                  fontWeight: "bold",
                  cursor: product.stock > 0 ? "pointer" : "not-allowed",
                  marginTop: "auto"
                }}
              >
                {product.stock > 0 ? "Add to Cart" : "Unavailable"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProductList;