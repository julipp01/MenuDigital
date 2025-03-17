import React, { useRef, useImperativeHandle, forwardRef, useEffect } from "react";

const ThreeDViewer = forwardRef(
  (
    {
      modelUrl,
      iosModelUrl,
      scale = [1, 1, 1],
      backgroundColor = "#ffffff",
      onLoad = () => {},
      onError = () => {},
      autoRotate = false,
    },
    ref
  ) => {
    const modelViewerRef = useRef(null);

    useImperativeHandle(ref, () => ({
      startAR: () => {
        if (modelViewerRef.current) {
          try {
            modelViewerRef.current.activateAR();
          } catch (err) {
            onError(`Error al iniciar AR: ${err.message}`);
          }
        }
      },
      endAR: () => {
        console.log("Finalizando AR...");
      },
    }));

    useEffect(() => {
      const viewer = modelViewerRef.current;
      if (viewer) {
        const handleLoad = () => {
          console.log(`Modelo cargado: ${modelUrl}`);
          onLoad();
        };
        const handleError = (error) => {
          console.error(`Error al cargar ${modelUrl}:`, error);
          onError("No se pudo cargar el modelo: " + error.message);
        };

        viewer.addEventListener("load", handleLoad);
        viewer.addEventListener("error", handleError);

        return () => {
          viewer.removeEventListener("load", handleLoad);
          viewer.removeEventListener("error", handleError);
        };
      }
    }, [modelUrl, onLoad, onError]);

    return (
      <model-viewer
        ref={modelViewerRef}
        src={modelUrl}
        ios-src={iosModelUrl || modelUrl.replace(".glb", ".usdz")}
        ar
        ar-modes="webxr scene-viewer quick-look"
        camera-controls
        auto-rotate={autoRotate ? "true" : undefined}
        scale={`${scale[0]} ${scale[1]} ${scale[2]}`}
        style={{ width: "100%", height: "100%", backgroundColor }}
      >
        <button slot="ar-button" style={{ display: "none" }}></button>
      </model-viewer>
    );
  }
);

export default ThreeDViewer;













