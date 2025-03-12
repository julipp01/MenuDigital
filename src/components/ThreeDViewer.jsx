import React, { Suspense, useRef, useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const Model = ({ modelUrl }) => {
  const modelRef = useRef();
  const { scene } = useGLTF(modelUrl, true);
  const [scaleFactor, setScaleFactor] = useState(1);

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

  return <primitive ref={modelRef} object={scene} scale={[scaleFactor, scaleFactor, scaleFactor]} />;
};

const ThreeDViewer = ({ modelUrl }) => {
  const rendererRef = useRef();

  useEffect(() => {
    const handleContextLost = () => {
      console.warn("⚠️ WebGL Context Lost, recargando...");
      setTimeout(() => window.location.reload(), 500);
    };

    if (rendererRef.current) {
      rendererRef.current.domElement.addEventListener("webglcontextlost", handleContextLost);
    }

    return () => {
      if (rendererRef.current) {
        rendererRef.current.domElement.removeEventListener("webglcontextlost", handleContextLost);
      }
    };
  }, []);

  const memoizedModel = useMemo(() => <Model modelUrl={modelUrl} />, [modelUrl]);

  return (
    <div className="w-full h-full bg-gradient-to-b from-gray-50 to-gray-100 rounded-xl shadow-lg overflow-hidden">
      <Suspense fallback={<div className="w-full h-full flex items-center justify-center">Cargando...</div>}>
        <Canvas
          camera={{ position: [0, 10, 40], fov: 50 }}
          onCreated={({ gl }) => (rendererRef.current = gl)}
        >
          <ambientLight intensity={2.5} />
          <directionalLight position={[10, 10, 10]} intensity={3} castShadow />
          {memoizedModel}
          <OrbitControls enableDamping enableZoom enableRotate />
        </Canvas>
      </Suspense>
    </div>
  );
};

export default ThreeDViewer;

