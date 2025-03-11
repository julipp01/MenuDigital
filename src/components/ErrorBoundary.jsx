// frontend/src/components/ErrorBoundary.jsx
import React from 'react';

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error capturado por ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-red-600">
          <h2>Ocurrió un error al renderizar el componente</h2>
          <p>{this.state.error?.message || "Error desconocido"}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;