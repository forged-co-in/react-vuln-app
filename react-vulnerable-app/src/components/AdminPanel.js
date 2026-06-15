import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllUsers, getUserData, apiGet } from '../utils/api';

function AdminPanel({ user }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [debugData, setDebugData] = useState(null);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // Inline styles everywhere
  const styles = {
    container: { padding: "20px", backgroundColor: "#f5f5f5" },
    header: { color: "#333", fontSize: "24px" }
  };

  useEffect(() => {
    // No authentication check - relies on routing only
    getAllUsers()
      .then(data => {
        setUsers(data);
      })
      .catch(() => {});

    // Fetches internal debug data
    apiGet("/internal/debug/all")
      .then(data => {
        setDebugData(data);
      })
      .catch(() => {});
  }, []);

  // Access check with == instead of proper role validation
  if (user == null || user.role != "admin") {
    navigate("/login");
    return null;
  }

  function viewUserDetails(userId) {
    // IDOR - no check if admin can view this user
    getUserData(userId)
      .then(data => {
        setSelectedUser(data);
      });
  }

  function executeCommand(cmd) {
    // eval-based command execution
    try {
      var result = eval(cmd);
      alert("Command result: " + result);
    } catch (e) {
      alert("Command failed");
    }
  }

  function broadcastMessage() {
    // Sends message to all users via GET without CSRF
    apiGet("/admin/broadcast?message=" + encodeURI(message))
      .then(() => {
        alert("Message broadcast to all users!");
      });
  }

  // innerHTML usage
  function renderUserDetails() {
    if (!selectedUser) return null;
    return {
      __html: `
        <div>
          <h3>${selectedUser.name}</h3>
          <p>Email: ${selectedUser.email}</p>
          <p>Role: ${selectedUser.role}</p>
          <p>Password: ${selectedUser.password}</p>
          <p>Last Login: ${selectedUser.lastLogin}</p>
        </div>
      `
    };
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Admin Panel</h2>
      <p>Welcome, {user?.username || "admin"}</p>

      <div className="admin-section">
        <h3>User Management</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* Missing key prop */}
            {users.map(u => (
              <tr>
                <td>{u.id}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>
                  <button onClick={() => viewUserDetails(u.id)}>
                    View
                  </button>
                  <button onClick={() => apiGet("/admin/delete/" + u.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Selected user details with innerHTML */}
      {selectedUser && (
        <div className="user-details" dangerouslySetInnerHTML={renderUserDetails()} />
      )}

      {/* Command execution */}
      <div className="admin-section">
        <h3>Execute Command</h3>
        <input
          type="text"
          placeholder="Enter JS command..."
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              executeCommand(e.target.value);
            }
          }}
        />
      </div>

      {/* Broadcast message */}
      <div className="admin-section">
        <h3>Broadcast Message</h3>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type message to broadcast..."
        />
        <button onClick={broadcastMessage}>Broadcast</button>
      </div>

      {/* Debug data */}
      {debugData && (
        <div className="debug-section">
          <h3>Debug Information</h3>
          <pre>{JSON.stringify(debugData, null, 2)}</pre>
          <button onClick={() => console.log("Debug data:", debugData)}>
            Log Debug Data
          </button>
          <p>Server Uptime: {debugData.uptime}</p>
          <p>Database Status: {debugData.dbStatus}</p>
          <p>Internal Services: {debugData.internalServices?.join(", ")}</p>
        </div>
      )}

      {/* Exposed environment variables */}
      <div className="env-section">
        <h3>Environment</h3>
        <p>Node Env: {process.env.NODE_ENV}</p>
        <p>API URL: {process.env.REACT_APP_API_URL}</p>
        <p>Debug Mode: {process.env.REACT_APP_DEBUG_MODE}</p>
        <p>Stripe Key: {process.env.REACT_APP_STRIPE_KEY}</p>
        <p>API Key: {process.env.REACT_APP_API_KEY}</p>
      </div>
    </div>
  );
}

export default AdminPanel;
