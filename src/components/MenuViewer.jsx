import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const ThreeDViewer = ({
  modelUrl,
  enableAr = false,
  scale = [1, 1, 1],
  backgroundColor = "#f3f4f6",
  onLoad = () => {},
  onError = () => {},
}) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const modelRef = useRef(null);
  const currentModelUrl = useRef(modelUrl); // Para evitar recargas innecesarias

  useEffect(() => {
    if (!modelUrl || modelUrl === currentModelUrl.current) return; // Evita recarga si el modelo no cambió
    currentModelUrl.current = modelUrl;

    const mount = mountRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(backgroundColor);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mount.appendChild(renderer.domElement);

    // Iluminación
    scene.add(new THREE.AmbientLight(0xffffff, 1.5));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Carga del modelo
    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        if (modelRef.current) scene.remove(modelRef.current); // Limpia modelo anterior
        const model = gltf.scene;
        modelRef.current = model;
        model.scale.set(...scale);

        // Centrado optimizado
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        model.position.sub(center);
        const maxDim = Math.max(size.x, size.y, size.z);
        const autoScale = 2.5 / maxDim;
        model.scale.multiplyScalar(autoScale);

        scene.add(model);
        onLoad();
      },
      undefined,
      (error) => {
        console.error("[ThreeDViewer] Error:", error.message);
        onError(error.message);
      }
    );

    let controls;
    if (!enableAr) {
      controls = new OrbitControls(camera, renderer.domElement);
      controlsRef.current = controls;
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.minDistance = 1;
      controls.maxDistance = 10;
    }

    // Soporte AR
    if (enableAr && "xr" in navigator) {
      renderer.xr.enabled = true;
      const startAR = async () => {
        try {
          const session = await navigator.xr.requestSession("immersive-ar", {
            optionalFeatures: ["hit-test", "dom-overlay"],
            domOverlay: { root: document.body },
          });
          renderer.xr.setSession(session);
        } catch (err) {
          console.error("Error iniciando AR:", err);
          onError("No se pudo iniciar AR");
        }
      };
      startAR();
    }

    const handleResize = () => {
      const newWidth = mount.clientWidth;
      const newHeight = mount.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener("resize", handleResize);

    const animate = () => {
      requestAnimationFrame(animate);
      if (!enableAr && controls) controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (mount && renderer.domElement) mount.removeChild(renderer.domElement);
      if (modelRef.current) scene.remove(modelRef.current);
      renderer.dispose();
    };
  }, [modelUrl, enableAr, scale, backgroundColor, onLoad, onError]);

  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} />;
};

export default ThreeDViewer;













