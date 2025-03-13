import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const ThreeDViewer = ({ modelUrl, autoRotate, fallback }) => {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!modelUrl) {
      console.warn("[ThreeDViewer] No se proporcionó URL del modelo");
      return;
    }

    const validateModelUrl = async () => {
      try {
        const response = await fetch(modelUrl, { method: "HEAD" });
        if (!response.ok) throw new Error("Modelo no encontrado");
        loadModel();
      } catch (error) {
        console.error("[ThreeDViewer] Error al validar modelo:", error.message);
      }
    };

    const loadModel = () => {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(100, 100);
      mountRef.current.appendChild(renderer.domElement);

      const loader = new GLTFLoader();
      loader.load(
        modelUrl,
        (gltf) => {
          const model = gltf.scene;
          scene.add(model);
          if (autoRotate) {
            const animate = () => {
              requestAnimationFrame(animate);
              model.rotation.y += 0.01;
              renderer.render(scene, camera);
            };
            animate();
          } else {
            renderer.render(scene, camera);
          }
        },
        undefined,
        (error) => {
          console.error("[ThreeDViewer] Error al cargar el modelo:", error.message);
          mountRef.current.innerHTML = "";
          mountRef.current.appendChild(fallback || <div>Modelo no disponible</div>);
        }
      );

      camera.position.z = 5;
    };

    validateModelUrl();

    return () => {
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [modelUrl, autoRotate, fallback]);

  return <div ref={mountRef} />;
};

export default ThreeDViewer;

