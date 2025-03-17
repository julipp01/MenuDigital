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
    const [loadFailed, setLoadFailed] = useState(false);
    const [arError, setArError] = useState(false);
    const timeoutRef = useRef(null); // Para manejar el timeout

    useImperativeHandle(ref, () => ({
      startAR: () => {
        if (modelViewerRef.current) {
          try {
            console.log("Iniciando AR...");
            modelViewerRef.current.activateAR();
            setArError(false);
          } catch (err) {
            console.error("Error al activar AR:", err);
            setArError(true);
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
          console.log(`Modelo cargado: ${modelUrl} (iOS: ${iosModelUrl})`);
          clearTimeout(timeoutRef.current); // Cancelar el timeout
          setIsLoading(false);
          setProgress(100);
          setLoadFailed(false);
          onLoad();
        };
        const handleError = (event) => {
          console.error(`Error al cargar modelo: ${modelUrl}`, event.detail);
          clearTimeout(timeoutRef.current); // Cancelar el timeout
          setIsLoading(false);
          setLoadFailed(true);
          onError("No se pudo cargar el modelo. Revisa la conexión o intenta otro modelo.");
        };
        const handleProgress = (event) => {
          const progressValue = Math.round(event.detail.totalProgress * 100);
          setProgress(progressValue);
          console.log(`Progreso: ${progressValue}%`);
        };
        const handleArStatus = (event) => {
          console.log("Estado de AR:", event.detail.status);
          if (event.detail.status === "failed") {
            setArError(true);
            onError("No se pudo iniciar AR. Verifica la compatibilidad del dispositivo.");
          }
        };

        viewer.addEventListener("load", handleLoad);
        viewer.addEventListener("error", handleError);
        viewer.addEventListener("progress", handleProgress);
        viewer.addEventListener("ar-status", handleArStatus);

        // Fallback solo si no hay progreso inicial
        timeoutRef.current = setTimeout(() => {
          if (progress === 0) {
            setIsLoading(false);
            setLoadFailed(true);
            onError("Tiempo de carga excedido. Verifica tu conexión.");
          }
        }, 15000);

        // Reiniciar estados
        setIsLoading(true);
        setProgress(0);
        setLoadFailed(false);
        setArError(false);

        return () => {
          viewer.removeEventListener("load", handleLoad);
          viewer.removeEventListener("error", handleError);
          viewer.removeEventListener("progress", handleProgress);
          viewer.removeEventListener("ar-status", handleArStatus);
          clearTimeout(timeoutRef.current);
        };
      }
    }, [modelUrl, iosModelUrl, onLoad, onError]);

    return (
      <div className="relative w-full h-full">
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
          <button
            slot="ar-button"
            className="custom-ar-button absolute bottom-4 right-4 bg-orange-500 text-white px-4 py-2 rounded-full font-roboto text-sm shadow-md hover:bg-orange-600 transition-all duration-200"
            onClick={() => modelViewerRef.current?.activateAR()}
          >
            Ver en AR
          </button>
        </model-viewer>

        {isLoading && !loadFailed && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 z-10 transition-opacity duration-500">
            <div className="w-3/4 max-w-xs">
              <div className="relative h-2 bg-gray-300 rounded-full overflow-hidden">
                <div
                  className="absolute h-full bg-orange-500 transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-center text-gray-700 font-roboto text-sm">
                Cargando modelo ({progress}%)
              </p>
            </div>
          </div>
        )}

        {loadFailed && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 z-10">
            <div className="text-center text-red-600 font-roboto">
              <p className="text-sm font-medium">Error al cargar el modelo</p>
              <p className="text-xs mt-1">Revisa tu conexión o intenta otro modelo.</p>
            </div>
          </div>
        )}

        {arError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 z-10">
            <div className="text-center text-red-600 font-roboto">
              <p className="text-sm font-medium">Error al iniciar AR</p>
              <p className="text-xs mt-1">Verifica la compatibilidad de tu dispositivo.</p>
            </div>
          </div>
        )}
      </div>
    );
  }
);

export default ThreeDViewer;













