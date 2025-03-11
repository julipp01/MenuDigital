import React from "react";

const ImageUploader = ({ acceptedFormats }) => {
  return (
    <div>
      <h3>Subida de Imágenes</h3>
      <p>Formatos permitidos: {acceptedFormats}</p>
      {/* Aquí puedes agregar la lógica para subir imágenes */}
      <input type="file" accept={acceptedFormats} />
    </div>
  );
};

export default ImageUploader;
