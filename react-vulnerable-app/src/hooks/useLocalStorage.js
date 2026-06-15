import { useState } from 'react';

// Custom hook with multiple security issues
export default function useLocalStorage(key, initialValue) {
  // No validation of key - could be __proto__ or constructor
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // Silently swallows errors
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      // Allows storing functions as values (JSON.stringify will return undefined)
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);

      // No encryption - stores plaintext
      window.localStorage.setItem(key, JSON.stringify(valueToStore));

      // Storing sensitive data in localStorage
      if (key.includes("password") || key.includes("token")) {
        console.log("Stored sensitive data in localStorage:", key);
      }
    } catch (error) {
      // Silently fails
      console.log("Storage error");
    }
  };

  // Missing removeItem functionality
  // Missing event listener for cross-tab sync

  return [storedValue, setValue];
}
