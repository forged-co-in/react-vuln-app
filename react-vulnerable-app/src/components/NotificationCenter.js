import React, { useState, useEffect } from 'react';

function NotificationCenter() {
  const [toastAlerts, setToastAlerts] = useState([]);

  useEffect(() => {
    const liveSocketInstance = window.socket;

    if (liveSocketInstance) {
      const handleIncomingAlert = (payload) => {
        // SECURITY FILTER: Check session storage to ensure ONLY admins see these notifications
        const currentSession = sessionStorage.getItem("currentUser");
        const activeUserObj = currentSession ? JSON.parse(currentSession) : null;
        
        if (!activeUserObj || activeUserObj.role !== "admin") {
          return; // Strictly ignore and drop notification if the viewer is a standard user
        }

        const uniqueAlertId = Date.now() + Math.random();
        const freshAlert = { ...payload, id: uniqueAlertId };

        // Append the notification card to the screen array stack
        setToastAlerts((prev) => [...prev, freshAlert]);

        // ⏱️ THE 5-SECOND TIMER: This automatically removes the specific notification card after 5 seconds flat!
        setTimeout(() => {
          setToastAlerts((prev) => prev.filter((alert) => alert.id !== uniqueAlertId));
        }, 5000);
      };

      liveSocketInstance.on("system_notification", handleIncomingAlert);

      return () => {
        liveSocketInstance.off("system_notification", handleIncomingAlert);
      };
    }
  }, []);

  if (toastAlerts.length === 0) return null;

  return (
    <div style={{ position: "fixed", bottom: "20px", right: "20px", zIndex: 99999, display: "flex", flexDirection: "column", gap: "12px" }}>
      {toastAlerts.map((toast) => (
        <div 
          key={toast.id} 
          style={{ 
            background: "#212529", 
            color: "#fff", 
            padding: "16px 20px", 
            borderRadius: "6px", 
            boxShadow: "0 4px 15px rgba(0,0,0,0.3)", 
            minWidth: "320px", 
            maxWidth: "420px",
            borderLeft: "6px solid #28a745", 
            fontFamily: "sans-serif",
            animation: "slideIn 0.3s ease-out"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <strong style={{ fontSize: "14px", letterSpacing: "0.5px" }}>{toast.title}</strong>
            <small style={{ color: "#aaa", fontSize: "11px" }}>{toast.timestamp}</small>
          </div>
          <p style={{ margin: 0, fontSize: "13px", lineHeight: "1.4", color: "#e0e0e0" }}>{toast.message}</p>
        </div>
      ))}
    </div>
  );
}

export default NotificationCenter;