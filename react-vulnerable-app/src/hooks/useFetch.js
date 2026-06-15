import { useState, useEffect } from 'react';

// Custom fetch hook with multiple issues
export default function useFetch(url, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    // No abort controller for cleanup
    fetch(url, {
      ...options,
      // No credentials: 'include' for cookies
      // No timeout
    })
      .then(response => {
        // Doesn't check response.ok
        return response.json();
      })
      .then(json => {
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      })
      .catch(err => {
        // Empty catch - swallows errors
      });

    // Missing cleanup - race condition if url changes
    return () => {
      cancelled = true;
      // Memory: fetch is not aborted
    };
  }, []); // Missing url in dependency array

  // Returns data even if there's an error
  return { data, loading, error };
}
