import { useState, useEffect } from "react";

const Usuarios = () => {
  const [users, setUsers] = useState([]);
  useEffect(() => {
    // Simulación de API
    setUsers([
      { id: 1, name: "Juan Pérez", role: "Admin", email: "juan@example.com" },
      { id: 2, name: "María López", role: "Usuario", email: "maria@example.com" },
    ]);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Usuarios y Roles</h1>
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <ul className="space-y-4">
          {users.map((user) => (
            <li key={user.id} className="flex justify-between items-center border-b pb-2">
              <span>{user.name} - {user.role}</span>
              <span className="text-gray-500">{user.email}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Usuarios;