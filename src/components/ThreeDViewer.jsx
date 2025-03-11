import React, { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const Model = ({ modelUrl, autoRotate = true, inAR = false }) => {
  const modelRef = useRef();
  if (!modelUrl) return null;

  const { scene } = useGLTF(modelUrl, true);

  useEffect(() => {
    if (scene && modelRef.current) {
      const box = new THREE.Box3().setFromObject(scene);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scaleFactor = 1; // Modelos normalizados en Blender
      scene.scale.set(scaleFactor, scaleFactor, scaleFactor);
      const center = box.getCenter(new THREE.Vector3());
      scene.position.set(-center.x, -center.y, -center.z);
      modelRef.current.position.set(0, 0, 0);
    }
  }, [scene]);

  useFrame(() => {
    if (modelRef.current && autoRotate && !inAR) {
      modelRef.current.rotation.y += 0.002;
    }
  });

  return <primitive ref={modelRef} object={scene} />;
};

const ThreeDViewer = ({ modelUrl, autoRotate = true }) => {
  const controlsRef = useRef();
  const rendererRef = useRef();
  const [isARSupported, setIsARSupported] = useState(null); // null = cargando, true/false = resultado
  const [isARActive, setIsARActive] = useState(false);
  const [arError, setArError] = useState(null);

  // Verificar soporte WebXR
  useEffect(() => {
    if (!navigator.xr) {
      setIsARSupported(false);
      return;
    }
    navigator.xr.isSessionSupported('immersive-ar')
      .then((supported) => setIsARSupported(supported))
      .catch((err) => {
        setIsARSupported(false);
        setArError('Error al verificar AR: ' + err.message);
      });
  }, []);

  // Iniciar sesión AR
  const startAR = async () => {
    if (!isARSupported || !rendererRef.current) return;
    try {
      const session = await navigator.xr.requestSession('immersive-ar', {
        optionalFeatures: ['hit-test', 'dom-overlay'],
      });
      rendererRef.current.xr.enabled = true;
      rendererRef.current.xr.setSession(session);
      setIsARActive(true);
    } catch (err) {
      setArError('No se pudo iniciar AR: ' + err.message);
      setIsARActive(false);
    }
  };

  if (!modelUrl) {
    return (
      <div className="w-full h-80 flex items-center justify-center text-gray-500 bg-gray-100 rounded-lg shadow-inner">
        URL no válida
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gradient-to-b from-gray-50 to-gray-100 rounded-xl shadow-lg overflow-hidden border border-gray-200 relative">
      <Suspense
        fallback={
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-gray-600"></div>
          </div>
        }
      >
        <Canvas
          camera={{ position: [0, 20, 50], fov: 45, near: 0.1, far: 1000 }}
          style={{ width: '100%', height: '100%' }}
          onCreated={({ gl }) => {
            rendererRef.current = gl;
            gl.setClearColor('#f9fafb');
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.2;
            gl.xr.enabled = false;
          }}
        >
          {isARActive ? (
            <ambientLight intensity={1} />
          ) : (
            <>
              <ambientLight intensity={1.8} />
              <directionalLight position={[10, 15, 10]} intensity={2.5} castShadow />
              <directionalLight position={[-10, -10, -5]} intensity={1} />
            </>
          )}
          <Model modelUrl={modelUrl} autoRotate={autoRotate} inAR={isARActive} />
          {!isARActive && (
            <OrbitControls
              ref={controlsRef}
              enablePan={false}
              enableZoom={true}
              enableRotate={true}
              minDistance={20}
              maxDistance={80}
              target={[0, 0, 0]}
              enableDamping={true}
              dampingFactor={0.08}
              rotateSpeed={0.4}
              zoomSpeed={0.6}
            />
          )}
        </Canvas>
      </Suspense>

      {/* Información de depuración */}
      <div className="absolute top-4 left-4 text-sm text-gray-700">
        {isARSupported === null && <p>Verificando AR...</p>}
        {isARSupported === true && !isARActive && <p>AR soportado</p>}
        {isARSupported === false && (
          <p className="text-red-600">
            AR no soportado. Consulta nuestra{' '}
            <a href="/compatibilidad" className="underline">guía de compatibilidad</a>.
          </p>
        )}
        {arError && <p className="text-red-600">{arError}</p>}
      </div>

      {/* Botón AR */}
      {isARSupported === true && !isARActive && (
        <button
          onClick={startAR}
          className="absolute top-4 right-4 bg-orange-600 text-white font-semibold py-2 px-4 rounded-full shadow-lg hover:bg-orange-700 transition duration-300 flex items-center gap-2"
          title="Explora este platillo en realidad aumentada"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7v10l10 5 10-5V7l-10-5zm0 2.5l7.5 3.75v7.5L12 19.5l-7.5-3.75v-7.5L12 4.5z" />
          </svg>
          Ver en AR
        </button>
      )}

      {/* Controles de visualización */}
      {!isARActive && (
        <div className="absolute bottom-4 right-4 flex gap-2">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className="bg-gray-200 p-2 rounded-full hover:bg-gray-300"
          >
            {autoRotate ? 'Pausar' : 'Rotar'}
          </button>
          <button
            onClick={() => controlsRef.current?.reset()}
            className="bg-gray-200 p-2 rounded-full hover:bg-gray-300"
          >
            Resetear
          </button>
        </div>
      )}
    </div>
  );
};

export default ThreeDViewer;