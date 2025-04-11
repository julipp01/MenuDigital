// src/App.jsx
import { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Sidebar from "./components/Sidebar";
import AdminDashboard from "./components/AdminDashboard/AdminDashboard";

// Lazy-loaded components
const HomePage = lazy(() => import("./pages/HomePage"));
const Login = lazy(() => import("./components/Auth/Login"));
const Register = lazy(() => import("./components/Auth/Register"));
const NuevoRestaurante = lazy(() => import("./components/AdminDashboard/NuevoRestaurante"));
const EditarRestaurante = lazy(() => import("./components/AdminDashboard/EditarRestaurante"));
const AdminSuscripciones = lazy(() => import("./components/AdminDashboard/AdminSuscripciones"));
const MenuPreview = lazy(() => import("./components/AdminDashboard/MenuEditor/MenuPreview"));
const DashboardHome = lazy(() => import("./components/AdminDashboard/DashboardHome"));
const AccountDetails = lazy(() => import("./components/AdminDashboard/UserList"));
const MenuManager = lazy(() => import("./components/AdminDashboard/MenuManager"));
const Planes = lazy(() => import("./components/AdminDashboard/Planes"));
const Pagos = lazy(() => import("./components/AdminDashboard/Pagos"));
const Soporte = lazy(() => import("./components/AdminDashboard/Soporte"));
const GestionUsuarios = lazy(() => import("./components/AdminDashboard/GestionUsuarios"));
const ConfiguracionGeneral = lazy(() => import("./components/AdminDashboard/ConfiguracionGeneral"));
const Reportes = lazy(() => import("./components/AdminDashboard/Reportes"));
const ManageModules = lazy(() => import("./components/AdminDashboard/ManageModules"));

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-orange-500"></div>
  </div>
);

const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();

if (loading) return <LoadingFallback />;
  if (!user) return <Navigate to="/login" replace />;
  if (pathname.includes("restaurantes") && !user.restaurantId) {
    return <Navigate to="/dashboard/home" replace />;
  }

  return (
    <div className="flex min-h-screen">
      {pathname !== "/" && <Sidebar />}
      <main className="flex-1 p-4 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

const PublicRoute = () => {
  const { loading } = useAuth();
  return loading ? <LoadingFallback /> : <Outlet />;
};

const AppRoutes = () => (
  <ErrorBoundary>
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Rutas públicas */}
        <Route element={<PublicRoute />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/menu/:restaurantId" element={<MenuPreview />} />
        </Route>

        {/* Rutas protegidas */}
        <Route path="/dashboard" element={<ProtectedRoute />}>
          <Route element={<AdminDashboard />}>
            <Route index element={<DashboardHome />} />
            <Route path="home" element={<DashboardHome />} />
            <Route path="account-details" element={<AccountDetails />} />
            <Route path="restaurantes/:restaurantId/menu" element={<MenuManager />} />
            <Route path="planes" element={<Planes />} />
            <Route path="pagos" element={<Pagos />} />
            <Route path="soporte" element={<Soporte />} />
            <Route path="usuarios" element={<GestionUsuarios />} />
            <Route path="configuracion" element={<ConfiguracionGeneral />} />
            <Route path="reportes" element={<Reportes />} />
            <Route path="nuevo-restaurante" element={<NuevoRestaurante />} />
            <Route path="editar-restaurante" element={<EditarRestaurante />} />
            <Route path="suscripciones" element={<AdminSuscripciones />} />
            <Route path="manage-modules" element={<ManageModules />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  </ErrorBoundary>
);

const App = () => (
  <Router>
    <AuthProvider>
      <ThemeProvider>
        <AppRoutes />
      </ThemeProvider>
    </AuthProvider>
  </Router>
);

export default App;



