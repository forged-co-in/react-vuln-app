import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import Login from './authentication/Login';
import Register from './authentication/register';
import UserProfile from './components/UserProfile';
import ProductList from './components/ProductList';
import ShoppingCart from './components/ShoppingCart';
import SearchBar from './components/SearchBar';
import AdminPanel from './components/AdminPanel';
import ErrorBoundary from './components/ErrorBoundary';
import NotificationCenter from './components/NotificationCenter'; 
import { AppProvider, useAppContext } from './context/AppContext';
import OrderHistory from './components/OrderHistory';
import { fetchUserCartFromServer, syncUserCartToServer } from './utils/api';
import './styles/App.css';

function ProtectedAdminRoute({ children }) {
  const cachedSession = sessionStorage.getItem("currentUser");
  if (!cachedSession) return <Navigate to="/login" replace />;

  try {
    const sessionObj = JSON.parse(cachedSession);
    const isValidAdmin = 
      sessionObj && 
      sessionObj.role === "admin" && 
      sessionObj.token && 
      sessionObj.token.startsWith("admin-secure-session");

    if (!isValidAdmin) return <Navigate to="/login" replace />;
  } catch (e) {
    sessionStorage.removeItem("currentUser");
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [isConfigLoading, setIsConfigLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = sessionStorage.getItem("currentUser");
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        if (parsedUser.role === "admin" && (!parsedUser.token || !parsedUser.token.startsWith("admin-secure-session"))) {
          sessionStorage.removeItem("currentUser");
          setUser(null);
        } else {
          setUser(parsedUser);
        }
      } catch (e) {
        sessionStorage.removeItem("currentUser");
      }
    }
    setIsConfigLoading(false);
  }, []);

  useEffect(() => {
    if (user && user.name) {
      fetchUserCartFromServer(user.name.toLowerCase()).then(cloudCart => {
        if (cloudCart && cloudCart.items) setCart(cloudCart.items);
      }).catch(err => {
        console.error(err);
        setCart([]);
      });
    } else {
      setCart([]);
    }
  }, [user]);

  function handleLogin(userData) {
    setUser(userData);
    sessionStorage.setItem("currentUser", JSON.stringify(userData));
  }

  function handleLogout() {
    setUser(null);
    sessionStorage.removeItem("currentUser");
    navigate("/login");
  }

  function addToCart(item) {
    if (!user || !user.name) {
      alert("🔒 Authentication Required to buy products!");
      navigate("/login");
      return;
    }
    setCart(prevCart => {
      const existingItem = prevCart.find(i => i.id === item.id);
      const updatedCart = existingItem 
        ? prevCart.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
        : [...prevCart, { ...item, quantity: 1 }];
      syncUserCartToServer(user.name.toLowerCase(), updatedCart);
      return updatedCart;
    });
  }

  function updateQuantity(id, newQuantity) {
    if (!user || !user.name) return;
    setCart(prevCart => {
      const updatedCart = prevCart.map(item => item.id === id ? { ...item, quantity: Math.max(1, newQuantity) } : item);
      syncUserCartToServer(user.name.toLowerCase(), updatedCart);
      return updatedCart;
    });
  }

  function removeFromCart(id) {
    if (!user || !user.name) return;
    setCart(prevCart => {
      const updatedCart = prevCart.filter(item => item.id !== id);
      syncUserCartToServer(user.name.toLowerCase(), updatedCart);
      return updatedCart;
    });
  }

  if (isConfigLoading) {
    return (
      <div style={{ padding: "100px 30px", textAlign: "center" }}>
        <h3 style={{ color: "#64748b" }}>Initializing professional security layers...</h3>
      </div>
    );
  }

  return (
    <AppProvider>
      <ErrorBoundary>
        <div className="app-layout-wrapper">
          
          {/* ✅ THE COMPLETED CUSTOM NAVBAR WITH ICON LOGIC & REMOVED DASHBOARD */}
          <nav className="navbar-container">
            <Link to="/" className="nav-brand">
              Forged <span>E-Commerce</span>
            </Link>
            
            <div className="nav-links-wrapper">
              <Link to="/" className="nav-item-link">Home</Link>
              <Link to="/products" className="nav-item-link">Products</Link>
              <Link to="/search" className="nav-item-link">Search</Link>
              
              <Link to="/cart" className="nav-item-link cart-link-badge">
                {/* Shopping Basket Vector SVG Inline Icon Element */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                Cart <span className="cart-badge-count">{cart.reduce((total, item) => total + item.quantity, 0)}</span>
              </Link>

              {user ? (
                <>
                  <Link to={`/profile/${user.id || "me"}`} className="nav-item-link">Profile</Link>
                  
                  {user.role === "admin" ? (
                    <Link to="/admin?tab=orders" className="nav-item-link">Orders</Link>
                  ) : (
                    <Link 
                      to={`/orders/${(user.name || user.username || "").toLowerCase()}`} 
                      className="nav-item-link"
                      onClick={() => { setTimeout(() => window.location.reload(), 50); }}
                    >
                      Orders
                    </Link>
                  )}

                  {user.role === "admin" && user.token && user.token.startsWith("admin-secure-session") && (
                    <Link to="/admin" className="nav-item-link admin-highlight">Admin</Link>
                  )}
                  <button onClick={handleLogout} className="logout-btn-nav">Logout</button>
                </>
              ) : (
                <Link to="/login" className="nav-item-link" style={{ color: "#ffffff", fontWeight: "600" }}>Login</Link>
              )}
            </div>
          </nav>

          {/* Core Content Pipeline Mount Ports */}
          <main className="main-content-viewport">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login onLogin={handleLogin} />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile/:id" element={<UserProfile />} />
              <Route path="/products" element={<ProductList addToCart={addToCart} />} />
              <Route path="/cart" element={<ShoppingCart cartItems={cart} updateQuantity={updateQuantity} removeFromCart={removeFromCart} />} />
              <Route path="/search" element={<SearchBar addToCart={addToCart} />} />
              <Route path="/orders/:username" element={<OrderHistory user={user} />} />
              <Route path="/admin" element={<ProtectedAdminRoute><AdminPanel user={user} /></ProtectedAdminRoute>} />
            </Routes>
          </main>

          {/* ✅ THE HIGH QUALITY CORPORATE ANIMATED ENTERPRISE FOOTER COMPONENT */}
          <footer className="enterprise-footer">
            <div className="footer-top-grid">
              <div className="footer-info-col">
                <h4>Forged E-Commerce Ltd.</h4>
                <p>Engineered with next-generation architectural frameworks to deliver robust secure retail distribution layers globally.</p>
              </div>
              <div className="footer-links-col">
                <h5>Navigation</h5>
                <ul>
                  <li><Link to="/products">Store Catalog</Link></li>
                  <li><Link to="/cart">Shopping Basket</Link></li>
                  <li><Link to="/search">Query Search</Link></li>
                </ul>
              </div>
              <div className="footer-links-col">
                <h5>Compliance</h5>
                <ul>
                  <li><a href="#privacy">Privacy Protocol</a></li>
                  <li><a href="#terms">Terms of Utility</a></li>
                  <li><a href="#support">Security Matrix Help</a></li>
                </ul>
              </div>
            </div>
            <div className="footer-bottom-bar">
              <p>&copy; {new Date().getFullYear()} Forged E-Commerce Platform. All operational execution vectors verified.</p>
              <p style={{ color: "#64748b" }}>Integrated Environment: Production Node</p>
            </div>
          </footer>

          <NotificationCenter />
        </div>
      </ErrorBoundary>
    </AppProvider>
  );
}

