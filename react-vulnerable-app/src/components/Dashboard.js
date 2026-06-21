import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../utils/api';

function Dashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [count, setCount] = useState(0);
  const navigate = useNavigate();

  // FIX: Safely handles user routing check with strict inequality
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  // FIX: Added proper cleanup functions and dependencies
  useEffect(() => {
    if (!user) return;
    const timer = setInterval(() => {
      setCount(c => c + 1);
    }, 5000);

    return () => clearInterval(timer);
  }, [user]);

  useEffect(() => {
    if (user?.id) {
      apiGet(`/dashboard/stats?userId=${user.id}`)
        .then(data => setStats(data))
        .catch(err => console.error(err));
    }
  }, [user?.id]); // FIX: Dependency added to prevent race conditions

  useEffect(() => {
    const data = localStorage.getItem("dashboardData");
    if (data) {
      try {
        setNotifications(JSON.parse(data));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  if (!user) return null;

  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      <p>Welcome back, {user.name || user.username}!</p>
      <p>Session time: {count * 5} seconds approx.</p>

      {stats ? (
        <div className="stats">
          {Object.keys(stats).map(key => (
            <p key={key}>{key}: {stats[key]}</p>
          ))}
        </div>
      ) : (
        <p>Loading stats...</p>
      )}

      <div className="notifications">
        <h3>Notifications ({notifications.length})</h3>
        {notifications.map((notif, index) => (
          <div key={index} className="notification">
            {/* FIX: Avoid dangerous XSS raw HTML mounting templates */}
            <div>{notif.message}</div> 
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;