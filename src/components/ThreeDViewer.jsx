import React, { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// Render loop único para usar en el renderer.setAnimationLoop
const renderLoop = (controlsRef, rendererRef, sceneRef, cameraRef, arSessionRef) => {
  return () => {
    if (!arSessionRef.current && controlsRef.current) {
      controlsRef.current.update();
    }
    rendererRef.current.render(sceneRef.current, cameraRef.current);
  };
};

const ThreeDViewer = forwardRef(({ modelUrl, scale = [1, 1, 1], backgroundColor = "#ffffff", onLoad = () => {}, onError = () => {} }, ref) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const modelRef = useRef(null);
  const arSessionRef = useRef(null);

  // Función para ajustar el modelo al 60% del cuadro
  const adjustModelToFrame = (model, camera, mount) => {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // Calcular el tamaño máximo del modelo (diagonal de la caja delimitadora)
    const maxDim = Math.max(size.x, size.y, size.z);

    // Calcular el campo de visión necesario para que el modelo ocupe el 60% del cuadro
    const fov = camera.fov * (Math.PI / 180);
    const aspect = mount.clientWidth / mount.clientHeight;
    const targetSize = maxDim / 0.6; // Queremos que ocupe el 60% del cuadro
    const distance = targetSize / (2 * Math.tan(fov / 2));

    // Ajustar la posición de la cámara para que el modelo esté centrado y visible
    camera.position.set(center.x, center.y, center.z + distance);
    camera.lookAt(center);

    // Ajustar la escala del modelo si es necesario
    model.scale.set(...scale);

    return { center, distance };
  };

  useEffect(() => {
    console.log("Inicializando Three.js...");
    if (!modelUrl) {
      onError("No se proporcionó URL del modelo");
      return;
    }

    // Creación de la escena (se crea solo una vez)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(backgroundColor);
    sceneRef.current = scene;

    const mount = mountRef.current;
    const camera = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    cameraRef.current = camera;

    let renderer;
    if (!rendererRef.current) {
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        rendererRef.current = renderer;
        renderer.setSize(mount.clientWidth, mount.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.xr.enabled = true;
        renderer.xr.setReferenceSpaceType("local-floor");
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
        scene.add(model);

        // Ajustar el modelo para que ocupe el 60% del cuadro
        const { center, distance } = adjustModelToFrame(model, camera, mount);

        // Configurar OrbitControls con el modelo centrado
        console.log("Inicializando controles de órbita...");
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true; // Movimientos suaves
        controls.dampingFactor = 0.05; // Factor de suavidad
        controls.enableRotate = true;
        controls.enableZoom = true;
        controls.enablePan = false; // Desactivar pan para evitar movimientos fuera del cuadro
        controls.minDistance = distance * 0.5; // Zoom mínimo (50% de la distancia inicial)
        controls.maxDistance = distance * 2; // Zoom máximo (200% de la distancia inicial)
        controls.minPolarAngle = Math.PI / 4; // Limitar rotación vertical (45 grados hacia arriba)
        controls.maxPolarAngle = Math.PI - Math.PI / 4; // Limitar rotación vertical (45 grados hacia abajo)
        controls.target.copy(center); // Centrar los controles en el modelo
        controls.update();
        controlsRef.current = controls;

        console.log("Modelo cargado exitosamente");
        onLoad();
      },
      undefined,
      (error) => onError("No se pudo cargar el modelo: " + error.message)
    );

    // Se establece el render loop unificado
    renderer.setAnimationLoop(renderLoop(controlsRef, rendererRef, sceneRef, cameraRef, arSessionRef));

    // Manejar redimensionamiento de la ventana
    const handleResize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      if (modelRef.current) {
        adjustModelToFrame(modelRef.current, camera, mount);
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      console.log("Liberando recursos...");
      window.removeEventListener("resize", handleResize);
      if (rendererRef.current) {
        rendererRef.current.setAnimationLoop(null);
        rendererRef.current.dispose();
        rendererRef.current.forceContextLoss(); // Liberar contexto WebGL
        rendererRef.current = null;
      }
      if (arSessionRef.current) {
        try {
          arSessionRef.current.end();
        } catch (e) {
          console.warn("Error al finalizar AR durante la liberación de recursos:", e);
        }
        arSessionRef.current = null;
      }
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [modelUrl, scale, backgroundColor, onLoad, onError]);

  useImperativeHandle(ref, () => ({
    startAR: async () => {
      console.log("Verificando soporte para AR...");
      if (!("xr" in navigator)) {
        onError("WebXR no soportado en este dispositivo.");
        return;
      }

      if (arSessionRef.current) {
        console.warn("Una sesión AR ya está activa, finalizándola antes de iniciar una nueva.");
        try {
          await arSessionRef.current.end();
        } catch (e) {
          console.warn("Error al finalizar AR en startAR:", e);
        }
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
          requiredFeatures: ["local-floor"], // Espacio de referencia obligatorio
          optionalFeatures: ["dom-overlay"], // Características opcionales
          domOverlay: { root: document.body }, // Superposición de DOM para la interfaz
        });

        // Solicitar y configurar el ReferenceSpace
        const referenceSpace = await session.requestReferenceSpace("local-floor");
        renderer.xr.setReferenceSpace(referenceSpace);

        // Posicionar el modelo en AR (a 1 metro frente al usuario)
        if (modelRef.current) {
          modelRef.current.position.set(0, 0, -1); // Ajustar la posición inicial en AR
        }

        arSessionRef.current = session;
        renderer.xr.setSession(session);
        console.log("AR iniciado correctamente");

        // Desactivar OrbitControls en modo AR
        if (controlsRef.current) {
          controlsRef.current.enabled = false;
        }
      } catch (err) {
        console.error("Error al iniciar AR: ", err);
        onError(`No se pudo iniciar AR: ${err.message}`);
      }
    },
    endAR: () => {
      console.log("Finalizando AR...");
      if (arSessionRef.current) {
        try {
          arSessionRef.current.end();
        } catch (e) {
          console.warn("Error al finalizar AR (puede que la sesión ya haya terminado):", e);
        }
        arSessionRef.current = null;

        // Reactivar OrbitControls después de finalizar AR
        if (controlsRef.current) {
          controlsRef.current.enabled = true;
        }

        // Restauramos el render loop unificado para el modo no-AR
        if (rendererRef.current) {
          rendererRef.current.setAnimationLoop(renderLoop(controlsRef, rendererRef, sceneRef, cameraRef, arSessionRef));
        }
      }
    },
  }));

  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} />;
});

export default ThreeDViewer;













