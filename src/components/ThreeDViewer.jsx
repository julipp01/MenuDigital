import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { ARButton } from "three/examples/jsm/webxr/ARButton";

const ThreeDViewer = ({
  modelUrl,
  width = 64,
  height = 64,
  scale = [1, 1, 1],
  autoRotate = false, // Desactivamos por defecto para priorizar controles manuales
  backgroundColor = "#f5f5f5",
  ambientLightIntensity = 1.2,
  directionalLightIntensity = 1.0,
  fallback = <div className="text-xs text-gray-500">Modelo no disponible</div>,
}) => {
  const mountRef = useRef(null);
  const [arSupported, setArSupported] = useState(false);

  useEffect(() => {
    if (!modelUrl) {
      console.warn("[ThreeDViewer] No se proporcionó modelUrl");
      return;
    }

    console.log("[ThreeDViewer] Iniciando renderizado para:", modelUrl, { width, height });

    // Escena y renderizador
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.xr.enabled = true; // Habilitar WebXR para AR
    if (backgroundColor) {
      renderer.setClearColor(backgroundColor, 1);
    }

    if (mountRef.current) {
      mountRef.current.innerHTML = "";
      mountRef.current.appendChild(renderer.domElement);

      // Botón AR
      navigator.xr.isSessionSupported("immersive-ar").then((supported) => {
        if (supported) {
          setArSupported(true);
          const arButton = ARButton.createButton(renderer, {
            requiredFeatures: ["hit-test"], // Necesario para AR
          });
          arButton.style.position = "absolute";
          arButton.style.bottom = "10px";
          arButton.style.right = "10px";
          mountRef.current.appendChild(arButton);
        }
      });
    }

    // Iluminación
    const ambientLight = new THREE.AmbientLight(0xffffff, ambientLightIntensity);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, directionalLightIntensity);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    // Cargar modelo
    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        console.log("[ThreeDViewer] Modelo cargado con éxito:", modelUrl);
        const model = gltf.scene;
        model.scale.set(...scale);
        scene.add(model);

        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);
        const size = box.getSize(new THREE.Vector3()).length();
        camera.position.z = size * 1.2;
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

    // Controles interactivos
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Suaviza el movimiento
    controls.dampingFactor = 0.05;
    controls.enableZoom = true; // Permitir zoom
    controls.enablePan = false; // Desactivar desplazamiento lateral
    controls.autoRotate = autoRotate; // Respetar la prop autoRotate
    controls.autoRotateSpeed = 2.0;

    // Animación
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Limpieza
    return () => {
      console.log("[ThreeDViewer] Limpiando renderizado para:", modelUrl);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.clear();
      controls.dispose();
    };
  }, [modelUrl, width, height, scale, autoRotate, backgroundColor, ambientLightIntensity, directionalLightIntensity, fallback]);

  return (
    <div ref={mountRef} style={{ width: `${width}px`, height: `${height}px`, position: "relative" }}>
      {!arSupported && (
        <span className="absolute top-2 left-2 text-xs text-gray-500">AR no soportado en este dispositivo</span>
      )}
    </div>
  );
};

export default ThreeDViewer;

