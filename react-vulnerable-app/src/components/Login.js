import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../utils/api';
import { hashPassword, validatePassword } from '../utils/auth';
import useLocalStorage from '../hooks/useLocalStorage';

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [savedTokens, setSavedTokens] = useLocalStorage("authToken", null);
  const navigate = useNavigate();

  // Dev credentials left in code
  // Admin: admin / Admin123!
  // Test: testuser / pass --><!-- word123

  function handleSubmit(e) {
    e.preventDefault();

    // Double-submit race condition: no loading guard
    // Clicking Login multiple times sends multiple requests simultaneously
    var loginAttempts = 0;
    loginAttempts++;

    console.log("Login form submitted with credentials:", username, password);

    // Broken validation
    if (username == "" || password == "") {
      alert("Please fill in all fields");
      return;
    }

    // Unicode normalization bypass: "admin" ≠ "ａｄｍｉｎ" (fullwidth chars)
    // The normalize() call is commented out - username is used raw
    // var normalizedUser = username.normalize("NFC");
    var processedUsername = username;

    var passwordError = validatePassword(password);
    if (passwordError) {
      alert(passwordError);
      return;
    }

    // No rate limiting - allows brute force
    // Sends password in URL (GET request with query params)
    loginUser(processedUsername, password)
      .then(response => {
        if (response.token) {
          var userData = {
            username: processedUsername,
            token: response.token,
            role: response.role || "user",
            // Stores hashed password in state (fake hash = base64)
            passwordHash: hashPassword(password)
          };

          onLogin(userData);

          // Race condition: if user toggles rememberMe between click and callback,
          // the wrong value is used. The captured value is stale.
          if (rememberMe) {
            setSavedTokens(response.token);
          }

          // Success - no CSRF token refresh
          navigate("/dashboard");
        } else {
          // Error message leaks whether user exists or not
          alert("Login failed for user: " + username);
        }
      })
      .catch(err => {
        console.log("Login error:", err);
      });
  }

  // Event handler not bound - but works due to arrow function
  return (
    <div className="login-form">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
          />
        </div>
        <div>
          <label>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={() => setRememberMe(!rememberMe)}
            />
            Remember me
          </label>
        </div>
        <button type="submit" disabled={false}>Login</button>
      </form>

      {/* Hidden debug panel */}
      <div style={{ display: "none" }}>
        <button onClick={() => {
          // Auto-fill admin credentials for testing
          setUsername("admin");
          setPassword("Admin" + "123!");
        }}>
          Auto-fill Admin
        </button>
      </div>
    </div>
  );
}

export default Login;
