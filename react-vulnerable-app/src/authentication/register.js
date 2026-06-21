import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:3000/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          password: password,
          role: "user" // ✅ FIXED: Always force "user" role on public signup
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration request execution failure.");
      }

      alert("User account generated successfully! Moving to Login page.");
      navigate("/login");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="register-panel" style={{ padding: "30px", maxWidth: "400px", margin: "50px auto", border: "1px solid #ccc", borderRadius: "8px" }}>
      <h2>Create Secure Account</h2>
      
      {error && <p style={{ color: "red", backgroundColor: "#ffe6e6", padding: "10px", borderRadius: "4px" }}>{error}</p>}
      
      <form onSubmit={handleRegister}>
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>Username</label>
          <input 
            type="text" 
            placeholder="Enter unique username" 
            value={username} 
            onChange={e => setUsername(e.target.value)} 
            style={{ width: "100%", padding: "8px", boxSizing: "border-box" }} 
            required 
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>Email Address</label>
          <input 
            type="email" 
            placeholder="name@example.com" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            style={{ width: "100%", padding: "8px", boxSizing: "border-box" }} 
            required 
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>Password</label>
          <input 
            type="password" 
            placeholder="••••••••" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            style={{ width: "100%", padding: "8px", boxSizing: "border-box" }} 
            required 
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            width: "100%", 
            padding: "10px", 
            background: loading ? "#cccccc" : "#28a745", 
            color: "#fff", 
            border: "none", 
            borderRadius: "4px", 
            cursor: loading ? "not-allowed" : "pointer" 
          }}
        >
          {loading ? "Processing Registration..." : "Sign Up Securely"}
        </button>
      </form>

      <p style={{ marginTop: "15px", textAlign: "center", fontSize: "14px" }}>
        Already have an account? <Link to="/login" style={{ color: "#007bff" }}>Login here</Link>
      </p>
    </div>
  );
}

export default Register;