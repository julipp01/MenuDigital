import React, { useState, useCallback, useEffect, useRef, memo } from "react";
import { motion } from "framer-motion";
import ThreeDViewer from "./ThreeDViewer";
import { MdRefresh, MdViewInAr } from "react-icons/md";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation } from "swiper/modules";

const models = [
  { name: "Platillo 1", url: "/models/example.glb", iosUrl: "/models/example.usdz", thumbnail: "/thumbnails/example.jpg", scale: [1, 1, 1] },
  { name: "Platillo 2", url: "/models/dish2.glb", iosUrl: "/models/dish2.usdz", thumbnail: "/thumbnails/dish2.jpg", scale: [1, 1, 1] },
  { name: "Platillo 3", url: "/models/dish3.glb", iosUrl: "/models/dish3.usdz", thumbnail: "/thumbnails/dish3.jpg", scale: [1, 1, 1] },
];

const defaultModel = { name: "Modelo por Defecto", url: "/models/default.glb", iosUrl: "/models/default.usdz", thumbnail: "/thumbnails/default.jpg", scale: [1, 1, 1] };

const buttonVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  hover: { scale: 1.05, boxShadow: "0 10px 20px rgba(249, 115, 22, 0.3)" },
  selected: { scale: 1.05, borderColor: "#f97316", borderWidth: "2px", boxShadow: "0 0 15px rgba(249, 115, 22, 0.4)", transition: { type: "spring", stiffness: 300 } },
};

const titleVariants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.6, type: "spring", stiffness: 100 } },
  hover: { scale: 1.05, color: "#f97316", transition: { duration: 0.3 } },
};

const textVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.2 } },
  hover: { opacity: 0.9 },
};

const qrContainerVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.6, type: "spring", stiffness: 100 } },
  hover: { boxShadow: "0 15px 30px rgba(0, 0, 0, 0.15)", borderColor: "#fed7aa", backgroundColor: "#fff7ed" },
};

