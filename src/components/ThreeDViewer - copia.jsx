import React, { Suspense, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const Model = ({ modelUrl, autoRotate = true }) => {
  const modelRef = useRef();
  if (!modelUrl) return null;

  const { scene } = useGLTF(modelUrl, true);

  useEffect(() => {
    if (scene && modelRef.current) {
      const box = new THREE.Box3().setFromObject(scene);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);

      // Escala adaptativa: mínimo 10, máximo 50, ajustado según tamaño
      const scaleFactor = Math.min(Math.max(20 / maxDim, 10), 50);
      scene.scale.set(scaleFactor, scaleFactor, scaleFactor);

      // Centrado preciso
      const center = box.getCenter(new THREE.Vector3());
      scene.position.set(-center.x * scaleFactor, -center.y * scaleFactor, -center.z * scaleFactor);
      modelRef.current.position.set(0, 0, 0);

      console.log(`📏 Modelo: Escala=${scaleFactor}, Tamaño=${maxDim}, Centro=(${center.x}, ${center.y}, ${center.z})`);
    }
  }, [scene]);

  useFrame(() => {
    if (modelRef.current && autoRotate) {
      modelRef.current.rotation.y += 0.002;
    }
  });

  return <primitive ref={modelRef} object={scene} />;
};

const ThreeDViewer = ({ modelUrl, autoRotate = true }) => {
  const controlsRef = useRef();

  if (!modelUrl) {
    return (
      <div className="w-full h-80 flex items-center justify-center text-gray-500 bg-gray-100 rounded-lg shadow-inner">
        URL no válida
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gradient-to-b from-gray-50 to-gray-100 rounded-xl shadow-lg overflow-hidden border border-gray-200">
      <Suspense
        fallback={
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-gray-600"></div>
          </div>
        }
      >
        <Canvas
          camera={{ position: [0, 20, 50], fov: 45, near: 0.1, far: 1000 }} // Cámara más alejada
          style={{ width: '100%', height: '100%' }}
          onCreated={({ gl }) => {
            gl.setClearColor('#f9fafb');
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.2;
          }}
        >
          <ambientLight intensity={1.8} />
          <directionalLight position={[10, 15, 10]} intensity={2.5} castShadow />
          <directionalLight position={[-10, -10, -5]} intensity={1} />
          <Model modelUrl={modelUrl} autoRotate={autoRotate} />
          <OrbitControls
            ref={controlsRef}
            enablePan={false}
            enableZoom={true}
            enableRotate={true}
            minDistance={20} // Aumentado para modelos pequeños
            maxDistance={80} // Aumentado para modelos grandes
            target={[0, 0, 0]}
            enableDamping={true}
            dampingFactor={0.08}
            rotateSpeed={0.4}
            zoomSpeed={0.6}
          />
        </Canvas>
      </Suspense>
    </div>
  );
};

export default ThreeDViewer;