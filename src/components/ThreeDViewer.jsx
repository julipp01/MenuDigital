import React, { useRef, useEffect, useState, Suspense } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { ARButton } from "three/examples/jsm/webxr/ARButton";

const ThreeDViewer = React.memo(({
  modelUrl,
  width = 64,
  height = 64,
  scale = [1, 1, 1],
  autoRotate = false,
  backgroundColor = "#f5f5f5",
  ambientLightIntensity = 1.5,
  directionalLightIntensity = 1.3,
  fallback = <div className="text-xs text-gray-500">Cargando modelo...</div>,
}) => {
  const mountRef = useRef(null);
  const controlsRef = useRef(null);
  const rendererRef = useRef(null);
  const modelRef = useRef(null);
  const [isARActive, setIsARActive] = useState(false);

  useEffect(() => {
    if (!modelUrl) return;

    // Configuración básica
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.xr.enabled = true;
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
        modelRef.current = gltf.scene;
        modelRef.current.scale.set(...scale); // Escala para modo normal
        modelRef.current.visible = true;
        scene.add(modelRef.current);

        const box = new THREE.Box3().setFromObject(modelRef.current);
        const center = box.getCenter(new THREE.Vector3());
        modelRef.current.position.sub(center);
        const size = box.getSize(new THREE.Vector3()).length();
        camera.position.z = size * 1.5;
      },
      undefined,
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
      renderer.setClearColor(0x000000, 0);

      reticle = new THREE.Mesh(
        new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      reticle.matrixAutoUpdate = false;
      reticle.visible = false;
      scene.add(reticle);

      if (modelRef.current) {
        modelRef.current.scale.set(0.01, 0.01, 0.01); // Escala pequeña para AR
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
        }
      });
    }

    // Animación optimizada
    let lastFrameTime = 0;
    const animate = (time) => {
      const delta = time - lastFrameTime;
      if (delta < 16) { // Limitar a ~60 FPS
        requestAnimationFrame(animate);
        return;
      }
      lastFrameTime = time;

      if (isARActive && renderer.xr.isPresenting) {
        const session = renderer.xr.getSession();
        const referenceSpace = renderer.xr.getReferenceSpace();
        const frame = session.requestAnimationFrame();

        if (!hitTestSourceRequested) {
          session.requestReferenceSpace("viewer").then((viewerSpace) => {
            session.requestHitTestSource({ space: viewerSpace }).then((source) => {
              hitTestSource = source;
              hitTestSourceRequested = true;
            });
          });
        }

        if (hitTestSource && frame && modelRef.current) {
          const hitTestResults = frame.getHitTestResults(hitTestSource);
          if (hitTestResults.length > 0) {
            const hit = hitTestResults[0];
            const pose = hit.getPose(referenceSpace);
            reticle.visible = true;
            reticle.matrix.fromArray(pose.transform.matrix);

            const position = new THREE.Vector3();
            position.setFromMatrixPosition(reticle.matrix);
            modelRef.current.position.copy(position);
            modelRef.current.position.z -= 0.3;
            modelRef.current.visible = true;
          } else {
            reticle.visible = false;
            modelRef.current.visible = false;
          }
        }
      } else if (!isARActive && controlsRef.current) {
        controlsRef.current.update();
      }

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);

    // Limpieza
    return () => {
      if (currentMount && renderer.domElement && currentMount.contains(renderer.domElement)) {
        currentMount.removeChild(renderer.domElement);
      }
      if (controlsRef.current) controlsRef.current.dispose();
      if (rendererRef.current) rendererRef.current.dispose();
      scene.clear();
      if (hitTestSource) hitTestSource.cancel();
      hitTestSourceRequested = false;
    };
  }, [modelUrl, width, height, scale, autoRotate, backgroundColor, ambientLightIntensity, directionalLightIntensity]);

  return (
    <Suspense fallback={fallback}>
      <div ref={mountRef} className="relative" style={{ width: `${width}px`, height: `${height}px` }} />
    </Suspense>
  );
});

export default ThreeDViewer;

