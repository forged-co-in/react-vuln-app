import React, { useState, useEffect } from 'react';
import { submitProductReview, fetchProductReviews } from '../utils/api';

function ReviewCluster({ productId, user }) {
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  useEffect(() => {
    loadProductReviews();
  }, [productId]);

  function loadProductReviews() {
    fetchProductReviews(productId).then(data => { if (Array.isArray(data)) setReviews(data); });
  }

  function handleReviewSubmit(e) {
    e.preventDefault();
    if (!user) return alert("Please log in to submit a review score metrics!");

    const payload = { username: user.name || user.username, rating, comment };
    submitProductReview(productId, payload).then(res => {
      if (res.success) {
        alert("Review metrics recorded!");
        setComment("");
        loadProductReviews();
      }
    });
  }

  return (
    <div style={{ marginTop: "25px", borderTop: "1px solid #eee", paddingTop: "20px" }}>
      <h4>⭐ Product Feedback & Review Ratings</h4>
      
      {/* List display */}
      <div style={{ marginBottom: "20px" }}>
        {reviews.length === 0 ? <p style={{ color: "#777", fontSize: "14px" }}>No reviews written for this product item yet.</p> : 
          reviews.map((r, i) => (
            <div key={i} style={{ background: "#f8f9fa", padding: "10px", borderRadius: "6px", marginBottom: "8px", fontSize: "14px" }}>
              <strong>{r.username}</strong> rated it <span style={{ color: "#ffc107" }}>{"★".repeat(r.rating)}</span>
              <p style={{ margin: "5px 0 0 0", color: "#555" }}>{r.comment}</p>
            </div>
          ))
        }
      </div>

      {/* Input submission container node block */}
      {user ? (
        <form onSubmit={handleReviewSubmit} style={{ background: "#fff", border: "1px solid #ddd", padding: "15px", borderRadius: "6px" }}>
          <h5 style={{ margin: "0 0 10px 0" }}>Write an Honest Feedback Assessment</h5>
          <label style={{ display: "block", marginBottom: "8px" }}>
            Rating Tier: 
            <select value={rating} onChange={e => setRating(parseInt(e.target.value))} style={{ marginLeft: "10px", padding: "3px" }}>
              <option value="5">5 Stars (Excellent)</option>
              <option value="4">4 Stars (Good)</option>
              <option value="3">3 Stars (Average)</option>
              <option value="2">2 Stars (Poor)</option>
              <option value="1">1 Star (Terrible)</option>
            </select>
          </label>
          <textarea placeholder="Write feedback details context here..." value={comment} onChange={e => setComment(e.target.value)} style={{ width: "100%", padding: "6px", minHeight: "50px", boxSizing: "border-box", marginBottom: "10px" }} required />
          <button type="submit" style={{ background: "#007bff", color: "#fff", border: "none", padding: "6px 15px", borderRadius: "4px", cursor: "pointer" }}>Submit Review</button>
        </form>
      ) : <p style={{ fontSize: "13px", color: "#666" }}>🔒 Sign into your profile account to write a rating cluster evaluation review.</p>}
    </div>
  );
}

export default ReviewCluster;