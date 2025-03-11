import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";

const HomePage = lazy(() => import("./pages/HomePage"));
const AdminDashboard = lazy(() => import("@/components/AdminDashboard"));
const Login = lazy(() => import("./components/Auth/Login"));
const Register = lazy(() => import("./components/Auth/Register"));
const MenuViewer = lazy(() => import("./components/MenuViewer"));

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-orange-500"></div>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingFallback />;
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingFallback />;
  return user ? <Navigate to="/admin" replace /> : children;
};

const MenuViewerWrapper = () => {
  const { restaurantId } = useParams();
  return <MenuViewer restaurantId={restaurantId} />;
};

const AppRoutes = () => {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/admin/*" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/menu/:restaurantId" element={<MenuViewerWrapper />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

const App = () => (
  <Router>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </Router>
);

export default App;