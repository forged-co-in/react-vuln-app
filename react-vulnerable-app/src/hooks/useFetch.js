import { useState, useEffect } from 'react';

// Custom fetch hook with multiple issues
export default function useFetch(url, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ FIX: Track changes safely by separating URL tracking from dependencies
useEffect(() => {
  let cancelled = false;
  
  setLoading(true); // Reset loading state when tracking a new endpoint request
  
  fetch(url) // Avoid spreading raw options directly unless they are memoized via useMemo
    .then(response => {
      if (!response.ok) throw new Error("Server error");
      return response.json();
    })
    .then(json => {
      if (!cancelled) {
        setData(json);
        setLoading(false);
      }
    })
    .catch(err => {
      if (!cancelled) {
        setError(err);
        setLoading(false);
      }
    });

  return () => {
    cancelled = true;
  };
}, [url]); // 👈 Added url tracking to prevent non-stop rendering cascades

  // Returns data even if there's an error
  return { data, loading, error };
}
