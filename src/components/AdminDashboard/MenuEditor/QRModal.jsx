import React, { useRef, useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { toPng } from "html-to-image";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { FaCopy, FaDownload, FaTimes } from "react-icons/fa";
import { useParams } from "react-router-dom";

const LOCAL_IP = import.meta.env.VITE_LOCAL_IP || '192.168.18.22';

const QRModal = ({ show, onClose, restaurantId: propRestaurantId, restaurantData }) => {
  const { restaurantId: paramsRestaurantId } = useParams();
  const qrRef = useRef(null);
  const [qrUrl, setQrUrl] = useState("");
  const finalRestaurantId = propRestaurantId || paramsRestaurantId;

  const primaryColor = restaurantData?.colors?.primary || "#FF9800";
  const secondaryColor = restaurantData?.colors?.secondary || "#4CAF50";
  const restaurantName = restaurantData?.name || "Menú QR";
  const logoUrl = restaurantData?.logo_url || "/placeholder-image.png";
  const fontFamily = restaurantData?.fontFamily || "Roboto";
  const nameFont = restaurantData?.nameFont || fontFamily;

  useEffect(() => {
    const generateQrUrl = () => {
      if (!finalRestaurantId) {
        console.error("restaurantId no está definido en QRModal:", finalRestaurantId);
        setQrUrl("");
        toast.error("No se puede generar el QR: ID del restaurante no disponible");
        return;
      }

      const isLocal = window.location.hostname === 'localhost' || window.location.hostname.includes('192.168');
      const baseUrl = isLocal ? `http://${LOCAL_IP}:5173` : window.location.origin;
      const url = `${baseUrl}/menu/${finalRestaurantId}`;
      setQrUrl(url);
      console.log("URL del QR generada:", url);
    };
    generateQrUrl();
  }, [finalRestaurantId]);

  const handleDownloadQR = async () => {
    if (!qrRef.current) return;
    try {
      const dataUrl = await toPng(qrRef.current);
      const link = document.createElement("a");
      link.download = `qr_${restaurantName}_${finalRestaurantId || 'unknown'}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("QR descargado con éxito");
    } catch (err) {
      toast.error("Error al descargar el QR");
      console.error("Error en handleDownloadQR:", err);
    }
  };

  const handleCopyLink = () => {
    if (!qrUrl) {
      toast.error("No hay enlace disponible para copiar");
      return;
    }
    // Intentar usar navigator.clipboard
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(qrUrl)
        .then(() => toast.success(`Enlace copiado: ${qrUrl}`))
        .catch((err) => {
          console.error("Error al copiar con navigator.clipboard:", err);
          fallbackCopy(qrUrl);
        });
    } else {
      // Alternativa si clipboard no está disponible
      fallbackCopy(qrUrl);
    }
  };

  const fallbackCopy = (text) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      toast.success(`Enlace copiado (método alternativo): ${text}`);
    } catch (err) {
      toast.error("Error al copiar el enlace");
      console.error("Error en fallbackCopy:", err);
    }
  };

  if (!show) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 sm:p-6 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white p-4 sm:p-8 rounded-2xl w-full max-w-md sm:max-w-lg shadow-2xl border-t-4"
        style={{ borderColor: primaryColor }}
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <img
              src={logoUrl}
              alt={`${restaurantName} logo`}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 object-cover shadow-md"
              style={{ borderColor: primaryColor }}
            />
            <h4 style={{ color: primaryColor, fontFamily: nameFont }}>{restaurantName}</h4>
          </div>
          <motion.button onClick={onClose} whileHover={{ scale: 1.1 }}>
            <FaTimes size={20} />
          </motion.button>
        </div>

        <div
          ref={qrRef}
          className="p-6 bg-white rounded-xl border-4 flex justify-center shadow-lg mb-4"
          style={{ borderColor: secondaryColor }}
        >
          {qrUrl ? (
            <QRCodeCanvas
              value={qrUrl}
              size={220}
              fgColor={primaryColor}
              bgColor="#FFFFFF"
              level="H"
              includeMargin={true}
            />
          ) : (
            <p>No se puede generar el QR</p>
          )}
        </div>
        <p className="text-sm sm:text-base" style={{ fontFamily }}>
          Escanea para ver el menú completo de {restaurantName}
        </p>

        <div className="mt-6">
          <p className="text-sm font-semibold" style={{ fontFamily }}>Enlace del Menú:</p>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              value={qrUrl || "No disponible"}
              readOnly
              className="w-full px-4 py-2 sm:py-3 rounded-lg border text-sm"
              style={{ borderColor: secondaryColor, color: primaryColor }}
            />
            <motion.button
              onClick={handleCopyLink}
              disabled={!qrUrl}
              className="p-2 sm:p-3 bg-gray-100 rounded-full"
              whileHover={{ scale: 1.05 }}
            >
              <FaCopy size={18} />
            </motion.button>
          </div>
        </div>

        <motion.button
          onClick={handleDownloadQR}
          disabled={!qrUrl}
          className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r text-white rounded-lg"
          style={{ background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaDownload /> Descargar Código QR
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default QRModal;