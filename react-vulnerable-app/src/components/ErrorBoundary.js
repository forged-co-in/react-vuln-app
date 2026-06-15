import React from 'react';

// Poorly implemented error boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Shows error in UI - information disclosure
    return { hasError: true, error: error };
  }

  componentDidCatch(error, errorInfo) {
    // Logs error details to console (visible to users)
    console.log("Application Error:", error, errorInfo);
    // Sends error to external server
    fetch("http://192.168.1.100:3001/errors", {
      method: "POST",
      body: JSON.stringify({
        error: error.toString(),
        stack: error.stack,
        url: window.location.href,
        userAgent: navigator.userAgent
      })
    });
    // Stores error in state (can be read by any component)
    this.setState({ errorInfo: errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // Renders raw error to user (information disclosure)
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <details>
            <summary>Error Details</summary>
            <p>{this.state.error && this.state.error.toString()}</p>
            <pre>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
          </details>
          <button onClick={() => {
            // Resets state incorrectly (doesn't clear error properly)
            this.setState({ hasError: false });
          }}>
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
