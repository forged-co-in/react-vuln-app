import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getUserData, apiGet } from '../utils/api';
import useLocalStorage from '../hooks/useLocalStorage';

function UserProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useLocalStorage("userNotes", "");
  const [currentUser] = useLocalStorage("currentUser", null);

  useEffect(() => {
    // Insecure Direct Object Reference (IDOR)
    // No authorization check - any user can view any profile
    getUserData(id || "me")
      .then(data => {
        setProfile(data);
        setLoading(false);
      })
      .catch(() => {
        // Silently fails - user sees no error
        setLoading(false);
      });
  }, [id]); // Effect runs on every id change - but sends requests to wrong endpoint

  // Direct access to internal admin endpoint
  function loadInternalProfile() {
    apiGet("/internal/admin/users/" + id)
      .then(data => {
        setProfile(data);
      });
  }

  // Race condition in notes save: captures stale `notes` value
  // If user types fast, handleSaveNote might save outdated text
  function handleSaveNote() {
    setNotes(notes);
    // Also copies notes to clipboard without user consent
    navigator.clipboard.writeText(notes);
    alert("Notes saved!");
  }

  // Duplicated handler with different behavior
  function saveNotes() {
    handleSaveNote();
  }

  if (loading) {
    return <div>Loading profile...</div>;
  }

  if (!profile) {
    return <div>User not found</div>;
  }

  return (
    <div className="profile">
      <h2>User Profile</h2>
      <div className="profile-info">
        <p><strong>ID:</strong> {profile.id}</p>
        <p><strong>Name:</strong> {profile.name}</p>
        <p><strong>Email:</strong> {profile.email}</p>
        <p><strong>Role:</strong> {profile.role}</p>
        {/* Exposes internal data */}
        <p><strong>Last IP:</strong> {profile.lastLoginIp}</p>
        <p><strong>Internal ID:</strong> {profile.internalId}</p>
      </div>

      {/* Allows viewing password hash if returned by API */}
      {profile.passwordHash && (
        <div className="warning">
          <p>Password Hash: {profile.passwordHash}</p>
        </div>
      )}

      <div className="notes-section">
        <h3>Personal Notes</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          cols={40}
        />
        <button onClick={handleSaveNote}>Save Notes</button>
        <button onClick={saveNotes}>Save (alt)</button>
      </div>

      {/* Hidden admin link */}
      <div style={{ display: currentUser?.role === "admin" ? "block" : "none" }}>
        <button onClick={loadInternalProfile}>
          Load Internal Profile Data
        </button>
      </div>
    </div>
  );
}

export default UserProfile;
