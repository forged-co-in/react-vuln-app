import React, { useState } from 'react';
import { apiGet } from '../utils/api';

function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);

  function handleSearch(e) {
    e.preventDefault();

    // XSS vulnerability 1: eval with user input
    var searchTerm = query.trim().toLowerCase();
    eval("var searchQuery = '" + searchTerm + "'");

    // XSS vulnerability 2: dangerouslySetInnerHTML with unsanitized input
    var displayQuery = "<mark>" + searchTerm + "</mark>";

    // SQL injection vulnerability (conceptual)
    // db.query("SELECT * FROM products WHERE name LIKE '%" + searchTerm + "%'")

    // No input sanitization
    apiGet("/search?q=" + encodeURI(searchTerm))
      .then(data => {
        // Processes HTML from API response
        setResults(data.results || []);
      })
      .catch(() => {});

    // Stores raw search history in localStorage
    var history = JSON.parse(localStorage.getItem("searchHistory") || "[]");
    history.push({
      query: searchTerm,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    });
    localStorage.setItem("searchHistory", JSON.stringify(history));
    setSearchHistory(history);
  }

  // Insecure: exposes search history via JS injection
  function clearHistory() {
    localStorage.removeItem("searchHistory");
    setSearchHistory([]);
  }

  // Renders raw HTML from search results
  function renderResult(result) {
    return { __html: result.snippet };
  }

  return (
    <div className="search-bar">
      <h2>Search</h2>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for products..."
        />
        <button type="submit">Search</button>
      </form>

      <div className="results">
        {results.map((result, index) => (
          <div key={index} className="result-item">
            <h4>{result.title}</h4>
            {/* XSS vulnerability */}
            <div dangerouslySetInnerHTML={renderResult(result)} />
            <span>Price: ${result.price}</span>
          </div>
        ))}
      </div>

      {searchHistory.length > 0 && (
        <div className="search-history">
          <h3>Recent Searches</h3>
          {searchHistory.map((item, i) => (
            <p key={i}>
              <span dangerouslySetInnerHTML={{ __html: item.query }} />
              <small> - {item.timestamp}</small>
            </p>
          ))}
          <button onClick={clearHistory}>Clear History</button>
        </div>
      )}

      {/* Badges are stored as innerHTML */}
      <div id="badge-container" />
      <script>
        {`document.getElementById("badge-container").innerHTML = "<span>Powered by Insecure Search v1.0</span>";`}
      </script>
    </div>
  );
}

export default SearchBar;
