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
    console.log("Inicializando Three.js...");
    if (!modelUrl) {
      onError("No se proporcionó URL del modelo");
      return;
    }

    // Configuración de la escena
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(backgroundColor);
    sceneRef.current = scene;

    const mount = mountRef.current;
    const camera = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    camera.position.set(0, 1, 2);
    cameraRef.current = camera;

    let renderer;
    if (!rendererRef.current) {
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        rendererRef.current = renderer;
        renderer.setSize(mount.clientWidth, mount.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.xr.enabled = true;
        mount.appendChild(renderer.domElement);
        console.log("Renderer WebGL inicializado correctamente");
      } catch (e) {
        onError("Error al inicializar WebGL: " + e.message);
        return;
      }
    } else {
      renderer = rendererRef.current;
    }

    // Iluminación
    console.log("Configurando iluminación...");
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Carga del modelo
    console.log("Cargando modelo: ", modelUrl);
    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        if (modelRef.current) scene.remove(modelRef.current);
        const model = gltf.scene;
        modelRef.current = model;
        model.scale.set(...scale);
        model.position.set(0, 0, -1); // Ajustar posición para AR
        scene.add(model);
        console.log("Modelo cargado exitosamente");
        onLoad();
      },
      undefined,
      (error) => onError("No se pudo cargar el modelo: " + error.message)
    );

    // Controles
    console.log("Inicializando controles de órbita...");
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enableRotate = true;
    controls.enableZoom = true;
    controls.enablePan = true;
    controlsRef.current = controls;

    // Animación con soporte para WebXR
    const animate = () => {
      animationFrameId.current = renderer.setAnimationLoop(() => {
        if (!arSessionRef.current) {
          controlsRef.current.update();
        }
        renderer.render(scene, camera);
      });
    };
    animate();

    return () => {
      console.log("Liberando recursos...");
      if (rendererRef.current) {
        rendererRef.current.setAnimationLoop(null);
        rendererRef.current.dispose();
        rendererRef.current.forceContextLoss(); // Liberar contexto WebGL
        rendererRef.current = null;
      }
      cancelAnimationFrame(animationFrameId.current);
      if (arSessionRef.current) arSessionRef.current.end();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [modelUrl, enableAr, scale, backgroundColor, onLoad, onError]);

  useImperativeHandle(ref, () => ({
    startAR: async () => {
      console.log("Verificando soporte para AR...");
      if (!("xr" in navigator)) {
        onError("WebXR no soportado en este dispositivo.");
        return;
      }

      if (arSessionRef.current) {
        console.warn("Una sesión AR ya está activa, finalizándola antes de iniciar una nueva.");
        await arSessionRef.current.end();
        arSessionRef.current = null;
      }

      const isSupported = await navigator.xr.isSessionSupported("immersive-ar");
      console.log("AR es compatible:", isSupported);
      if (!isSupported) {
        onError("AR no es compatible en este dispositivo.");
        return;
      }

      try {
        console.log("Iniciando sesión AR...");
        const renderer = rendererRef.current;
        const session = await navigator.xr.requestSession("immersive-ar", {
          requiredFeatures: ["local-floor"],
          optionalFeatures: ["dom-overlay"],
          domOverlay: { root: document.body },
        });

        const referenceSpace = await session.requestReferenceSpace("local-floor");
        renderer.xr.setReferenceSpace(referenceSpace);

        arSessionRef.current = session;
        renderer.xr.setSession(session);
        session.requestAnimationFrame(() => {
          renderer.render(sceneRef.current, cameraRef.current);
        });
        console.log("AR iniciado correctamente");
      } catch (err) {
        console.error("Error al iniciar AR: ", err);
        onError(`No se pudo iniciar AR: ${err.message}`);
      }
    },
    endAR: () => {
      console.log("Finalizando AR...");
      if (arSessionRef.current) {
        arSessionRef.current.end();
        arSessionRef.current = null;
        rendererRef.current.setAnimationLoop(null);
      }
    },
  }));

  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} />;
});

export default ThreeDViewer;












