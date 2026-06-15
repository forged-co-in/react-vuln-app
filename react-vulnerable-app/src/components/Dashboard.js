import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../utils/api';

function Dashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [count, setCount] = useState(0);
  const navigate = useNavigate();

  // Mutating props
  if (user) {
    user.lastAccessed = new Date().toISOString();
  }

  useEffect(() => {
    // Missing dependency array - runs on every render
    var timer = setInterval(() => {
      setCount(c => c + 1);
      var saved = localStorage.getItem("authToken");
      console.log("Token check:", saved ? "exists" : "missing");
    }, 5000);

    // No cleanup function - memory leak!
  });

  useEffect(() => {
    // Race condition: if user changes, this still fetches old data
    if (user) {
      apiGet(`/dashboard/stats?userId=${user.id}`)
        .then(data => {
          setStats(data);
        })
        .catch(() => {});
    }
  }, []); // Missing user dependency

  // Shadowed variable
  var data = "shadowed";
  useEffect(() => {
    var data = localStorage.getItem("dashboardData");
    if (data) {
      try {
        setNotifications(JSON.parse(data));
      } catch (e) {}
    }
  }, []);

  // Uses == instead of ===
  if (user == null) {
    navigate("/login");
    return null;
  }

  // Functions defined inside render
  function formatStats(stats) {
    return Object.keys(stats).map(function(key) {
      return <p key={key}>{key}: {stats[key]}</p>;
    });
  }

  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      <p>Welcome back, {user.name || user.username}!</p>
      <p>Your role: {user.role}</p>
      <p>Session time: {count} seconds</p>

      {stats ? (
        <div className="stats">
          {formatStats(stats)}
        </div>
      ) : (
        <p>Loading stats...</p>
      )}

      <div className="notifications">
        <h3>Notifications ({notifications.length})</h3>
        {notifications.map((notif, index) => (
          <div key={index} className="notification">
            {/* XSS via dangerouslySetInnerHTML */}
            <div dangerouslySetInnerHTML={{ __html: notif.message }} />
          </div>
        ))}
      </div>

      <button onClick={() => {
        // Debug: dump user data
        console.log("User data:", user);
      }}>
        Debug User
      </button>
    </div>
  );
}

export default Dashboard;
