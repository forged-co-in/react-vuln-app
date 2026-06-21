import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiGet } from '../utils/api'; // Standard secure API mapping hook

function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");

  // =========================================================================
  // 🔒 SECURE SESSION ACCESS LOOKUP
  // =========================================================================
  const cachedSession = sessionStorage.getItem("currentUser");
  const currentUser = cachedSession ? JSON.parse(cachedSession) : null;
  const loggedInUsername = currentUser?.name || currentUser?.username;

  useEffect(() => {
    // If no valid session is active at all, reject immediately
    if (!currentUser || !loggedInUsername) {
      alert("🔒 Authentication Required: Please log in to view your profile dashboard.");
      navigate("/login");
      return;
    }

    // Determine target username context safely
    // If the dynamic route parameter is "me" or matches the logged-in session, load it.
    const targetUser = (!id || id === "me") ? loggedInUsername : id.trim();

    // 🔒 STRICT IDOR GUARD: Protect standard client profiles from manual URL snooping
    if (currentUser.role !== "admin" && targetUser.toLowerCase() !== loggedInUsername.toLowerCase()) {
      alert("⛔ Access Denied: You do not possess structural authority permissions to inspect other user profiles.");
      navigate(`/profile/${loggedInUsername}`);
      return;
    }

    setLoading(true);

    // Fetch directly from the standardized user endpoints matching your backend database maps
    apiGet(`/admin/users`)
      .then(data => {
        if (Array.isArray(data)) {
          // Find the profile matching our targeted username string key properties
          const matchedProfile = data.find(u => u.username.toLowerCase() === targetUser.toLowerCase());
          
          if (matchedProfile) {
            setProfile({
              id: matchedProfile.username,
              name: matchedProfile.username,
              email: matchedProfile.email,
              role: matchedProfile.role
            });

            // Initialize localized tab notes matching this exact profile identity cleanly
            const savedNotes = sessionStorage.getItem(`notes_${matchedProfile.username}`);
            setNotes(savedNotes || "");
          } else {
            setProfile(null);
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Profile payload stream reading error:", err);
        setLoading(false);
      });
  }, [id, navigate, loggedInUsername]);

  // Handles real-time personal text saving mechanics securely
  function handleSaveNote() {
    if (!profile) return;
    
    // Save cleanly matching the unique targeted profile index key string parameter
    sessionStorage.setItem(`notes_${profile.name}`, notes);
    alert("✨ Personal note changes stored successfully in this tab session!");
  }

  if (loading) {
    return (
      <div style={{ padding: "50px", textAlign: "center", fontFamily: "sans-serif" }}>
        <h3>Scanning profile database indexes...</h3>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ padding: "50px", textAlign: "center", fontFamily: "sans-serif", color: "#dc3545" }}>
        <h3>🔍 User Profile Not Found</h3>
        <p>The targeted account registration metrics do not map to an active user record identifier block.</p>
      </div>
    );
  }

  return (
    <div className="profile" style={{ padding: "30px", maxWidth: "600px", margin: "30px auto", border: "1px solid #ddd", borderRadius: "8px", backgroundColor: "#fff", fontFamily: "sans-serif" }}>
      <h2 style={{ borderBottom: "2px solid #007bff", paddingBottom: "10px", marginTop: 0 }}>👤 User Dashboard Profile</h2>
      
      <div className="profile-info" style={{ lineHeight: "1.8", fontSize: "16px", margin: "20px 0" }}>
        <p><strong>Account ID / Username:</strong> <span style={{ color: "#007bff" }}>{profile.id}</span></p>
        {/* <p><strong>Display Contact Tag:</strong> {profile.name}</p> */}
        <p><strong>Registered Email Address:</strong> {profile.email}</p>
        <p><strong>Authority Classification Tier:</strong> <span style={{ fontWeight: "bold", color: profile.role === "admin" ? "#dc3545" : "#28a745" }}>{profile.role.toUpperCase()}</span></p>
      </div>

      <div className="notes-section" style={{ marginTop: "30px", borderTop: "1px solid #eee", paddingTop: "20px" }}>
        <h3>📝 Private Tab Notes (Isolated Context)</h3>
        <p style={{ fontSize: "13px", color: "#777", margin: "0 0 10px 0" }}>These text notes are securely locked to this window view and won't leak onto shared devices.</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={6}
          style={{ width: "100%", boxSizing: "border-box", padding: "10px", borderRadius: "4px", border: "1px solid #ccc", marginBottom: "12px", resize: "vertical", fontFamily: "inherit" }}
          placeholder="Jot down secure transaction codes or internal notes here..."
        />
        <button 
          onClick={handleSaveNote} 
          style={{ width: "100%", background: "#007bff", color: "#fff", border: "none", padding: "10px", borderRadius: "4px", fontWeight: "bold", cursor: "pointer" }}
        >
          Save Private Notes String
        </button>
      </div>
    </div>
  );
}

export default UserProfile;