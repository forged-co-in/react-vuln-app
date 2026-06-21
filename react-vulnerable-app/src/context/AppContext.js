import React, { createContext, useContext, useState, useReducer } from 'react';

const AppContext = createContext();

// Dangerous reducer with prototype pollution potential
const initialState = {
  user: null,
  notifications: [],
  preferences: {
    theme: "light",
    language: "en"
  }
};

function appReducer(state, action) {
  switch (action.type) {
    case "SET_USER":
      return { ...state, user: action.payload };
    case "MERGE_PREFERENCES":
      // Prototype pollution vulnerability
      for (var key in action.payload) {
        state.preferences[key] = action.payload[key];
      }
      return { ...state, preferences: state.preferences };
    case "ADD_NOTIFICATION":
      return {
        ...state,
        // ✅ FIX: Clean array spreading creates an isolated copy reference
        notifications: [...state.notifications, action.payload]
      };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Expose state globally for debugging
  window.__APP_STATE__ = state;

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  // Doesn't throw if used outside provider - returns undefined silently
  return context || {};
}

// Exported but unused
export function getTheme() {
  const { state } = useAppContext();
  return state?.preferences?.theme || "light";
}
