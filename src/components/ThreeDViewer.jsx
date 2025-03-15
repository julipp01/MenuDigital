import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

const ThreeDViewer = ({
  modelUrl,
  width = 64, // Tamaño por defecto para MenuEditor
  height = 64,
  scale = [1, 1, 1], // Escala por defecto
  autoRotate = true,
  backgroundColor = null, // Fondo transparente por defecto
  ambientLightIntensity = 1.0, // Luz ambiental más intensa por defecto
  directionalLightIntensity = 0.8, // Luz direccional ajustada
  fallback = <div className="text-xs text-gray-500">Modelo no disponible</div>,
}) => {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!modelUrl) {
      console.warn("[ThreeDViewer] No se proporcionó modelUrl");
      return;
    }

    console.log("[ThreeDViewer] Iniciando renderizado para:", modelUrl, { width, height });
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); // Antialiasing para bordes suaves
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio); // Mejora la nitidez en pantallas retina
    if (backgroundColor) {
      renderer.setClearColor(backgroundColor, 1);
    }

    if (mountRef.current) {
      mountRef.current.innerHTML = ""; // Limpiar antes de montar
      mountRef.current.appendChild(renderer.domElement);
    }

    // Iluminación optimizada
    const ambientLight = new THREE.AmbientLight(0xffffff, ambientLightIntensity);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, directionalLightIntensity);
    directionalLight.position.set(1, 1, 1).normalize(); // Luz desde una dirección más natural
    scene.add(directionalLight);

    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        console.log("[ThreeDViewer] Modelo cargado con éxito:", modelUrl);
        const model = gltf.scene;
        model.scale.set(...scale); // Aplicar escala personalizada
        scene.add(model);

        // Centrar el modelo
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);

        // Ajustar la cámara al tamaño del modelo
        const size = box.getSize(new THREE.Vector3()).length();
        camera.position.z = size * 1.2; // Acercar un poco más la cámara
      },
      (progress) => {
        console.log("[ThreeDViewer] Progreso de carga:", (progress.loaded / progress.total) * 100, "%");
      },
      (error) => {
        console.error("[ThreeDViewer] Error al cargar modelo:", error.message);
        if (mountRef.current) {
          mountRef.current.innerHTML = "";
          mountRef.current.appendChild(fallback);
        }
      }
    );

    const animate = () => {
      requestAnimationFrame(animate);
      if (autoRotate) {
        scene.rotation.y += 0.01;
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      console.log("[ThreeDViewer] Limpiando renderizado para:", modelUrl);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.clear();
    };
  }, [modelUrl, width, height, scale, autoRotate, backgroundColor, ambientLightIntensity, directionalLightIntensity, fallback]);

  return <div ref={mountRef} style={{ width: `${width}px`, height: `${height}px` }} />;
};

export default ThreeDViewer;

