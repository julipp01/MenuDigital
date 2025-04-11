import React, { memo, forwardRef, useRef, useImperativeHandle, useEffect, useState } from "react";

const ThreeDViewer = memo(
  forwardRef(
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
        resetModel: () => {
          const viewer = modelViewerRef.current;
          if (viewer) {
            viewer.resetTurntableRotation();
            console.log("[ThreeDViewer] Modelo reiniciado");
          }
        },
        startAR: () => {
          const viewer = modelViewerRef.current;
          if (viewer) {
            viewer.activateAR();
            console.log("[ThreeDViewer] Activando modo AR");
          }
        },
        endAR: () => {
          const viewer = modelViewerRef.current;
          if (viewer) {
            viewer.dismissAR();
            console.log("[ThreeDViewer] Saliendo de modo AR");
          }
        },
      }));

      useEffect(() => {
        const viewer = modelViewerRef.current;
        if (!viewer || !modelUrl) {
          console.warn(`[ThreeDViewer] No se puede renderizar: viewer=${!!viewer}, modelUrl=${modelUrl}`);
          if (!modelUrl) setLoadFailed(true);
          return;
        }

        console.log(`[ThreeDViewer] Iniciando carga de ${modelUrl}`);
        viewer.src = modelUrl;
        if (iosModelUrl) viewer.setAttribute("ios-src", iosModelUrl);

        const handleLoad = () => {
          console.log(`[ThreeDViewer] Modelo cargado exitosamente: ${modelUrl}`);
          setIsLoading(false);
          setProgress(100);
          onLoad();
        };
        const handleError = (event) => {
          console.error(`[ThreeDViewer] Error al cargar ${modelUrl}:`, event);
          setIsLoading(false);
          setLoadFailed(true);
          onError(event);
        };
        const handleProgress = (event) => {
          const progressValue = Math.round(event.detail.totalProgress * 100);
          console.log(`[ThreeDViewer] Progreso de carga para ${modelUrl}: ${progressValue}%`);
          setProgress(progressValue);
        };

        viewer.addEventListener("load", handleLoad);
        viewer.addEventListener("error", handleError);
        viewer.addEventListener("progress", handleProgress);

        return () => {
          console.log(`[ThreeDViewer] Limpiando eventos para ${modelUrl}`);
          viewer.removeEventListener("load", handleLoad);
          viewer.removeEventListener("error", handleError);
          viewer.removeEventListener("progress", handleProgress);
        };
      }, [modelUrl, iosModelUrl, onLoad, onError]);

      if (!modelUrl) return <div className="w-full h-full text-red-600">URL no válida</div>;

      return (
        <div className="relative w-full h-full">
          <model-viewer
            ref={modelViewerRef}
            src={modelUrl}
            ios-src={iosModelUrl}
            ar
            ar-modes="webxr scene-viewer quick-look"
            camera-controls
            auto-rotate={autoRotate ? "true" : undefined}
            scale={`${scale[0]} ${scale[1]} ${scale[2]}`}
            style={{ width: "100%", height: "100%", backgroundColor }}
          >
            <div slot="progress-bar" className="w-full h-2 bg-gray-300">
              <div className="h-full bg-orange-500" style={{ width: `${progress}%` }} />
            </div>
          </model-viewer>
          {isLoading && !loadFailed && (
            <div className="absolute inset-0 flex items-center justify-center">Cargando ({progress}%)</div>
          )}
          {loadFailed && (
            <div className="absolute inset-0 flex items-center justify-center text-red-600">Error al cargar</div>
          )}
        </div>
      );
    }
  ),
  (prevProps, nextProps) => prevProps.modelUrl === nextProps.modelUrl && prevProps.iosModelUrl === nextProps.iosModelUrl
);

ThreeDViewer.displayName = "ThreeDViewer";
export default ThreeDViewer;













