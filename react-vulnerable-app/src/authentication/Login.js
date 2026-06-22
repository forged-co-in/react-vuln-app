import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { loginUser, verifyAdmin2Fa } from '../utils/api';

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // ✅ Visual toggle state
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
            Swal.fire({
              title: 'Login Failed',
              text: res.error || 'Incorrect username or password.',
              icon: 'error',
              confirmButtonColor: '#6366f1'
            });
            return;
          }
          
          if (res.requires2Fa) {
            setIs2FaStep(true);
            Swal.fire({
              title: '2FA Verification Required',
              text: '🔒 A security validation passcode has been dispatched to your registered email account parameters.',
              icon: 'info',
              confirmButtonColor: '#2563eb'
            });
          } else {
            Swal.fire({
              title: 'Login Successful',
              text: `Welcome ${res.name || username}!`,
              icon: 'success',
              confirmButtonColor: '#2563eb'
            });
            onLogin(res);
            navigate("/");
          }
        })
        .catch(err => {
          console.error("Login handshake error:", err);
          Swal.fire({
            title: 'Network Error',
            text: 'Communication mismatch during credential verification entry.',
            icon: 'error',
            confirmButtonColor: '#6366f1'
          });
        })
        .finally(() => setLoading(false));
    } else {
      verifyAdmin2Fa(username.trim(), otp.trim())
        .then(res => {
          if (res.error) {
            Swal.fire({
              title: 'Validation Blocked',
              text: res.error || 'The entered OTP passcode token is incorrect.',
              icon: 'error',
              confirmButtonColor: '#6366f1'
            });
            return;
          }

          Swal.fire({
            title: 'Authorization Clear',
            text: 'Admin identity established successfully.',
            icon: 'success',
            confirmButtonColor: '#2563eb'
          });
          onLogin(res);
          navigate("/admin");
        })
        .catch(err => {
          console.error("2FA validation error:", err);
          Swal.fire({
            title: 'Verification Failure',
            text: 'Could not complete multi-factor authentication loops.',
            icon: 'error',
            confirmButtonColor: '#6366f1'
          });
        })
        .finally(() => setLoading(false));
    }
  }

  return (
    <div className="login-panel" style={{ padding: "30px", maxWidth: "400px", margin: "50px auto", border: "1px solid #e9ecef", borderRadius: "8px", background: "#ffffff", boxShadow: "0 8px 24px rgba(0,0,0,0.04)" }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "20px", textAlign: "center", color: "#0f172a", letterSpacing: "-0.02em" }}>
        {is2FaStep ? "🔒 Enter 2FA OTP Code" : "Account Session Sign-In"}
      </h2>
      
      <form onSubmit={handleSubmit}>
        {!is2FaStep ? (
          <>
            <div style={{ marginBottom: "12px" }}>
              <input 
                type="text" 
                placeholder="Username" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                style={{ display: "block", width: "100%", padding: "10px 12px", boxSizing: "border-box", borderRadius: "4px", border: "1px solid #e9ecef", fontSize: "0.9rem" }} 
                required 
              />
            </div>
            {/* ✅ PASSWORD EYE TOGGLE GRID WRAPPER */}
            <div style={{ marginBottom: "20px", position: "relative" }}>
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                style={{ display: "block", width: "100%", padding: "10px 40px 10px 12px", boxSizing: "border-box", borderRadius: "4px", border: "1px solid #e9ecef", fontSize: "0.9rem" }} 
                required 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", color: "#64748b", padding: 0 }}
              >
                {showPassword ? "👁️" : "🙈"}
              </button>
            </div>
          </>
        ) : (
          <div style={{ marginBottom: "20px" }}>
            <input 
              type="text" 
              placeholder="6-Digit OTP verification code" 
              value={otp} 
              onChange={e => setOtp(e.target.value)} 
              style={{ display: "block", width: "100%", padding: "12px", boxSizing: "border-box", borderRadius: "4px", border: "1px solid #e9ecef", textAlign: "center", fontSize: "16px", letterSpacing: "4px", fontWeight: "600" }} 
              required 
            />
          </div>
        )}
        
        <button 
          type="submit" 
          disabled={loading}
          style={{ width: "100%", padding: "12px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "4px", cursor: loading ? "not-allowed" : "pointer", fontWeight: "600", fontSize: "0.95rem", transition: "background 0.2s" }}
        >
          {loading ? "Processing..." : is2FaStep ? "Verify Authorization Code" : "Login Securely"}
        </button>
      </form>

      {!is2FaStep && (
        <p style={{ marginTop: "24px", textAlign: "center", fontSize: "0.875rem", color: "#475569" }}>
          Don't have an account yet? <Link to="/register" style={{ color: "#16a34a", fontWeight: "600", textDecoration: "none" }}>Register Here</Link>
        </p>
      )}
    </div>
  );
}

export default Login;