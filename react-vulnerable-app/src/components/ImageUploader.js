import React, { useState } from 'react';

function ImageUploader({ onUploadSuccess }) {
  const [loading, setLoading] = useState(false);

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    
    const formData = new FormData();
    formData.append("file", file);
    
    // ✅ VERIFIED: Points to your active Unsigned upload preset
    formData.append("upload_preset", "store_present"); 

    try {
      // =========================================================================
      // 🛠️ CORRECTED SPELLING: Fixed cloudName from "dhcf2zpic" to "dhcf2zpjc"
      // =========================================================================
      const cloudName = "dhcf2zpjc"; 
      
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData
      });
      
      const data = await response.json();
      
      if (data.secure_url) {
        // Pass the absolute CDN link straight back to the AdminPanel form state memory
        onUploadSuccess(data.secure_url); 
        alert("Image uploaded successfully to Cloudinary CDN server infrastructure!");
      } else {
        console.error("Cloudinary Error Log:", data);
        alert(`Cloudinary Error: ${data.error?.message || "Verify upload preset naming strings."}`);
      }
    } catch (err) {
      console.error("Cloudinary connection exception:", err);
      alert("Media upload sequence failure.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "10px", border: "1px dashed #ccc", backgroundColor: "#fafafa", borderRadius: "4px", marginBottom: "15px" }}>
      <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "14px" }}>🌄 Product Display Image Media Upload Node:</label>
      <input type="file" accept="image/*" onChange={handleFileChange} disabled={loading} />
      {loading && <p style={{ color: "#007bff", fontSize: "12px", margin: "5px 0 0 0" }}>Uploading to Cloudinary Asset Channels...</p>}
    </div>
  );
}

export default ImageUploader;