// ✅ THE HIGH QUALITY ANIMATED BRANDED HOME VIEW COMPONENT
function Home() {
  const { state = { user: null } } = useAppContext();

  return (
    <div className="home-hero-section">
      <div className="hero-pill-badge">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"></polygon>
        </svg>
        Next-Gen Retail Engineering Architecture
      </div>
      
      <h1 className="hero-main-title">
        Experience the Next Era of <em>Forged E-Commerce</em> Platforms
      </h1>
      
      <p className="hero-sub-description">
        Welcome {state?.user?.name ? `back, ${state.user.name}` : "Guest Operator"}! Discover premium inventory assets backed by instantaneous transaction workflows and military-grade encryption pipelines.
      </p>
      
      <div className="hero-cta-group">
        <Link to="/products" className="btn-primary-action">Explore Catalog</Link>
        <Link to="/search" className="btn-secondary-action">Search Database</Link>
      </div>

      {/* Branded Showcase Cards Grid */}
      <div className="home-features-showcase">
        <div className="feature-showcase-card">
          <div className="feature-child-wrapper">
            <div className="feature-card-icon">
              <svg width="20" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </div>
            <h3 className="feature-card-title">Cryptographic Logs</h3>
            <p className="feature-card-text">Every single state change and user session token remains locked inside strict validation scopes.</p>
          </div>
        </div>
        <div className="feature-showcase-card">
          <div className="feature-child-wrapper">
            <div className="feature-card-icon">
              <svg width="20" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
            </div>
            <h3 className="feature-card-title">Dynamic Sync Streams</h3>
            <p className="feature-card-text">Real-time Socket.io handshakes continuously refresh catalog datasets across your active viewport layers.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;