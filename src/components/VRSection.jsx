import React, { useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import ThreeDViewer from "./ThreeDViewer";

const models = [
  { name: "Platillo 1", url: "/models/example.glb", thumbnail: "/thumbnails/example.jpg", scale: [2, 2, 2] },
  { name: "Platillo 2", url: "/models/dish2.glb", thumbnail: "/thumbnails/dish2.jpg", scale: [1.5, 1.5, 1.5] },
  { name: "Platillo 3", url: "/models/dish3.glb", thumbnail: "/thumbnails/dish3.jpg", scale: [1, 1, 1] },
];

const VRSection = () => {
  const [selectedModel, setSelectedModel] = useState(models[0]);

  const handleSelectModel = useCallback((model) => {
    if (selectedModel.url !== model.url) {
      console.log("Seleccionando modelo:", model.url);
      setSelectedModel(model);
    }
  }, [selectedModel]);

  const renderedModels = useMemo(
    () =>
      models.map((model) => (
        <motion.button
          key={model.url}
          onClick={() => handleSelectModel(model)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          title={model.name}
          className={`border-2 rounded-lg overflow-hidden transition-all shadow-md ${
            selectedModel.url === model.url ? "border-orange-600" : "border-gray-300 hover:border-orange-400"
          }`}
          style={{ width: "90px", height: "90px" }}
        >
          <img
            src={model.thumbnail}
            alt={model.name}
            className="w-full h-full object-cover rounded-lg"
            loading="lazy"
            onError={() => console.error(`Error cargando thumbnail: ${model.thumbnail}`)}
          />
        </motion.button>
      )),
    [selectedModel, handleSelectModel]
  );

  // Tamaño del visor: 80% de la altura del contenedor (500px)
  const viewerHeight = 500 * 0.8; // 400px
  const viewerWidth = viewerHeight;

  return (
    <section id="3d" className="py-20 bg-gradient-to-b from-amber-100 to-amber-200">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-12">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="md:w-1/2"
        >
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight drop-shadow-md">
            Experiencia 3D / VR
          </h2>
          <p className="text-lg text-gray-700 mb-8">
            Explora tu menú en 3D y AR. Gira, amplía y visualiza tus platillos en realidad aumentada desde cualquier dispositivo.
          </p>
          <motion.a
            whileHover={{ scale: 1.05, backgroundColor: "#D4AF37" }}
            whileTap={{ scale: 0.95 }}
            href="#contacto"
            className="inline-block bg-orange-600 text-white font-semibold py-3 px-8 rounded-full shadow-lg transition duration-300"
          >
            Más Información
          </motion.a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="md:w-1/2 h-[500px] flex items-center justify-center"
        >
          <div className="relative w-full max-w-[450px] h-full bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-orange-300 transform hover:scale-105 transition-transform duration-300">
            <ThreeDViewer
              modelUrl={selectedModel.url}
              width={viewerWidth} // 400px
              height={viewerHeight} // 400px
              scale={selectedModel.scale}
              autoRotate={false} // Controles manuales en lugar de rotación automática
              backgroundColor="#fefefe"
              ambientLightIntensity={1.4} // Más luz para destacar
              directionalLightIntensity={1.2}
            />
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-4 bg-white/80 backdrop-blur-sm p-2 rounded-lg shadow-md">
              {renderedModels}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default VRSection;


