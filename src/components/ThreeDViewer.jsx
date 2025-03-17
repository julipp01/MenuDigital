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

    useImperativeHandle(ref, () => ({
      startAR: () => {
        if (modelViewerRef.current) {
          try {
            console.log("Iniciando AR...");
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
          console.log(`Modelo cargado exitosamente: ${modelUrl} (iOS: ${iosModelUrl})`);
          setIsLoading(false);
          setProgress(100);
          setLoadFailed(false);
          onLoad();
        };
        const handleError = (error) => {
          console.error(`Error al cargar ${modelUrl} (iOS: ${iosModelUrl}):`, error);
          setIsLoading(false);
          setLoadFailed(true);
          onError("No se pudo cargar el modelo. Revisa tu conexión o intenta de nuevo.");
        };
        const handleProgress = (event) => {
          const progressValue = Math.round(event.detail.totalProgress * 100);
          setProgress(progressValue);
          console.log(`Progreso de carga: ${progressValue}%`);
          if (progressValue === 100) {
            setIsLoading(false); // Asegurar que isLoading se desactive al 100%
          }
        };
        const handleArStatus = (event) => {
          console.log("Estado de AR:", event.detail.status);
        };

        viewer.addEventListener("load", handleLoad);
        viewer.addEventListener("error", handleError);
        viewer.addEventListener("progress", handleProgress);
        viewer.addEventListener("ar-status", handleArStatus);

        // Fallback: Si no carga en 15 segundos, asumir fallo
        const fallbackTimeout = setTimeout(() => {
          if (progress < 100) {
            setIsLoading(false);
            setLoadFailed(true);
            onError("Tiempo de carga excedido. Verifica el modelo o tu conexión.");
          }
        }, 15000);

        // Reiniciar estado al cambiar modelo
        setIsLoading(true);
        setProgress(0);
        setLoadFailed(false);

        return () => {
          viewer.removeEventListener("load", handleLoad);
          viewer.removeEventListener("error", handleError);
          viewer.removeEventListener("progress", handleProgress);
          viewer.removeEventListener("ar-status", handleArStatus);
          clearTimeout(fallbackTimeout);
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
            className="absolute bottom-4 right-4 bg-orange-500 text-white px-4 py-2 rounded-full font-roboto text-sm shadow-md hover:bg-orange-600 transition-all duration-200"
          >
            Ver en AR
          </button>
        </model-viewer>

        {/* Indicador de progreso */}
        {isLoading && !loadFailed && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100/80 z-10 transition-opacity duration-500">
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

        {/* Mensaje de error si falla */}
        {loadFailed && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 z-10">
            <div className="text-center text-red-600 font-roboto">
              <p className="text-sm font-medium">Error al cargar el modelo</p>
              <p className="text-xs mt-1">Revisa tu conexión o intenta otro modelo.</p>
            </div>
          </div>
        )}
      </div>
    );
  }
);

export default ThreeDViewer;













