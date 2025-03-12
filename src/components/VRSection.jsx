import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import ThreeDViewer from './ThreeDViewer';

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

  const renderedModels = useMemo(() => (
    models.map((model) => (
      <motion.button
        key={model.url}
        onClick={() => handleSelectModel(model)}
        whileHover={{ scale: 1.1 }}
        title={model.name}
        className={`border-2 rounded-lg overflow-hidden transition ${
          selectedModel.url === model.url ? 'border-orange-600' : 'border-gray-300'
        }`}
        style={{ width: "100px", height: "100px" }} // 🔹 Ajustar tamaño del botón
      >
        <img
          src={model.thumbnail}
          alt={model.name}
          className="w-full h-full object-cover rounded-lg" // 🔹 Imagen ocupa todo sin deformarse
          loading="lazy"
          onError={() => console.error(`Error cargando thumbnail: ${model.thumbnail}`)}
        />
      </motion.button>
    ))
  ), [selectedModel]);

  return (
    <section id="3d" className="py-20 bg-amber-100">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-12">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="md:w-1/2"
        >
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
            Experiencia 3D / VR
          </h2>
          <p className="text-lg text-gray-700 mb-8">
            Visualiza tu menú en 3D y VR, permitiendo a tus clientes explorar tus platillos de manera interactiva.
          </p>
          <motion.a
            whileHover={{ scale: 1.05, backgroundColor: '#D4AF37', color: '#fff' }}
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
          className="md:w-1/2 h-[500px]"
        >
          <div className="relative h-full bg-white rounded-xl shadow-xl overflow-hidden border border-orange-200">
            <ThreeDViewer
              modelUrl={selectedModel.url}
              scale={selectedModel.scale}
              autoRotate={true}
            />
            {/* 🔹 Thumbnails debajo del visor */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
              {renderedModels}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default VRSection;