const VRSection = memo(() => {
  const [selectedModel, setSelectedModel] = useState(models[0] || defaultModel);
  const [isArMode, setIsArMode] = useState(false);
  const [isArSupported, setIsArSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const viewerRef = useRef(null);

  useEffect(() => {
    const checkArSupport = async () => {
      try {
        const supported = "xr" in navigator && (await navigator.xr.isSessionSupported("immersive-ar"));
        setIsArSupported(supported);
      } catch (err) {
        console.error("Error al verificar soporte AR:", err);
        setIsArSupported(false);
      }
    };
    checkArSupport();
  }, []);

  const handleSelectModel = useCallback((model) => {
    setIsLoading(true);
    setSelectedModel(model || defaultModel);
    setIsArMode(false);
    if (viewerRef.current) viewerRef.current.resetModel();
  }, []);

  const handleToggleAr = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!viewerRef.current) return;

    if (isArSupported) {
      if (!isArMode) {
        viewerRef.current.startAR();
        setIsArMode(true);
      } else {
        viewerRef.current.endAR();
        setIsArMode(false);
      }
    } else {
      alert("AR no soportado. Usa Chrome en Android o Safari en iOS.");
    }
  }, [isArSupported, isArMode]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  return (
    <section id="3dvr" className="py-8 sm:py-12 lg:py-16 bg-gray-50 text-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* Visor y Carrusel */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            {/* Visor 3D */}
            <motion.div
              className="relative h-[35vh] sm:h-[45vh] lg:h-[50vh] bg-gray-100 rounded-3xl shadow-2xl overflow-hidden border border-gray-200"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              <ThreeDViewer
                key={selectedModel.url}
                ref={viewerRef}
                modelUrl={selectedModel.url}
                iosModelUrl={selectedModel.iosUrl}
                scale={selectedModel.scale}
                backgroundColor="#f3f4f6"
                autoRotate={true}
                onLoad={handleLoad}
                onError={(err) => console.error("Error en VRSection:", err)}
              />
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200/50">
                  <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <div className="absolute top-4 right-4 flex gap-3 z-20">
                <motion.button
                  onClick={() => handleSelectModel(selectedModel)}
                  className="bg-white text-orange-600 px-4 py-2 rounded-full border border-orange-200 shadow-md hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 flex items-center gap-2"
                  whileHover={{ scale: 1.1 }}
                >
                  <MdRefresh className="text-xl" />
                  Reiniciar
                </motion.button>
                {isArSupported && (
                  <motion.button
                    onClick={handleToggleAr}
                    className={`${
                      isArMode ? "bg-red-600 hover:bg-red-700" : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                    } text-white px-4 py-2 rounded-full shadow-md flex items-center gap-2`}
                    whileHover={{ scale: 1.1 }}
                  >
                    <MdViewInAr className="text-xl" />
                    {isArMode ? "Salir AR" : "Ver en AR"}
                  </motion.button>
                )}
              </div>
            </motion.div>

            {/* Carrusel de miniaturas */}
            <div className="py-2">
              <Swiper
                modules={[Navigation]}
                navigation={{
                  nextEl: ".swiper-button-next",
                  prevEl: ".swiper-button-prev",
                }}
                spaceBetween={10}
                slidesPerView={1}
                breakpoints={{
                  640: { slidesPerView: 2 },
                  1024: { slidesPerView: 4 },
                }}
                className="w-full max-w-full px-2"
              >
                {models.map((model) => (
                  <SwiperSlide key={model.url}>
                    <motion.button
                      variants={buttonVariants}
                      initial="initial"
                      animate={selectedModel.url === model.url ? "selected" : "animate"}
                      whileHover="hover"
                      onClick={() => handleSelectModel(model)}
                      className="bg-white rounded-lg shadow-md border border-gray-200 p-2 hover:bg-gradient-to-br hover:from-orange-50 hover:to-orange-100 transition-all w-full max-w-[140px] mx-auto"
                    >
                      <div className="w-full h-20 overflow-hidden rounded-md">
                        <img src={model.thumbnail} alt={model.name} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                      <div className="text-left mt-2">
                        <p className="text-sm font-semibold text-gray-800 truncate" style={{ fontFamily: "'Poppins', sans-serif" }}>
                          {model.name}
                        </p>
                      </div>
                    </motion.button>
                  </SwiperSlide>
                ))}
                <div className="swiper-button-prev text-orange-500"></div>
                <div className="swiper-button-next text-orange-500"></div>
              </Swiper>
            </div>
          </div>

          {/* QR */}
          <motion.div
            className="lg:col-span-1 h-full bg-white p-4 sm:p-6 lg:p-8 rounded-3xl shadow-2xl border border-gray-200 flex flex-col justify-between items-center gap-4"
            variants={qrContainerVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col items-center gap-4">
              <motion.h2
                className="text-2xl sm:text-3xl lg:text-4xl font-bold text-orange-600"
                style={{ fontFamily: "'Poppins', sans-serif", textShadow: "0 2px 4px rgba(0, 0, 0, 0.1)" }}
                variants={titleVariants}
                initial="initial"
                animate="animate"
                whileHover="hover"
              >
                Mira en vivo una carta 3D
              </motion.h2>
              <motion.p
                className="text-sm sm:text-base lg:text-lg text-gray-700 text-center leading-relaxed"
                variants={textVariants}
                initial="initial"
                animate="animate"
                whileHover="hover"
              >
                Escanea el código QR para ver la experiencia 3D.
              </motion.p>
            </div>
            <div className="relative group">
              <img
                src="/qr/qr-carta-digital.png"
                alt="QR Carta"
                className="w-40 h-40 sm:w-48 h-48 lg:w-56 h-56 object-contain rounded-2xl shadow-xl transition-transform group-hover:scale-110 group-hover:border-2 group-hover:border-orange-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-orange-500/30 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
});

export default VRSection;