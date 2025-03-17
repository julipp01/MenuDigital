import React, { useRef, useImperativeHandle, forwardRef, useEffect, useState } from "react";

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
    const [isLoading, setIsLoading] = useState(true);
    const [progress, setProgress] = useState(0);

    useImperativeHandle(ref, () => ({
      startAR: () => {
        if (modelViewerRef.current) {
          try {
            console.log("Intentando iniciar AR...");
            modelViewerRef.current.activateAR();
          } catch (err) {
            onError(`Error al iniciar AR: ${err.message}`);
          }
        } else {
          onError("El componente model-viewer no está inicializado.");
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
          console.log(`Modelo cargado: ${modelUrl} (iOS: ${iosModelUrl})`);
          setIsLoading(false);
          setProgress(100);
          onLoad();
        };
        const handleError = (error) => {
          console.error(`Error al cargar ${modelUrl} (iOS: ${iosModelUrl}):`, error);
          setIsLoading(false);
          onError("No se pudo cargar el modelo. Por favor, intenta de nuevo.");
        };
        const handleProgress = (event) => {
          const progressValue = Math.round(event.detail.totalProgress * 100);
          setProgress(progressValue);
          console.log(`Progreso de carga: ${progressValue}%`);
        };
        const handleArStatus = (event) => {
          console.log("Estado de AR:", event.detail.status);
        };

        viewer.addEventListener("load", handleLoad);
        viewer.addEventListener("error", handleError);
        viewer.addEventListener("progress", handleProgress);
        viewer.addEventListener("ar-status", handleArStatus);

        // Reiniciar estado al cambiar modelo
        setIsLoading(true);
        setProgress(0);

        return () => {
          viewer.removeEventListener("load", handleLoad);
          viewer.removeEventListener("error", handleError);
          viewer.removeEventListener("progress", handleProgress);
          viewer.removeEventListener("ar-status", handleArStatus);
        };
      }
    }, [modelUrl, iosModelUrl, onLoad, onError]);

    return (
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        <model-viewer
          ref={modelViewerRef}
          src={modelUrl}
          ios-src={iosModelUrl || modelUrl.replace(".glb", ".usdz")}
          ar
          ar-modes="webxr scene-viewer quick-look"
          camera-controls
          auto-rotate={autoRotate ? "true" : undefined}
          scale={`${scale[0]} ${scale[1]} ${scale[2]}`}
          style={{ width: "100%", height: "100%", backgroundColor, "--ar-button": "none" }}
        >
          <button
            slot="ar-button"
            className="absolute bottom-4 right-4 bg-orange-500 text-white px-4 py-2 rounded-full font-['Roboto'] text-sm shadow-md hover:bg-orange-600 transition-all duration-200"
            onClick={() => modelViewerRef.current?.activateAR()}
          >
            Ver en AR
          </button>
        </model-viewer>

        {/* Indicador de progreso innovador */}
        {isLoading && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100/70 z-10 transition-opacity duration-300"
            style={{ opacity: progress === 100 ? 0 : 1 }}
          >
            <div className="relative w-20 h-20">
              <svg className="w-full h-full" viewBox="0 0 36 36">
                <path
                  className="text-gray-300"
                  fill="none"
                  strokeWidth="3"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-orange-500 transition-all duration-500 ease-out"
                  fill="none"
                  strokeWidth="3"
                  strokeDasharray={`${progress}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-orange-500 font-['Roboto'] text-sm font-semibold">
                {progress}%
              </span>
            </div>
            <p className="mt-2 text-gray-700 font-['Roboto'] text-sm">Cargando modelo 3D...</p>
          </div>
        )}
      </div>
    );
  }
);

export default ThreeDViewer;













