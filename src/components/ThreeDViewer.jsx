import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { ARButton } from "three/examples/jsm/webxr/ARButton";

const ThreeDViewer = ({
  modelUrl,
  width = 64,
  height = 64,
  scale = [1, 1, 1], // Escala base para modo normal
  autoRotate = false,
  backgroundColor = "#f5f5f5",
  ambientLightIntensity = 1.5,
  directionalLightIntensity = 1.3,
  fallback = <div className="text-xs text-gray-500">Modelo no disponible</div>,
}) => {
  const mountRef = useRef(null);
  const controlsRef = useRef(null);
  const rendererRef = useRef(null);
  const modelRef = useRef(null);
  const [isARActive, setIsARActive] = useState(false);

  useEffect(() => {
    if (!modelUrl) {
      console.warn("[ThreeDViewer] No se proporcionó modelUrl");
      return;
    }

    console.log("[ThreeDViewer] Iniciando renderizado para:", modelUrl, { width, height });

    // Configuración básica
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.xr.enabled = true;

    // Fondo
    renderer.setClearColor(backgroundColor, isARActive ? 0 : 1);

    const currentMount = mountRef.current;
    if (currentMount) {
      currentMount.innerHTML = "";
      currentMount.appendChild(renderer.domElement);
    }

    // Iluminación
    const ambientLight = new THREE.AmbientLight(0xffffff, ambientLightIntensity);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, directionalLightIntensity);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // Cargar modelo
    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        console.log("[ThreeDViewer] Modelo cargado:", modelUrl);
        modelRef.current = gltf.scene;

        // Escala inicial para modo normal
        modelRef.current.scale.set(...scale);
        modelRef.current.visible = true;
        scene.add(modelRef.current);

        // Centrar modelo en modo normal
        const box = new THREE.Box3().setFromObject(modelRef.current);
        const center = box.getCenter(new THREE.Vector3());
        modelRef.current.position.sub(center);
        const size = box.getSize(new THREE.Vector3()).length();
        camera.position.z = size * 1.5;
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

    // Controles para modo no-AR
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.autoRotate = autoRotate;

    // Configuración AR
    let hitTestSource = null;
    let hitTestSourceRequested = false;
    let reticle = null;

    const initializeAR = () => {
      setIsARActive(true);
      controls.enabled = false;
      renderer.setClearColor(0x000000, 0); // Fondo transparente en AR

      // Retícula
      reticle = new THREE.Mesh(
        new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      reticle.matrixAutoUpdate = false;
      reticle.visible = false;
      scene.add(reticle);

      // Ajustar escala para AR (más pequeña)
      if (modelRef.current) {
        modelRef.current.scale.set(0.05, 0.05, 0.05); // Escala muy pequeña para AR
        console.log("[ThreeDViewer] Escala ajustada para AR:", modelRef.current.scale);
      }
    };

    if (currentMount) {
      navigator.xr.isSessionSupported("immersive-ar").then((supported) => {
        if (supported) {
          const arButton = ARButton.createButton(renderer, {
            requiredFeatures: ["hit-test"],
            onSessionReady: () => {
              initializeAR();
            },
          });
          arButton.style.position = "absolute";
          arButton.style.bottom = "10px";
          arButton.style.right = "10px";
          currentMount.appendChild(arButton);
        } else {
          console.warn("[ThreeDViewer] AR no soportado en este dispositivo");
        }
      });
    }

    // Animación y renderizado
    let animationFrameId;
    const animate = (time, xrFrame) => {
      animationFrameId = requestAnimationFrame(animate);

      if (isARActive && renderer.xr.isPresenting) {
        const session = renderer.xr.getSession();
        const referenceSpace = renderer.xr.getReferenceSpace();

        if (!hitTestSourceRequested) {
          session.requestReferenceSpace("viewer").then((viewerSpace) => {
            session.requestHitTestSource({ space: viewerSpace }).then((source) => {
              hitTestSource = source;
              hitTestSourceRequested = true;
              console.log("[ThreeDViewer] Hit-test source inicializado");
            });
          });
        }

        if (hitTestSource && xrFrame && modelRef.current) {
          const hitTestResults = xrFrame.getHitTestResults(hitTestSource);
          if (hitTestResults.length > 0) {
            const hit = hitTestResults[0];
            const pose = hit.getPose(referenceSpace);
            reticle.visible = true;
            reticle.matrix.fromArray(pose.transform.matrix);

            // Posicionar modelo
            const position = new THREE.Vector3();
            position.setFromMatrixPosition(reticle.matrix);
            modelRef.current.position.copy(position);
            modelRef.current.position.z -= 0.5; // Distancia inicial razonable
            modelRef.current.visible = true;
            console.log("[ThreeDViewer] Modelo posicionado en AR:", modelRef.current.position);
          } else {
            reticle.visible = false;
            modelRef.current.visible = false;
          }
        }
      } else if (!isARActive) {
        controls.update();
      }

      renderer.render(scene, camera);
    };
    renderer.setAnimationLoop(animate);

    // Limpieza
    return () => {
      console.log("[ThreeDViewer] Limpiando:", modelUrl);
      renderer.setAnimationLoop(null);
      if (currentMount && renderer.domElement && currentMount.contains(renderer.domElement)) {
        currentMount.removeChild(renderer.domElement);
      }
      if (controlsRef.current) controlsRef.current.dispose();
      if (rendererRef.current) rendererRef.current.dispose();
      scene.clear();
      if (hitTestSource) hitTestSource.cancel();
      hitTestSourceRequested = false;
    };
  }, [modelUrl, width, height, scale, autoRotate, backgroundColor, ambientLightIntensity, directionalLightIntensity, fallback]);

  return <div ref={mountRef} className="relative" style={{ width: `${width}px`, height: `${height}px` }} />;
};

export default ThreeDViewer;

