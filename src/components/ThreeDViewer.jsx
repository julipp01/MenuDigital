import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

const ThreeDViewer = ({ modelUrl, autoRotate = true, fallback }) => {
  const mountRef = useRef(null);

  useEffect(() => {
    console.log("[ThreeDViewer] Iniciando renderizado para:", modelUrl);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(64, 64); // Tamaño pequeño para vista previa
    if (mountRef.current) {
      mountRef.current.innerHTML = ""; // Limpiar antes de montar
      mountRef.current.appendChild(renderer.domElement);
    }

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(0, 1, 1);
    scene.add(directionalLight);

    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        console.log("[ThreeDViewer] Modelo cargado con éxito:", modelUrl);
        const model = gltf.scene;
        scene.add(model);
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center); // Centrar el modelo
        const size = box.getSize(new THREE.Vector3()).length();
        camera.position.z = size * 1.5;
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
    };
  }, [modelUrl, autoRotate, fallback]);

  return <div ref={mountRef} className="w-16 h-16" />;
};

export default ThreeDViewer;

