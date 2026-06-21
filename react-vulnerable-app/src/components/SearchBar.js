import React, { useState } from 'react';
import { apiGet } from '../utils/api';

// ✅ FIXED: Destructured addToCart from component props
function SearchBar({ addToCart }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState("");

  function handleSearch(e) {
    e.preventDefault();
    const searchTerm = query.trim();
    
    if (searchTerm.length < 2) {
      setWarning("Please enter at least 2 characters to search accurately.");
      setResults([]);
      return;
    }

    setWarning(""); 
    setLoading(true);
    setHasSearched(true);

    apiGet("/search?q=" + encodeURIComponent(searchTerm))
      .then(data => {
        setResults(data.results || []);
      })
      .catch(err => console.error("Error executing database search stream:", err))
      .finally(() => setLoading(false));
  }

  return (
    <div className="search-bar" style={{ padding: "30px", maxWidth: "800px", margin: "auto", fontFamily: "sans-serif" }}>
      <h2>Catalog Search Tool</h2>
      
      <form onSubmit={handleSearch} style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
        <input 
          type="text" 
          value={query} 
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.trim().length >= 2) setWarning(""); 
          }} 
          placeholder="Type product name (e.g., Laptop, Mouse)..." 
          style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }}
          required
        />
        <button 
          type="submit" 
          style={{ padding: "10px 25px", background: "#007bff", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {warning && (
        <p style={{ color: "#856404", backgroundColor: "#fff3cd", padding: "10px", borderRadius: "4px", margin: "0 0 20px 0", fontSize: "14px" }}>
          ⚠️ {warning}
        </p>
      )}

      <div className="results">
        {loading ? (
          <p style={{ color: "#666" }}>Scanning database clusters...</p>
        ) : results.length > 0 ? (
          results.map((result) => (
            <div 
              key={result.id || result.title} 
              className="result-item" 
              style={{ 
                border: "1px solid #ddd", 
                padding: "20px", 
                borderRadius: "6px", 
                marginBottom: "15px", 
                backgroundColor: "#fff",
                display: "flex",
                justifyContent: "between",
                alignItems: "center"
              }}
            >
              {/* Left Side: Product details */}
              <div style={{ flexGrow: 1 }}>
                <h4 style={{ margin: "0 0 5px 0", color: "#007bff", fontSize: "18px" }}>{result.title}</h4>
                <p style={{ margin: "0 0 8px 0", color: "#555", fontSize: "14px" }}>{result.snippet || "No description provided."}</p>
                <span style={{ fontWeight: "bold", color: "#28a745", fontSize: "16px" }}>Price: ${result.price}</span>
              </div>

              {/* Right Side: ✅ NEW Add to Cart Action Button */}
              <div>
                <button 
                  onClick={() => {
                    // Rebuild the object structure to match expected shopping cart item keys
                    const productMapping = {
                      id: result.id,
                      name: result.title,
                      price: result.price
                    };
                    addToCart(productMapping);
                    alert(`"${result.title}" added to your cart!`);
                  }}
                  style={{ 
                    padding: "10px 16px", 
                    background: "#28a745", 
                    color: "#fff", 
                    border: "none", 
                    borderRadius: "4px", 
                    cursor: "pointer", 
                    fontWeight: "bold" 
                  }}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))
        ) : (
          hasSearched && !warning && (
            <p style={{ color: "#721c24", backgroundColor: "#f8d7da", padding: "12px", borderRadius: "4px" }}>
              No inventory items match your target keywords. Try another word!
            </p>
          )
        )}
      </div>
    </div>
  );
}

export default SearchBar;