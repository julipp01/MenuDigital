import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { ARButton } from "three/examples/jsm/webxr/ARButton";

const ThreeDViewer = ({
  modelUrl,
  width = 64,
  height = 64,
  scale = [1, 1, 1],
  autoRotate = false,
  backgroundColor = "#f5f5f5",
  ambientLightIntensity = 1.2,
  directionalLightIntensity = 1.0,
  fallback = <div className="text-xs text-gray-500">Modelo no disponible</div>,
}) => {
  const mountRef = useRef(null);
  const controlsRef = useRef(null); // Para mantener referencia a OrbitControls
  const rendererRef = useRef(null); // Para mantener referencia al renderer

  useEffect(() => {
    if (!modelUrl) {
      console.warn("[ThreeDViewer] No se proporcionó modelUrl");
      return;
    }

    console.log("[ThreeDViewer] Iniciando renderizado para:", modelUrl, { width, height });

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    rendererRef.current = renderer; // Guardar referencia
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.xr.enabled = true;
    if (backgroundColor) renderer.setClearColor(backgroundColor, 1);

    const currentMount = mountRef.current;
    if (currentMount) {
      currentMount.innerHTML = ""; // Limpiar contenido previo
      currentMount.appendChild(renderer.domElement);

      // Botón AR
      navigator.xr.isSessionSupported("immersive-ar").then((supported) => {
        if (supported && currentMount) {
          const arButton = ARButton.createButton(renderer, { requiredFeatures: ["hit-test"] });
          arButton.style.position = "absolute";
          arButton.style.bottom = "10px";
          arButton.style.right = "10px";
          currentMount.appendChild(arButton);
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
        const model = gltf.scene;
        model.scale.set(...scale);
        scene.add(model);
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);
        const size = box.getSize(new THREE.Vector3()).length();
        camera.position.z = size * 1.2;
      },
      (progress) => console.log("[ThreeDViewer] Progreso:", (progress.loaded / progress.total) * 100, "%"),
      (error) => {
        console.error("[ThreeDViewer] Error al cargar modelo:", error.message);
        if (currentMount) {
          currentMount.innerHTML = "";
          currentMount.appendChild(fallback);
        }
      }
    );

    // Controles
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.autoRotate = autoRotate;

    // Animación
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Limpieza
    return () => {
      console.log("[ThreeDViewer] Limpiando:", modelUrl);
      cancelAnimationFrame(animationFrameId);
      if (currentMount && renderer.domElement && currentMount.contains(renderer.domElement)) {
        currentMount.removeChild(renderer.domElement);
      }
      controls.dispose();
      renderer.dispose();
      scene.clear();
    };
  }, [modelUrl, width, height, scale, autoRotate, backgroundColor, ambientLightIntensity, directionalLightIntensity, fallback]);

  return <div ref={mountRef} className="relative" style={{ width: `${width}px`, height: `${height}px` }} />;
};

export default ThreeDViewer;

