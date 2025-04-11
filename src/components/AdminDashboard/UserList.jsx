import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("[UserList] Iniciando carga de usuarios...");

    const token = localStorage.getItem("token");
    if (!token) {
      console.error("[UserList] No se encontró token de autenticación.");
      setError("Acceso denegado: No hay token.");
      setLoading(false);
      return;
    }

    fetch("http://localhost:5000/api/users", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        console.log("[UserList] Respuesta de la API:", res);
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("[UserList] Datos recibidos:", data);
        if (!Array.isArray(data)) {
          throw new Error("La API no devolvió una lista de usuarios válida.");
        }
        setUsers(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("[UserList] Error al cargar usuarios:", err);
        setError("Error al cargar usuarios.");
        setLoading(false);
      });
  }, []);

  const deleteUser = async (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar este usuario?")) return;
    try {
      console.log(`[UserList] Intentando eliminar usuario con ID: ${id}`);
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api/users/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || `Error al eliminar usuario. Status: ${response.status}`);
      }
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== id));
      console.log(`[UserList] Usuario con ID ${id} eliminado correctamente.`);
    } catch (error) {
      console.error("[UserList] Error eliminando usuario:", error);
      alert(error.message);
    }
  };

  if (loading) return <p>Cargando usuarios...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Gestión de Usuarios</h2>
      <Link
        to="/admin/usuarios/nuevo"
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4 inline-block"
      >
        + Nuevo Usuario
      </Link>
      <table className="w-full border border-gray-200 mt-4">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-4 py-2">ID</th>
            <th className="border px-4 py-2">Nombre</th>
            <th className="border px-4 py-2">Email</th>
            <th className="border px-4 py-2">Rol</th>
            <th className="border px-4 py-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.length > 0 ? (
            users.map((user) => (
              <tr key={user.id} className="text-center">
                <td className="border px-4 py-2">{user.id}</td>
                <td className="border px-4 py-2">{user.name}</td>
                <td className="border px-4 py-2">{user.email}</td>
                <td className="border px-4 py-2">{user.role}</td>
                <td className="border px-4 py-2">
                  <Link
                    to={`/admin/usuarios/editar/${user.id}`}
                    className="text-blue-500 mr-2"
                  >
                    ✏️ Editar
                  </Link>
                  <button
                    className="text-red-500"
                    onClick={() => deleteUser(user.id)}
                  >
                    🗑️ Eliminar
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="text-center p-4 text-gray-500">
                No hay usuarios registrados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UserList;





