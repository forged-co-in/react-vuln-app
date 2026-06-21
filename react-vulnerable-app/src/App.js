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
  const [premiumAlert, setPremiumAlert] = useState({ show: false, message: "", type: "success" });
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const navigate = useNavigate();

  const triggerAlert = (message, type = "success") => {
    setPremiumAlert({ show: true, message, type });
    setTimeout(() => {
      setPremiumAlert({ show: false, message: "", type: "success" });
    }, 3500);
  };

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setShowScrollBtn(true);
      } else {
        setShowScrollBtn(false);
      }
    };
    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

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
    triggerAlert("Session terminated. Logged out successfully.", "info");
    navigate("/login");
  }

  function addToCart(item) {
    if (!user || !user.name) {
      triggerAlert("🔒 Authentication Required! Please sign in first.", "error");
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
    triggerAlert(`🎉 Success! ${item.name} has been added to your shopping basket.`, "success");
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
    triggerAlert("Item removed from your basket.", "info");
  }

  return (
    <AppProvider>
      <ErrorBoundary>
        {/* ✅ ROOT FIX: Moved the loading escape gate inside the provider wrapper to fully kill the leaking text line on the DOM node */}
        {!isConfigLoading && (
          <div className="app-layout-wrapper">
            
            {premiumAlert.show && (
              <div className={`premium-toast-alert alert-type-${premiumAlert.type}`}>
                <div className="toast-content-wrapper">
                  <span className="toast-icon">
                    {premiumAlert.type === "success" ? "✓" : "ℹ"}
                  </span>
                  <p className="toast-text">{premiumAlert.message}</p>
                </div>
              </div>
            )}
            
            <nav className="navbar-container">
              <Link to="/" className="nav-brand">
                Forged <span>E-Commerce</span>
              </Link>
              
              <div className="nav-links-wrapper">
                <Link to="/" className="nav-item-link">Home</Link>
                <Link to="/products" className="nav-item-link">Products</Link>
                <Link to="/search" className="nav-item-link">Search</Link>
                
                <Link to="/cart" className="nav-item-link cart-link-badge">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                  </svg>
                  Cart <span className="cart-badge-count">{cart.reduce((total, item) => total + item.quantity, 0)}</span>
                </Link>

                {user ? (
                  <>
                    <Link to={`/profile/${user.id || "me"}`} className="nav-item-link profile-link-badge">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      Profile
                    </Link>
                    
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
                  <Link to="/login" className="nav-item-link" style={{ fontWeight: "600" }}>Login</Link>
                )}
              </div>
            </nav>

            <main className="main-content-viewport">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login onLogin={handleLogin} />} />
                <Route path="/register" element={<Register />} />
                <Route path="/profile/:id" element={<UserProfile />} />
                <Route path="/products" element={<ProductList addToCart={addToCart} />} />
                <Route path="/cart" element={<ShoppingCart cartItems={cart} updateQuantity={updateQuantity} removeFromCart={removeFromCart} triggerGlobalAlert={triggerAlert} />} />
                <Route path="/search" element={<SearchBar addToCart={addToCart} />} />
                <Route path="/orders/:username" element={<OrderHistory user={user} />} />
                <Route path="/admin" element={<ProtectedAdminRoute><AdminPanel user={user} /></ProtectedAdminRoute>} />
              </Routes>
            </main>

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
                
                {/* ✅ FOOTER RESTRUCTURE FIX: Button is placed directly AFTER the environment signature string and rendered as a minimalist circle */}
                <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                  <p style={{ color: "#94a3b8", margin: 0 }}>Integrated Environment: Production Node</p>
                  {showScrollBtn && (
                    <button 
                      onClick={scrollToTop} 
                      className="scroll-top-circle-btn"
                      title="Scroll to Top"
                    >
                      ▲
                    </button>
                  )}
                </div>
              </div>
            </footer>

            <NotificationCenter />
          </div>
        )}
      </ErrorBoundary>
    </AppProvider>
  );
}

function Home() {
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
        Discover premium inventory assets backed by instantaneous transaction workflows and military-grade encryption pipelines.
      </p>
      <div className="hero-cta-group">
        <Link to="/products" className="btn-primary-action">Explore Catalog</Link>
        <Link to="/search" className="btn-secondary-action">Search Database</Link>
      </div>
    </div>
  );
}

export default App;