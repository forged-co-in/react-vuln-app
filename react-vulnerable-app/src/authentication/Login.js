import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser, verifyAdmin2Fa } from '../utils/api';

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [is2FaStep, setIs2FaStep] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    if (!is2FaStep) {
      loginUser(username.trim(), password)
        .then(res => {
          if (res.error) {
            alert(res.error);
            return;
          }
          if (res.requires2Fa) {
            setIs2FaStep(true);
            alert("🔒 2FA Verification Passcode code dispatched to registered mail account parameters.");
          } else {
            onLogin(res);
            navigate("/");
          }
        })
        .catch(err => console.error("Login handshake error:", err))
        .finally(() => setLoading(false));
    } else {
      verifyAdmin2Fa(username.trim(), otp.trim())
        .then(res => {
          if (res.error) {
            alert(res.error);
            return;
          }
          onLogin(res);
          navigate("/admin");
        })
        .catch(err => console.error("2FA validation error:", err))
        .finally(() => setLoading(false));
    }
  }

  return (
    <div className="login-panel" style={{ padding: "30px", maxWidth: "400px", margin: "50px auto", border: "1px solid #ccc", borderRadius: "8px", fontFamily: "sans-serif" }}>
      <h2>{is2FaStep ? "🔒 Enter 2FA OTP Code" : "Account Session Sign-In"}</h2>
      
      <form onSubmit={handleSubmit}>
        {!is2FaStep ? (
          <>
            <div style={{ marginBottom: "12px" }}>
              <input 
                type="text" 
                placeholder="Username" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                style={{ display: "block", width: "100%", padding: "10px", boxSizing: "border-box", borderRadius: "4px", border: "1px solid #ccc" }} 
                required 
              />
            </div>
            <div style={{ marginBottom: "15px" }}>
              <input 
                type="password" 
                placeholder="Password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                style={{ display: "block", width: "100%", padding: "10px", boxSizing: "border-box", borderRadius: "4px", border: "1px solid #ccc" }} 
                required 
              />
            </div>
          </>
        ) : (
          <div style={{ marginBottom: "15px" }}>
            <input 
              type="text" 
              placeholder="6-Digit OTP verification passcode code" 
              value={otp} 
              onChange={e => setOtp(e.target.value)} 
              style={{ display: "block", width: "100%", padding: "10px", boxSizing: "border-box", borderRadius: "4px", border: "1px solid #ccc", textAlign: "center", fontSize: "16px", letterSpacing: "2px" }} 
              required 
            />
          </div>
        )}
        
        <button 
          type="submit" 
          disabled={loading}
          style={{ width: "100%", padding: "10px", background: "#007bff", color: "#fff", border: "none", borderRadius: "4px", cursor: loading ? "not-allowed" : "pointer", fontWeight: "bold" }}
        >
          {loading ? "Processing..." : is2FaStep ? "Verify Authorization Code" : "Login Securely"}
        </button>
      </form>

      {!is2FaStep && (
        <p style={{ marginTop: "20px", textAlign: "center", fontSize: "14px" }}>
          Don't have an account yet? <Link to="/register" style={{ color: "#28a745", fontWeight: "bold", textDecoration: "none" }}>Register Here</Link>
        </p>
      )}
    </div>
  );
}

export default Login;