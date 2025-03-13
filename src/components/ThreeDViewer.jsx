import React, { Suspense, useRef, useEffect, useMemo, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { useGLTF, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const Model = ({ modelUrl, onError }) => {
  const modelRef = useRef();
  const [scaleFactor, setScaleFactor] = useState(1);

  // Manejo de errores en la carga del modelo
  let scene;
  try {
    const gltf = useGLTF(modelUrl, true);
    scene = gltf.scene;
  } catch (error) {
    console.error("[ThreeDViewer] Error al cargar el modelo:", error.message);
    if (onError) onError(error);
    return null; // Retorna null si hay un error, para que el fallback se encargue
  }

  useEffect(() => {
    if (scene) {
      // 🔹 Obtener tamaño del modelo y ajustarlo al 70% del contenedor
      const box = new THREE.Box3().setFromObject(scene);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const targetSize = 30; // Ajuste manual para que se vea bien
      const computedScale = targetSize / maxDim;
      setScaleFactor(computedScale);

      // 🔹 Centrar el modelo
      const center = box.getCenter(new THREE.Vector3());
      scene.position.set(-center.x, -center.y, -center.z);
    }
  }, [scene]);

  return scene ? (
    <primitive ref={modelRef} object={scene} scale={[scaleFactor, scaleFactor, scaleFactor]} />
  ) : null;
};

const ThreeDViewer = ({ modelUrl, autoRotate = false, fallback = null }) => {
  const rendererRef = useRef();
  const [error, setError] = useState(null);

  // Manejo de errores en la carga del modelo
  const handleModelError = (error) => {
    setError(error);
  };

  // Manejo de webglcontextlost con intento de restauración
  useEffect(() => {
    const handleContextLost = (event) => {
      console.warn("[ThreeDViewer] ⚠️ WebGL Context Lost");
      event.preventDefault(); // Evita el comportamiento por defecto
      // Intenta restaurar el contexto WebGL
      if (rendererRef.current) {
        rendererRef.current.context.getExtension("WEBGL_lose_context")?.restoreContext();
      }
    };

    const handleContextRestored = () => {
      console.info("[ThreeDViewer] ✅ WebGL Context Restored");
    };

    if (rendererRef.current) {
      const canvas = rendererRef.current.domElement;
      canvas.addEventListener("webglcontextlost", handleContextLost);
      canvas.addEventListener("webglcontextrestored", handleContextRestored);
    }

    return () => {
      if (rendererRef.current) {
        const canvas = rendererRef.current.domElement;
        canvas.removeEventListener("webglcontextlost", handleContextLost);
        canvas.removeEventListener("webglcontextrestored", handleContextRestored);
      }
    };
  }, []);

  // Memoizar el modelo para evitar recargas innecesarias
  const memoizedModel = useMemo(() => (
    <Model modelUrl={modelUrl} onError={handleModelError} />
  ), [modelUrl]);

  // Componente para mostrar un spinner de carga
  const LoadingSpinner = () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-xl">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      <span className="ml-2 text-sm text-gray-600">Cargando modelo 3D...</span>
    </div>
  );

  // Si hay un error, muestra el fallback o un mensaje de error por defecto
  if (error) {
    return fallback || (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-xl">
        <span className="text-sm text-red-600">No se pudo cargar el modelo 3D.</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gradient-to-b from-gray-50 to-gray-100 rounded-xl shadow-lg overflow-hidden">
      <Suspense fallback={<LoadingSpinner />}>
        <Canvas
          camera={{ position: [0, 10, 40], fov: 50 }}
          onCreated={({ gl }) => {
            rendererRef.current = gl;
            gl.setClearColor(new THREE.Color("#f3f4f6")); // Fondo claro
          }}
        >
          <ambientLight intensity={2.5} />
          <directionalLight position={[10, 10, 10]} intensity={3} castShadow />
          {memoizedModel}
          <OrbitControls enableDamping enableZoom enableRotate autoRotate={autoRotate} />
        </Canvas>
      </Suspense>
    </div>
  );
};

export default ThreeDViewer;

