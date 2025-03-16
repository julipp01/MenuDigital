import React, { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import ThreeDViewer from "./ThreeDViewer";

// Lista estática de modelos
const models = [
  {
    name: "Platillo 1",
    url: "/models/example.glb",
    thumbnail: "/thumbnails/example.jpg",
    scale: [1, 1, 1],
    description: "Un delicioso platillo principal con sabores únicos.",
    price: "S/. 45",
  },
  {
    name: "Platillo 2",
    url: "/models/dish2.glb",
    thumbnail: "/thumbnails/dish2.jpg",
    scale: [1, 1, 1],
    description: "Postre exquisito y único para los amantes del dulce.",
    price: "S/. 25",
  },
  {
    name: "Platillo 3",
    url: "/models/dish3.glb",
    thumbnail: "/thumbnails/dish3.jpg",
    scale: [1, 1, 1],
    description: "Bebida refrescante con un toque especial.",
    price: "S/. 15",
  },
];

// Animaciones
const buttonVariants = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  hover: { scale: 1.1, boxShadow: "0 10px 25px rgba(249, 115, 22, 0.3)", transition: { duration: 0.2 } },
  selected: {
    scale: 1.05,
    borderColor: "#f97316",
    boxShadow: "0 0 15px rgba(249, 115, 22, 0.5)",
    transition: { duration: 0.2 },
  },
};

const textVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  hover: { color: "#f97316", scale: 1.02, transition: { duration: 0.2 } },
};

const qrVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  hover: { scale: 1.05, boxShadow: "0 12px 30px rgba(249, 115, 22, 0.25)", transition: { duration: 0.2 } },
};

const viewerVariants = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: "easeOut" } },
};

const VRSection = React.memo(() => {
  const [selectedModel, setSelectedModel] = useState(models[0]);
  const [isArMode, setIsArMode] = useState(false);
  const [isArSupported, setIsArSupported] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verificación de soporte AR
  useEffect(() => {
    const checkArSupport = async () => {
      if ("xr" in navigator) {
        try {
          const supported = await navigator.xr.isSessionSupported("immersive-ar");
          setIsArSupported(supported);
        } catch (err) {
          console.error("Error al verificar soporte AR:", err);
          setIsArSupported(false);
        }
      } else {
        setIsArSupported(false);
      }
      setLoading(false); // Termina la carga inicial
    };
    checkArSupport();
  }, []);

  const handleSelectModel = useCallback((model) => {
    setSelectedModel(model);
    setIsArMode(false);
    setLoading(true);
    setError(null);
  }, []);

  const handleToggleAr = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isArSupported) {
      setIsArMode((prev) => !prev);
    } else {
      alert("AR no soportado. Usa Chrome en Android o Safari en iOS con WebXR habilitado.");
    }
  }, [isArSupported]);

  // Renderizado de thumbnails
  const renderedThumbnails = models.map((model) => (
    <motion.button
      key={model.url}
      variants={buttonVariants}
      initial="initial"
      animate={selectedModel.url === model.url ? "selected" : "animate"}
      whileHover="hover"
      onClick={() => handleSelectModel(model)}
      className="relative bg-white rounded-xl shadow-md overflow-hidden border-2 border-gray-200 w-28 h-32 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all duration-200"
    >
      <img
        src={model.thumbnail}
        alt={`Miniatura de ${model.name}`}
        className="w-full h-20 object-cover rounded-t-xl"
        loading="lazy"
        onError={(e) => (e.target.src = "/thumbnails/placeholder.jpg")}
      />
      <div className="p-2 text-center">
        <p className="text-xs font-semibold text-gray-800 font-['Roboto'] truncate">{model.name}</p>
        <p className="text-xs text-gray-600 font-['Roboto']">{model.price}</p>
      </div>
    </motion.button>
  ));

  return (
    <section id="3d" className="py-16 bg-gray-50 min-h-screen flex items-center justify-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Visor Principal y Thumbnails */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <motion.div
            variants={viewerVariants}
            initial="initial"
            animate="animate"
            className="relative h-[70vh] bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200"
          >
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-600 bg-gray-100/70 z-10">
                <svg className="animate-spin h-10 w-10 text-orange-500" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center text-red-600 bg-gray-100/70 z-10">
                <p className="text-sm font-medium font-['Roboto'] text-center">{error}</p>
              </div>
            )}
            <ThreeDViewer
              modelUrl={selectedModel.url}
              scale={selectedModel.scale}
              enableAr={isArMode && isArSupported}
              backgroundColor="#ffffff"
              onLoad={() => setLoading(false)}
              onError={(err) => {
                setLoading(false);
                setError(err);
              }}
            />
            <div className="absolute top-4 left-4 flex gap-3 z-20">
              <motion.button
                onClick={() => window.dispatchEvent(new CustomEvent("resetView"))}
                className="bg-white text-orange-600 px-4 py-2 rounded-full hover:bg-orange-50 border border-orange-200 font-['Roboto'] text-sm shadow-md transition-all duration-200"
                whileHover={{ scale: 1.05 }}
              >
                Reiniciar
              </motion.button>
              {isArSupported && (
                <motion.button
                  onClick={handleToggleAr}
                  className={`${
                    isArMode ? "bg-red-500 hover:bg-red-600" : "bg-orange-500 hover:bg-orange-600"
                  } text-white px-4 py-2 rounded-full font-['Roboto'] text-sm shadow-md transition-all duration-200`}
                  whileHover={{ scale: 1.05 }}
                >
                  {isArMode ? "Salir de AR" : "Ver en AR"}
                </motion.button>
              )}
            </div>
            <div className="absolute bottom-4 left-4 text-xs text-gray-700 font-['Roboto'] bg-white/90 p-2 rounded-lg shadow-md z-20">
              <p>© Izquierda + arrastrar: Rotar</p>
              <p>© Rueda: Zoom</p>
              <p>© Derecha + arrastrar: Mover</p>
            </div>
          </motion.div>

          {/* Thumbnails Debajo del Visor */}
          <motion.div
            className="flex justify-center gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {renderedThumbnails}
          </motion.div>
        </div>

        {/* Panel Lateral Derecho */}
        <motion.div
          className="lg:col-span-1 flex flex-col gap-8"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center lg:text-left">
            <motion.h2
              className="text-4xl font-extrabold text-gray-900 font-['Roboto'] cursor-pointer"
              variants={textVariants}
              whileHover="hover"
            >
              Explora en 3D y AR
            </motion.h2>
            <motion.p
              className="text-lg text-gray-600 font-['Roboto'] mt-3 cursor-pointer"
              variants={textVariants}
              whileHover="hover"
            >
              Visualiza tus platillos favoritos.
            </motion.p>
          </div>

          <motion.div
            className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200 flex flex-col items-center self-end w-full max-w-sm"
            variants={qrVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
          >
            <motion.p
              className="text-lg font-semibold text-gray-800 font-['Roboto'] mb-4 cursor-pointer text-center"
              variants={textVariants}
              whileHover="hover"
            >
              ¡Escanea para ver la carta en AR!
            </motion.p>
            <img
              src="/qr/qr-carta-digital.png"
              alt="QR para Carta Digital"
              className="w-48 h-48 object-contain rounded-xl shadow-lg"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
});

export default VRSection;