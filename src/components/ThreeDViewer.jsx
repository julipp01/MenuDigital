import React, { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const ThreeDViewer = forwardRef(({ modelUrl, enableAr = false, scale = [1, 1, 1], backgroundColor = "#ffffff", onLoad = () => {}, onError = () => {}, }, ref) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const modelRef = useRef(null);
  const animationFrameId = useRef(null);
  const arSessionRef = useRef(null);

  useEffect(() => {
    if (!modelUrl) {
      onError("No se proporcionó URL del modelo");
      return;
    }
    
    console.log("Inicializando Three.js...");
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(backgroundColor);
    sceneRef.current = scene;

    const mount = mountRef.current;
    if (!mount) {
      onError("El contenedor del visor 3D no está disponible.");
      return;
    }

    const camera = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 5);
    cameraRef.current = camera;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      rendererRef.current = renderer;
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      mount.appendChild(renderer.domElement);
    } catch (e) {
      onError("Error al inicializar WebGL: " + e.message);
      return;
    }

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    console.log("Cargando modelo: ", modelUrl);
    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        if (modelRef.current) scene.remove(modelRef.current);
        const model = gltf.scene;
        modelRef.current = model;
        model.scale.set(...scale);
        scene.add(model);
        onLoad();
        console.log("Modelo cargado exitosamente");
      },
      undefined,
      (error) => onError("No se pudo cargar el modelo: " + error.message)
    );

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controlsRef.current = controls;
    controls.enabled = !enableAr;

    const handleResize = () => {
      if (renderer && camera) {
        const newWidth = mount.clientWidth;
        const newHeight = mount.clientHeight;
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
      }
    };

    window.addEventListener("resize", handleResize);

    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);
      if (!enableAr && controlsRef.current) controlsRef.current.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId.current);
      if (arSessionRef.current) arSessionRef.current.end();
      mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [modelUrl, enableAr, scale, backgroundColor, onLoad, onError]);

  useImperativeHandle(ref, () => ({
    startAR: async () => {
      console.log("Intentando iniciar AR...");
      if (!("xr" in navigator)) {
        onError("WebXR no soportado en este dispositivo.");
        return;
      }

      try {
        const renderer = rendererRef.current;
        renderer.xr.enabled = true;
        renderer.xr.setReferenceSpaceType("local-floor");

        const session = await navigator.xr.requestSession("immersive-ar", {
          requiredFeatures: ["local-floor"],
          optionalFeatures: ["dom-overlay"],
          domOverlay: { root: document.body },
        });

        arSessionRef.current = session;
        renderer.xr.setSession(session);
        if (controlsRef.current) controlsRef.current.enabled = false;

        console.log("AR iniciado correctamente.");
      } catch (err) {
        onError(`No se pudo iniciar AR: ${err.message}`);
      }
    },
    endAR: () => {
      console.log("Finalizando AR...");
      if (arSessionRef.current) {
        arSessionRef.current.end();
        arSessionRef.current = null;
      }
    },
  }));

  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} />;
});

export default ThreeDViewer;

