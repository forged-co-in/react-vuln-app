import React, { useState, useEffect } from 'react';
import { fetchLiveProducts } from '../utils/api';

function ProductList({ addToCart }) {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name"); // "name", "price-asc", or "price-desc"
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLiveProducts()
      .then(data => {
        if (Array.isArray(data)) setProducts(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  const handleItemPurchaseAction = (product) => {
    addToCart(product);
  };

  // ✅ TASK 2 FIX: Evaluates sorting vectors based on Low-to-High or High-to-Low selection parameters
  const filteredProducts = products
    .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "price-asc") {
        return parseFloat(a.price) - parseFloat(b.price);
      }
      if (sortBy === "price-desc") {
        return parseFloat(b.price) - parseFloat(a.price);
      }
      return a.name.localeCompare(b.name); // Default falls back to Name alphabetical order
    });

  if (isLoading) {
    return <div className="loading-placeholder">Querying live store catalog database...</div>;
  }

  return (
    <div className="products-view-container" style={{ padding: "40px 4rem", maxWidth: "1200px", margin: "0 auto" }}>
      <h2 style={{ marginBottom: "20px", fontSize: "1.75rem", fontWeight: "700", letterSpacing: "-0.02em" }}>
        Products Catalog Storefront ({filteredProducts.length} live items)
      </h2>
      
      <div style={{ display: "flex", gap: "12px", marginBottom: "30px" }}>
        {/* <input 
          type="text" 
          placeholder="Search products..." 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)}
          style={{ padding: "0.6rem 1rem", borderRadius: "4px", border: "1px solid #e9ecef", width: "280px", fontSize: "0.9rem" }}
        />
         */}
        {/* Upgraded Sort Select Menu Options */}
        <select 
          value={sortBy} 
          onChange={e => setSortBy(e.target.value)}
          style={{ padding: "0.6rem 1rem", borderRadius: "4px", border: "1px solid #e9ecef", background: "#ffffff", fontSize: "0.9rem", color: "#0f172a", fontWeight: "500" }}
        >
          <option value="name">Sort by Name</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>
      </div>

      <div className="products-grid-system" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "2rem" }}>
        {filteredProducts.map(product => {
          const isOutOfStock = product.stock <= 0;
          return (
            <div key={product.id} className="feature-showcase-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
              <div>
                <div style={{ width: "100%", height: "200px", background: "#f8f9fa", borderRadius: "4px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.25rem", border: "1px solid #e9ecef" }}>
                  {product.image ? (
                    <img src={product.image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>📷 Image Unavailable</span>
                  )}
                </div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: "600", marginBottom: "4px", textTransform: "capitalize" }}>{product.name}</h3>
                <p style={{ color: "#475569", fontSize: "0.875rem", marginBottom: "1rem" }}>{product.description || "No description provided."}</p>
              </div>
              
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                  <span style={{ fontWeight: "700", color: "#0f172a" }}>Price: ${parseFloat(product.price).toFixed(2)}</span>
                  <span style={{ fontSize: "0.8rem", fontWeight: "600", color: isOutOfStock ? "#dc2626" : "#16a34a" }}>
                    {isOutOfStock ? "Out of Stock" : `In Stock: ${product.stock} units`}
                  </span>
                </div>
                
                <button 
                  onClick={() => handleItemPurchaseAction(product)}
                  disabled={isOutOfStock}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    background: isOutOfStock ? "#e9ecef" : "#2563eb",
                    color: isOutOfStock ? "#94a3b8" : "#ffffff",
                    border: "none",
                    borderRadius: "4px",
                    fontWeight: "600",
                    cursor: isOutOfStock ? "not-allowed" : "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  {isOutOfStock ? "Unavailable" : "Add to Cart"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ProductList;