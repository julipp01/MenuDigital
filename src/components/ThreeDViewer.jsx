import React, { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const ThreeDViewer = forwardRef(({
  modelUrl,
  enableAr = false,
  scale = [1, 1, 1],
  backgroundColor = "#ffffff",
  onLoad = () => {},
  onError = () => {},
}, ref) => {
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

    // Configuración de la escena
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(backgroundColor);
    sceneRef.current = scene;

    // Configuración de la cámara
    const mount = mountRef.current;
    const camera = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 5);
    cameraRef.current = camera;

    // Configuración del renderizador
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

    // Iluminación
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Carga del modelo
    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        if (modelRef.current) scene.remove(modelRef.current);
        const model = gltf.scene;
        modelRef.current = model;

        model.scale.set(...scale);
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        model.position.sub(center);
        const maxDim = Math.max(size.x, size.y, size.z);
        const autoScale = 3 / maxDim;
        model.scale.multiplyScalar(autoScale);

        model.traverse((child) => {
          if (child.isMesh) {
            child.geometry.computeVertexNormals();
            child.material.side = THREE.DoubleSide;
          }
        });

        scene.add(model);
        onLoad();
      },
      undefined,
      (error) => {
        onError("No se pudo cargar el modelo: " + error.message);
      }
    );

    // Controles para modo no-AR
    const setupControls = () => {
      const controls = new OrbitControls(camera, renderer.domElement);
      controlsRef.current = controls;
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.minDistance = 1;
      controls.maxDistance = 10;
      controls.enabled = !enableAr;
    };
    if (!enableAr) setupControls();

    // Actualizar estado de los controles cuando cambia enableAr
    if (controlsRef.current) {
      controlsRef.current.enabled = !enableAr;
    }

    // Redimensionamiento
    const handleResize = () => {
      const newWidth = mount.clientWidth;
      const newHeight = mount.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener("resize", handleResize);
    handleResize();

    // Animación
    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);
      if (!enableAr && controlsRef.current) controlsRef.current.update();
      renderer.render(scene, camera);
    };
    animate();

    // Gestos táctiles para escalar en AR
    let initialDistance = null;

    const handleTouchStart = (event) => {
      if (enableAr && event.touches.length === 2) {
        const dx = event.touches[0].pageX - event.touches[1].pageX;
        const dy = event.touches[0].pageY - event.touches[1].pageY;
        initialDistance = Math.sqrt(dx * dx + dy * dy);
      }
    };

    const handleTouchMove = (event) => {
      if (enableAr && event.touches.length === 2 && modelRef.current) {
        const dx = event.touches[0].pageX - event.touches[1].pageX;
        const dy = event.touches[0].pageY - event.touches[1].pageY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const scaleFactor = distance / initialDistance;
        modelRef.current.scale.multiplyScalar(scaleFactor);
        initialDistance = distance;
      }
    };

    mount.addEventListener("touchstart", handleTouchStart);
    mount.addEventListener("touchmove", handleTouchMove);

    // Limpieza
    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      if (arSessionRef.current) arSessionRef.current.end();
      if (mount && renderer.domElement) mount.removeChild(renderer.domElement);
      if (modelRef.current) scene.remove(modelRef.current);
      renderer.dispose();
      mount.removeEventListener("touchstart", handleTouchStart);
      mount.removeEventListener("touchmove", handleTouchMove);
    };
  }, [modelUrl, enableAr, scale, backgroundColor, onLoad, onError]);

  // Exponer métodos para iniciar y finalizar AR
  useImperativeHandle(ref, () => ({
    startAR: async () => {
      if (!("xr" in navigator)) {
        onError("WebXR no soportado en este dispositivo.");
        return;
      }

      try {
        const renderer = rendererRef.current;
        renderer.xr.enabled = true;
        renderer.xr.setReferenceSpaceType("local-floor");
        const session = await navigator.xr.requestSession("immersive-ar", {
          requiredFeatures: ["local-floor", "hit-test"],
          optionalFeatures: ["dom-overlay"],
          domOverlay: { root: document.body },
        });
        arSessionRef.current = session;
        renderer.xr.setSession(session);

        // Desactiva controles en AR
        if (controlsRef.current) controlsRef.current.enabled = false;

        // Manejo de fin de sesión
        session.addEventListener("end", () => {
          arSessionRef.current = null;
          renderer.xr.enabled = false;
          if (controlsRef.current) controlsRef.current.enabled = true;
          setTimeout(() => {
            window.scrollTo({ top: mountRef.current.offsetTop - 50, behavior: "smooth" });
          }, 100);
        });

        // Hit-test para colocar el modelo
        const controller = renderer.xr.getController(0);
        mountRef.current.appendChild(controller);

        const placeModel = (event) => {
          const frame = session.getFrame();
          const referenceSpace = renderer.xr.getReferenceSpace();
          const hitTestSource = session.requestHitTestSource({ space: referenceSpace });
          frame.getHitTestResults(hitTestSource).then((results) => {
            if (results.length > 0) {
              const hit = results[0];
              const pose = hit.getPose(referenceSpace);
              if (modelRef.current) {
                modelRef.current.position.setFromMatrixPosition(new THREE.Matrix4().fromArray(pose.transform.matrix));
                modelRef.current.visible = true;
              }
            }
          });
        };

        controller.addEventListener("select", placeModel);
        session.addEventListener("end", () => {
          controller.removeEventListener("select", placeModel);
        });
      } catch (err) {
        onError(`No se pudo iniciar AR: ${err.message}. Asegúrate de que WebXR esté habilitado.`);
      }
    },
    endAR: () => {
      if (arSessionRef.current) {
        arSessionRef.current.end();
      }
    },
  }));

  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} />;
});

export default ThreeDViewer;