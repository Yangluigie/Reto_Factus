import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "./Navbar";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("token")
  );
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/shop", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log("Enviando:", { username, password });
    try {
      const loginResponse = await axios.post("/api/v1/login/", {
        username,
        password,
      });
      localStorage.setItem("token", loginResponse.data.token);

      const factusResponse = await axios.get("/api/v1/authenticate/", {
        headers: { Authorization: `Token ${loginResponse.data.token}` },
      });
      localStorage.setItem("factus_token", factusResponse.data.access_token);

      setIsAuthenticated(true);
      setError(null);
      navigate("/shop", { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || "Error al iniciar sesión");
      console.error("Error:", err.response?.data);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsername("");
    setPassword("");
  };

  return (
    <>
      <Navbar isAuthenticated={isAuthenticated} handleLogout={handleLogout} />
      <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
          <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
            Iniciar Sesión
          </h2>
          {!isAuthenticated ? (
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label
                  className="block text-gray-700 font-medium mb-2"
                  htmlFor="username"
                >
                  Usuario
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="Ingresa tu usuario"
                />
              </div>
              <div className="mb-6">
                <label
                  className="block text-gray-700 font-medium mb-2"
                  htmlFor="password"
                >
                  Contraseña
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="Ingresa tu contraseña"
                />
              </div>
              {error && (
                <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
              )}
              <button
                type="submit"
                className="w-full bg-blue-600 text-white p-3 rounded-lg font-medium hover:bg-blue-700 transition shadow-md"
              >
                Iniciar Sesión
              </button>
            </form>
          ) : (
            <div className="text-center">
              <p className="text-gray-700 mb-4">
                Ya estás autenticado. ¡Explora la tienda!
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Login;
