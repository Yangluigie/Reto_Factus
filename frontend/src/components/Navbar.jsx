import { useNavigate } from "react-router-dom";
import axios from "axios";

const Navbar = ({ isAuthenticated, handleLogout }) => {
  const navigate = useNavigate();

  const logoutHandler = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "/api/v1/logout/",
        {},
        {
          headers: { Authorization: `Token ${token}` },
        }
      );
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("factus_token");
      if (handleLogout) handleLogout(); // Llamar al handleLogout del padre si existe
      navigate("/");
    }
  };

  return (
    <nav className="bg-blue-600 p-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div
          className="text-white text-2xl font-bold cursor-pointer"
          onClick={() => navigate(isAuthenticated ? "/shop" : "/")}
        >
          Factus App
        </div>
        <div className="space-x-4">
          {isAuthenticated ? (
            <>
              <button
                onClick={() => navigate("/shop")}
                className="text-white hover:text-gray-200 transition"
              >
                Tienda
              </button>
              <button
                onClick={() => navigate("/invoices")}
                className="text-white hover:text-gray-200 transition"
              >
                Facturas
              </button>
              <button
                onClick={logoutHandler}
                className="text-white bg-red-600 px-4 py-2 rounded-lg hover:bg-red-700 transition"
              >
                Cerrar Sesión
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate("/")}
              className="text-white hover:text-gray-200 transition"
            >
              Iniciar Sesión
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
