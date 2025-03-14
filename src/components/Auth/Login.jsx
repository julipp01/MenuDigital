import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const { login, error: authError } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");

    if (!email.trim() || !password.trim()) {
      setLocalError("Por favor, ingresa email y contraseña.");
      return;
    }

    setLoading(true);
    try {
      console.log("🔹 Enviando login con:", { email, password });
      await login({ email, password }); // Corrección: pasa un objeto
    } catch (err) {
      console.error("Error en handleSubmit:", err.message);
      setLocalError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4 text-center">Iniciar Sesión</h2>

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
          disabled={loading}
        >
          {loading ? "Cargando..." : "Iniciar Sesión"}
        </button>
      </form>

      <div className="mt-4 flex justify-between">
        <button
          onClick={() => navigate("/")}
          className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition duration-200"
        >
          Volver al Home
        </button>
        <button
          onClick={() => navigate("/register")}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-200"
        >
          Registrarse
        </button>
      </div>
    </div>
  );
};

export default Login;


