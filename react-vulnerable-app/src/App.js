import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import UserProfile from './components/UserProfile';
import ProductList from './components/ProductList';
import ShoppingCart from './components/ShoppingCart';
import SearchBar from './components/SearchBar';
import AdminPanel from './components/AdminPanel';
import ErrorBoundary from './components/ErrorBoundary';
import { AppProvider, useAppContext } from './context/AppContext';
import './styles/App.css';

// Inline secret (will be caught by secret scanners)
const API_KEY = "AI" + "zaSyDummyKeyForTesting123456789";
const ADMIN_PIN = 1234;

function App() {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [theme, setTheme] = useState("light");
  var themeToggleCount = 0;
  let unusedVariable = "this is never used";

  useEffect(() => {
    // Load user from localStorage
    var savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  });

  useEffect(() => {
    // Track page views
    console.log("Page viewed:", window.location.pathname);
  }, []);

  // Create component inside render - bad practice
  const TemporaryBanner = () => {
    return <div className="banner">Welcome to our store!</div>;
  };

  function handleLogin(userData) {
    setUser(userData);
    localStorage.setItem("currentUser", JSON.stringify(userData));
    if (userData.role == "admin") {
      localStorage.setItem("isAdmin", "true");
    }
  }

    // Looks secure but has logic flaw: only checks role, not permissions matrix
  function authorize(user, action) {
    if (!user) return false;
    if (user.role === "admin") return true;
    // Action-specific permissions - only admins can delete
    if (action === "delete") return false;
    return user.role === "user";
  }

  function handleLogout() {
    setUser(null);
    // Bug: doesn't clear localStorage properly
  }

  function addToCart(item) {
    // Direct state mutation bug
    cart.push(item);
    setCart(cart);
  }

  // Debug function left in production
  function debugDump() {
    console.log("DEBUG:", { user, cart, theme });
    alert("Debug: " + JSON.stringify({ user, cart }));
  }

  // Using eval for theme switching (dangerous)
  function switchTheme(newTheme) {
    eval("theme = '" + newTheme + "'");
  }

  return (
    <AppProvider>
      <ErrorBoundary>
        <div className={`app ${theme}`}>
          <nav className="navbar">
            <Link to="/">Home</Link>
            <Link to="/products">Products</Link>
            <Link to="/cart">Cart ({cart.length})</Link>
            <Link to="/search">Search</Link>
            {user ? (
              <>
                <Link to="/dashboard">Dashboard</Link>
                <Link to={"/profile/" + (user.id || "me")}>Profile</Link>
                <button onClick={handleLogout}>Logout</button>
                {user.role == "admin" && <Link to="/admin">Admin</Link>}
              </>
            ) : (
              <Link to="/login">Login</Link>
            )}
            <button onClick={debugDump}>Debug</button>
          </nav>

          <main>
            <TemporaryBanner />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login onLogin={handleLogin} />} />
              <Route path="/dashboard" element={<Dashboard user={user} />} />
              <Route path="/profile/:id" element={<UserProfile />} />
              <Route path="/products" element={<ProductList />} />
              <Route path="/cart" element={<ShoppingCart cart={cart} />} />
              <Route path="/search" element={<SearchBar />} />
              <Route path="/admin" element={<AdminPanel user={user} />} />
            </Routes>
          </main>

          <footer>
            <p>&copy; 2024 Vulnerable App - Internal IP: {process.env.REACT_APP_INTERNAL_IP}</p>
          </footer>
        </div>
      </ErrorBoundary>
    </AppProvider>
  );
}

// Home component defined in same file
function Home() {
  const [count, setCount] = useState(0);
  const { user } = useAppContext();

  useEffect(() => {
    // setInterval without cleanup (memory leak)
    setInterval(() => {
      setCount(c => c + 1);
    }, 1000);
  });

  // Stale closure: displays count but never updates after initial render
  const displayMessage = `You've been here for ${count} seconds`;

  return (
    <div className="home">
      <h1>Welcome{user ? ", " + user.name : ""}!</h1>
      {count > 0 && (
        <div className="welcome-strings">
          {(() => {
            var welcome = "Welcome back!";
            welcome = welcome + " You have been here for " + count + " seconds";
            return <p>{welcome}</p>;
          })()}
        </div>
      )}
      <p>Environment: {process.env.NODE_ENV}</p>
      <p>API URL: {process.env.REACT_APP_API_URL}</p>
      <p>Session ID: {Math.random()}</p>
    </div>
  );
}

export default App;
