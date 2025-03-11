import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const { login, error: authError } = useAuth(); // Obtener error del contexto
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState(""); // Error local para validaciones

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(""); // Limpiar errores locales previos

    if (!email || !password) {
      setLocalError("Por favor, ingresa email y contraseña.");
      return;
    }

    try {
      console.log("🔹 Enviando login con:", { email, password });
      await login(email, password);
    } catch (err) {
      console.error("Error en handleSubmit:", err.message);
      setLocalError(err.message); // Mostrar el error lanzado por login
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Iniciar Sesión</h2>
      {localError && <p className="text-red-500 mb-4">{localError}</p>}
      {authError && <p className="text-red-500 mb-4">{authError}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded mb-2"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded mb-4"
        />
        <button
          type="submit"
          className="w-full bg-orange-500 text-white p-2 rounded hover:bg-orange-600 transition duration-200"
        >
          Iniciar Sesión
        </button>
      </form>
    </div>
  );
};

export default Login;

