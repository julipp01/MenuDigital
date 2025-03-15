import React, { useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import ThreeDViewer from "./ThreeDViewer";

const models = [
  { name: "Platillo 1", url: "/models/example.glb", thumbnail: "/thumbnails/example.jpg", scale: [2, 2, 2], description: "Un delicioso platillo principal con sabores únicos.", price: "S/. 45" },
  { name: "Platillo 2", url: "/models/dish2.glb", thumbnail: "/thumbnails/dish2.jpg", scale: [1.5, 1.5, 1.5], description: "Postre exquisito y único para los amantes del dulce.", price: "S/. 25" },
  { name: "Platillo 3", url: "/models/dish3.glb", thumbnail: "/thumbnails/dish3.jpg", scale: [1, 1, 1], description: "Bebida refrescante con un toque especial.", price: "S/. 15" },
];

const cardVariants = {
  initial: { scale: 0.9, opacity: 0, rotateY: -15 },
  animate: { scale: 1, opacity: 1, rotateY: 0, transition: { duration: 0.6, ease: "easeOut" } },
  hover: { scale: 1.1, rotateY: 5, transition: { duration: 0.3 } },
};

const textVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.2 } },
  hover: { scale: 1.05, transition: { duration: 0.3 } },
};

const VRSection = React.memo(() => {
  const [selectedModel, setSelectedModel] = useState(models[0]);

  const handleSelectModel = useCallback((model) => {
    setSelectedModel(model);
  }, []);

  const renderedCards = useMemo(
    () =>
      models.map((model) => (
        <motion.div
          key={model.url}
          variants={cardVariants}
          initial="initial"
          animate="animate"
          whileHover="hover"
          onClick={() => handleSelectModel(model)}
          className={`relative bg-white rounded-xl overflow-hidden shadow-md cursor-pointer transition-all duration-300 ${
            selectedModel.url === model.url ? "ring-2 ring-orange-500" : "border border-gray-200 hover:shadow-lg hover:ring-1 hover:ring-orange-300"
          } w-40 h-52`}
        >
          {/* Imagen ajustada */}
          <img
            src={model.thumbnail}
            alt={model.name}
            className="w-full h-28 object-cover"
            loading="lazy"
            onError={() => console.error(`Error cargando thumbnail: ${model.thumbnail}`)}
          />
          <div className="p-2 flex flex-col justify-between bg-gradient-to-t from-gray-50 to-transparent">
            <div>
              <motion.h3 variants={textVariants} className="text-sm font-bold text-gray-900 truncate font-poppins hover:text-orange-500 transition-colors duration-300">
                {model.name}
              </motion.h3>
              <motion.p variants={textVariants} className="text-xs text-gray-600 line-clamp-2 font-roboto hover:text-gray-800 transition-colors duration-300">
                {model.description}
              </motion.p>
            </div>
            <motion.span variants={textVariants} className="text-sm font-semibold text-orange-600 font-poppins hover:text-orange-700 transition-colors duration-300">
              {model.price}
            </motion.span>
          </div>
          <motion.div
            className="absolute inset-0 bg-orange-600 bg-opacity-0 hover:bg-opacity-30 transition-opacity duration-300 flex items-center justify-center"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
          >
            <motion.span className="text-white font-bold text-xs font-poppins drop-shadow-md" initial={{ scale: 0.8 }} whileHover={{ scale: 1.1 }}>
              Ver en 3D
            </motion.span>
          </motion.div>
        </motion.div>
      )),
    [handleSelectModel, selectedModel]
  );

  return (
    <section id="3d" className="py-16 bg-gradient-to-br from-amber-50 via-orange-100 to-amber-300 relative overflow-hidden">
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: [
            "radial-gradient(circle at 30% 40%, rgba(255, 147, 0, 0.25) 0%, transparent 60%)",
            "radial-gradient(circle at 70% 60%, rgba(255, 147, 0, 0.25) 0%, transparent 60%)",
          ],
        }}
        transition={{ duration: 6, repeat: Infinity, repeatType: "reverse" }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-between gap-8">
        <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="lg:w-1/2 text-center lg:text-left">
          <motion.h2
            className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight font-poppins drop-shadow-md hover:text-orange-500 transition-colors duration-300"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
          >
            Menú 3D Interactivo
          </motion.h2>
          <motion.p
            className="text-lg text-gray-700 max-w-md mx-auto lg:mx-0 font-roboto font-light mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Explora nuestros platillos en 3D y AR con un diseño moderno y dinámico.
          </motion.p>
          <motion.a
            href="#contacto"
            className="inline-block bg-orange-600 text-white font-semibold py-2 px-6 rounded-full shadow-md font-poppins hover:bg-orange-700 hover:scale-105 hover:shadow-lg transition-all duration-300"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            Explora Más
          </motion.a>
        </motion.div>
        <div className="lg:w-1/2 flex flex-col items-center gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative w-96 h-96 bg-gradient-to-b from-gray-50 to-gray-200 rounded-2xl overflow-hidden shadow-lg ring-1 ring-orange-400 ring-opacity-50"
          >
            <ThreeDViewer
              modelUrl={selectedModel.url}
              width={384}
              height={384}
              scale={selectedModel.scale}
              autoRotate={false}
              backgroundColor="#fefefe"
              ambientLightIntensity={1.5}
              directionalLightIntensity={1.3}
            />
            <motion.div
              className="absolute top-2 left-2 bg-orange-600 text-white px-2 py-1 rounded-full font-poppins text-xs font-semibold shadow-sm"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {selectedModel.name}
            </motion.div>
          </motion.div>
          <div className="flex flex-wrap justify-center gap-4">{renderedCards}</div>
        </div>
      </div>
    </section>
  );
});

export default VRSection;

