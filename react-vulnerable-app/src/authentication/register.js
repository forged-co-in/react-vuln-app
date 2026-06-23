import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ COMPLEX SECURITY EVALUATION LOGIC MATRIX
  const validationState = {
    minLength: password.length >= 5,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasDigit: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password)
  };

  const isPasswordValid = Object.values(validationState).every(Boolean);

 async function handleRegister(e) {
    e.preventDefault();
    setError("");

    if (!isPasswordValid) {
      setError("Please satisfy all password constraint parameters before proceeding.");
      return;
    }

    setLoading(true);

    try {
      // ✅ FIX: Changed from http://localhost:3000/api/register to dynamic relative path
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          password: password,
          role: "user"
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration request execution failure.");
      }

     Swal.fire({
        title: 'Account Created!',
        text: 'Your account has been generated successfully. Moving to Login page.',
        icon: 'success',
        confirmButtonColor: '#16a34a',
        confirmButtonText: 'Proceed to Login'
      }).then(() => {
        // Redirects the user only after they click the "Proceed to Login" button
        navigate("/login");
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="register-panel" style={{ padding: "30px", maxWidth: "440px", margin: "50px auto", border: "1px solid #e9ecef", borderRadius: "8px", backgroundColor: "#ffffff", boxShadow: "0 8px 24px rgba(0,0,0,0.04)" }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "20px", textAlign: "center", color: "#0f172a", letterSpacing: "-0.02em" }}>Create Secure Account</h2>
      
      {error && <p style={{ color: "#dc2626", backgroundColor: "#fef2f2", padding: "10px", borderRadius: "4px", fontSize: "0.85rem", fontWeight: "500", marginBottom: "15px" }}>⚠️ {error}</p>}
      
      <form onSubmit={handleRegister}>
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "6px", fontSize: "0.875rem", fontWeight: "600", color: "#334155" }}>Username</label>
          <input 
            type="text" 
            placeholder="Enter unique username" 
            value={username} 
            onChange={e => setUsername(e.target.value)} 
            style={{ width: "100%", padding: "10px", boxSizing: "border-box", borderRadius: "4px", border: "1px solid #e9ecef", fontSize: "0.9rem" }} 
            required 
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "6px", fontSize: "0.875rem", fontWeight: "600", color: "#334155" }}>Email Address</label>
          <input 
            type="email" 
            placeholder="name@example.com" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            style={{ width: "100%", padding: "10px", boxSizing: "border-box", borderRadius: "4px", border: "1px solid #e9ecef", fontSize: "0.9rem" }} 
            required 
          />
        </div>

        <div style={{ marginBottom: "15px", position: "relative" }}>
          <label style={{ display: "block", marginBottom: "6px", fontSize: "0.875rem", fontWeight: "600", color: "#334155" }}>Password</label>
          <input 
            type={showPassword ? "text" : "password"} 
            placeholder="••••••••" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            style={{ width: "100%", padding: "10px 40px 10px 12px", boxSizing: "border-box", borderRadius: "4px", border: "1px solid #e9ecef", fontSize: "0.9rem" }} 
            required 
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{ position: "absolute", right: "12px", top: "38px", background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", color: "#64748b", padding: 0 }}
          >
            {showPassword ? "👁️" : "🙈"}
          </button>
        </div>

        {/* ✅ DYNAMIC REQUIREMENTS VALIDATOR STACK */}
        <div style={{ background: "#f8fafc", padding: "15px", borderRadius: "6px", border: "1px solid #e2e8f0", marginBottom: "20px" }}>
          <p style={{ margin: "0 0 10px 0", fontSize: "0.8rem", fontWeight: "700", color: "#b91c1c" }}>Please satisfy all credential criteria listed below:</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.85rem" }}>
            <span style={{ color: validationState.minLength ? "#16a34a" : "#64748b", fontWeight: "500" }}>
              {validationState.minLength ? "✅" : "⚪"} Minimum 5 characters
            </span>
            <span style={{ color: validationState.hasUpper ? "#16a34a" : "#64748b", fontWeight: "500" }}>
              {validationState.hasUpper ? "✅" : "⚪"} Contains uppercase letter (A-Z)
            </span>
            <span style={{ color: validationState.hasLower ? "#16a34a" : "#64748b", fontWeight: "500" }}>
              {validationState.hasLower ? "✅" : "⚪"} Contains lowercase letter (a-z)
            </span>
            <span style={{ color: validationState.hasDigit ? "#16a34a" : "#64748b", fontWeight: "500" }}>
              {validationState.hasDigit ? "✅" : "⚪"} Contains numeral integer (0-9)
            </span>
            <span style={{ color: validationState.hasSpecial ? "#16a34a" : "#64748b", fontWeight: "500" }}>
              {validationState.hasSpecial ? "✅" : "⚪"} Contains special character symbol (@, #, $, etc.)
            </span>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading || !isPasswordValid}
          style={{ 
            width: "100%", 
            padding: "12px", 
            background: loading || !isPasswordValid ? "#cbd5e1" : "#16a34a", 
            color: "#fff", 
            border: "none", 
            borderRadius: "4px", 
            cursor: loading || !isPasswordValid ? "not-allowed" : "pointer",
            fontWeight: "600",
            fontSize: "0.95rem"
          }}
        >
          {loading ? "Processing Registration..." : "Sign Up Securely"}
        </button>
      </form>

      <p style={{ marginTop: "20px", textAlign: "center", fontSize: "0.875rem", color: "#475569" }}>
        Already have an account? <Link to="/login" style={{ color: "#2563eb", fontWeight: "600", textDecoration: "none" }}>Login here</Link>
      </p>
    </div>
  );
}

export default Register;
