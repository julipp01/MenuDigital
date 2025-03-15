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
  autoRotate = false,
  backgroundColor = "#f5f5f5",
  ambientLightIntensity = 1.5,
  directionalLightIntensity = 1.3,
  fallback = <div className="text-xs text-gray-500">Modelo no disponible</div>,
}) => {
  const mountRef = useRef(null);
  const controlsRef = useRef(null);
  const rendererRef = useRef(null);
  const [isARActive, setIsARActive] = useState(false); // Estado para modo AR

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

    // Fondo por defecto (no transparente en AR)
    if (backgroundColor && !isARActive) {
      renderer.setClearColor(backgroundColor, 1);
    } else if (isARActive) {
      renderer.setClearColor(0x000000, 0); // Fondo transparente en AR
    }

    const currentMount = mountRef.current;
    if (currentMount) {
      currentMount.innerHTML = "";
      currentMount.appendChild(renderer.domElement);
    }

    // Iluminación mejorada para AR
    const ambientLight = new THREE.AmbientLight(0xffffff, ambientLightIntensity);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, directionalLightIntensity);
    directionalLight.position.set(5, 10, 7.5).normalize();
    scene.add(directionalLight);

    // Cargar modelo
    let model;
    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        model = gltf.scene;
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

    const setupAR = (controller) => {
      renderer.xr.addEventListener("sessionstart", () => {
        setIsARActive(true);
        controls.enabled = false; // Desactivar OrbitControls en AR
        renderer.setClearColor(0x000000, 0); // Fondo transparente en AR

        // Retícula para indicar dónde colocar el modelo
        reticle = new THREE.Mesh(
          new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
          new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        reticle.matrixAutoUpdate = false;
        reticle.visible = false;
        scene.add(reticle);
      });

      renderer.xr.addEventListener("sessionend", () => {
        setIsARActive(false);
        controls.enabled = true;
        renderer.setClearColor(backgroundColor, 1);
        if (reticle) {
          scene.remove(reticle);
          reticle = null;
        }
      });
    };

    if (currentMount) {
      navigator.xr.isSessionSupported("immersive-ar").then((supported) => {
        if (supported) {
          const arButton = ARButton.createButton(renderer, {
            requiredFeatures: ["hit-test"],
            onSessionReady: setupAR,
          });
          arButton.style.position = "absolute";
          arButton.style.bottom = "10px";
          arButton.style.right = "10px";
          currentMount.appendChild(arButton);
        }
      });
    }

    // Animación
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (isARActive && renderer.xr.isPresenting) {
        const session = renderer.xr.getSession();
        const viewerReferenceSpace = renderer.xr.getReferenceSpace();
        const frame = session.requestAnimationFrame();

        if (frame && hitTestSourceRequested === false) {
          session.requestReferenceSpace("viewer").then((referenceSpace) => {
            session.requestHitTestSource({ space: referenceSpace }).then((source) => {
              hitTestSource = source;
            });
          });
          hitTestSourceRequested = true;
        }

        if (hitTestSource) {
          const hitTestResults = frame.getHitTestResults(hitTestSource);
          if (hitTestResults.length > 0 && model) {
            const hit = hitTestResults[0];
            const pose = hit.getPose(viewerReferenceSpace);
            reticle.visible = true;
            reticle.matrix.fromArray(pose.transform.matrix);
            model.position.setFromMatrixPosition(reticle.matrix);
            model.visible = true;
          } else if (reticle) {
            reticle.visible = false;
          }
        }
      } else if (!isARActive) {
        controls.update();
      }

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
      if (controlsRef.current) controlsRef.current.dispose();
      if (rendererRef.current) rendererRef.current.dispose();
      scene.clear();
      if (hitTestSource) hitTestSource.cancel();
      hitTestSourceRequested = false;
    };
  }, [modelUrl, width, height, scale, autoRotate, backgroundColor, ambientLightIntensity, directionalLightIntensity, fallback, isARActive]);

  return <div ref={mountRef} className="relative" style={{ width: `${width}px`, height: `${height}px` }} />;
};

export default ThreeDViewer;

