import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useModulesConfig } from "../../hooks/useModulesConfig";
import {
  FiLoader, FiUser, FiMail, FiShield, FiDollarSign, FiCalendar, FiClock, FiCheckCircle, FiHome,
  FiBookOpen, FiLayers, FiHeadphones, FiGrid, FiUser as MaleIcon, FiUserCheck as FemaleIcon
} from "react-icons/fi";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useMemo, useState } from "react";

// Configuración de íconos
const iconMap = { FiHome, FiBookOpen, FiLayers, FiDollarSign, FiHeadphones, FiGrid };
const avatarsMap = { male: MaleIcon, female: FemaleIcon, other: FiUser };

// Componente reutilizable para tarjetas de información
const InfoCard = ({ icon: Icon, label, value, color = "gray-800" }) => (
  <motion.div
    className="flex items-center gap-3 p-2 rounded-md transition-colors hover:bg-[#333333] hover:text-white"
    whileHover={{ scale: 1.02 }}
  >
    <Icon className="text-gray-500 text-lg" />
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-${color} font-medium`}>{value || "N/A"}</p>
    </div>
  </motion.div>
);

// Componente Modal para Editar Perfil
const EditProfileModal = ({ isOpen, onClose, user, onSave }) => {
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");

  const handleSave = () => {
    console.log("Guardando cambios - Nombre anterior:", user?.name, "Nuevo nombre:", name);
    console.log("Correo anterior:", user?.email, "Nuevo correo:", email);
    onSave({ name, email });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isOpen ? 1 : 0 }}
      className={`fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center ${isOpen ? "block" : "hidden"}`}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300 }}
        className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <FiUser className="text-blue-500" /> Editar Perfil
        </h2>
        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium text-gray-600">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                console.log("Cambiando nombre a:", e.target.value);
                setName(e.target.value);
              }}
              className="w-full p-3 mt-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="Ingresa tu nombre"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Correo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                console.log("Cambiando correo a:", e.target.value);
                setEmail(e.target.value);
              }}
              className="w-full p-3 mt-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="Ingresa tu correo"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Guardar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const DashboardHome = () => {
  const { user: authUser, loading: authLoading } = useAuth();
  const [user, setUser] = useState(authUser);
  const rango = user?.role?.toLowerCase() || "free";
  const { modules, loading: modulesLoading, error: modulesError } = useModulesConfig(rango);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const planDaysLeft = useMemo(() => {
    if (!user?.planEnd) return "N/A";
    const endDate = new Date(user.planEnd);
    const today = new Date();
    return Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
  }, [user?.planEnd]);

  const isFemale = user?.gender === "female";

  const getModulePath = (module) => {
    if (!module.path) return null;

    // Normalizar la ruta eliminando barras duplicadas y prefijos no deseados
    let basePath = module.path
      .replace(/^\/+|\/+$/g, '') // Eliminar barras al inicio/final
      .replace(/^dashboard\//, '') // Eliminar prefijo dashboard/ si existe
      .replace(/^admin\//, '') // Eliminar prefijo admin/ si existe
      .replace('dashboard-home', 'home'); // Normalizar nombre

    // Caso especial para el módulo de menús
    if (basePath === 'menus' && user?.restaurantId) {
      return `/dashboard/restaurantes/${user.restaurantId}/menu`;
    }

    // Manejar rutas con parámetros dinámicos
    if (basePath.includes(':restaurantId') && user?.restaurantId) {
      return `/dashboard/${basePath.replace(':restaurantId', user.restaurantId)}`;
    }

    // Construir la ruta final con prefijo /dashboard/
    return `/dashboard/${basePath}`;
  };

  const handleSaveProfile = ({ name, email }) => {
    console.log("Intentando actualizar perfil localmente...");
    setUser((prevUser) => ({
      ...prevUser,
      name,
      email,
    }));
    console.log("Perfil actualizado localmente - Nuevo usuario:", { name, email });
  };

  if (authLoading || modulesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <FiLoader className="animate-spin text-blue-600 text-4xl" />
        <span className="ml-3 text-gray-600 text-lg">Cargando dashboard...</span>
      </div>
    );
  }

  if (!user) return <div className="p-6 bg-yellow-50 text-yellow-700 rounded-lg shadow-md max-w-md mx-auto mt-10">Por favor, inicia sesión.</div>;
  if (modulesError) return <div className="p-6 bg-red-50 text-red-700 rounded-lg shadow-md max-w-md mx-auto mt-10">Error: {modulesError}</div>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-100 p-6 md:p-8"
    >
      {/* Encabezado */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-lg p-6 mb-6 flex items-center gap-4"
      >
        {(() => {
          const AvatarIcon = avatarsMap[user?.gender || "other"];
          return (
            <motion.div
              className="relative w-16 h-16 rounded-full border-2 border-blue-500 bg-gray-50 flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
            >
              <AvatarIcon className="w-10 h-10 text-blue-500" />
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
            </motion.div>
          );
        })()}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            ¡Bienvenid{isFemale ? "a" : "o"}, <span className="text-blue-600">{user.name || "Usuario"}</span>!
          </h1>
          <p className="text-sm text-gray-500 mt-1">Explora tus herramientas.</p>
        </div>
      </motion.div>

      {/* Contenedor Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Detalles de la Cuenta */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
              <FiUser className="text-blue-500" /> Detalles de tu cuenta
            </h2>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-[#222222] text-white rounded-lg hover:bg-[#333333] transition-colors text-sm font-medium"
            >
              Editar Perfil
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <InfoCard icon={FiUser} label="Nombre" value={user.name} />
              <InfoCard icon={FiMail} label="Correo" value={user.email} />
              <InfoCard icon={FiShield} label="Rol" value={user.role?.toLowerCase()} color="f7f7f7" />
              <InfoCard icon={FiDollarSign} label="Plan" value={user.plan} color="f7f7f7" />
            </div>
            <div className="space-y-4">
              <InfoCard icon={FiCalendar} label="Inicio del Plan" value={user.planStart ? format(new Date(user.planStart), "dd MMM yyyy") : "N/A"} />
              <InfoCard icon={FiCalendar} label="Fin del Plan" value={user.planEnd ? format(new Date(user.planEnd), "dd MMM yyyy") : "N/A"} />
              <InfoCard
                icon={FiCheckCircle}
                label="Estado"
                value={user.subscriptionStatus}
                color={user.subscriptionStatus === "active" ? "green-600" : "red-600"}
              />
              <InfoCard icon={FiClock} label="Días Restantes" value={planDaysLeft} />
            </div>
          </div>
        </motion.div>

        {/* Datos del Restaurante */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2 mb-6">
            <FiHome className="text-blue-500" /> Datos del Restaurante
          </h2>
          <div className="space-y-4">
            <InfoCard 
              icon={FiHome} 
              label="Nombre" 
              value={user.restaurantName || "Sin restaurante"} 
              color="#f7f7f7" 
            />
            {user.restaurantCreatedAt && (
              <InfoCard
                icon={FiCalendar}
                label="Creado el"
                value={format(new Date(user.restaurantCreatedAt), "dd MMM yyyy")}
                color="#f7f7f7"
              />
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-3 bg-white rounded-xl shadow-lg p-6"
        >
          <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2 mb-6">
            <FiGrid className="text-blue-500" /> Módulos Activados
          </h2>
          {modules.length === 0 ? (
            <p className="text-gray-500 italic">No hay módulos disponibles.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules.map((module) => {
                const Icon = iconMap[module.icon] || FiGrid;
                const fullPath = getModulePath(module);
                if (!fullPath) return null;
                return (
                  <Link
                    key={module.id}
                    to={fullPath}
                    className="relative group bg-gradient-to-br from-[#f7f7f7] to-gray-100 p-5 rounded-xl shadow-md hover:shadow-xl hover:from-[#222222] hover:to-[#333333] transition-all duration-300 flex items-center gap-4"
                  >
                    <motion.span
                      className="text-3xl text-blue-500 group-hover:text-white"
                      whileHover={{ scale: 1.2, rotate: 10 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <Icon />
                    </motion.span>
                    <div className="flex-1">
                      <p className="text-lg font-semibold text-gray-800 group-hover:text-white transition-colors">
                        {module.module_name}
                      </p>
                      <p className="text-sm text-gray-600 group-hover:text-gray-200 opacity-80">
                        {module.description || "Accede aquí"}
                      </p>
                    </div>
                    {/* Tooltip */}
                    <motion.div
                      className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                      initial={{ y: 10 }}
                      animate={{ y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      {module.description || "Haz clic para explorar"}
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Modal */}
      <EditProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={user}
        onSave={handleSaveProfile}
      />
    </motion.div>
  );
};

export default DashboardHome;












