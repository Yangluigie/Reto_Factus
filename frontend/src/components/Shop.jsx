import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "./Navbar";
import {
  FaCartPlus,
  FaShoppingCart,
  FaSpinner,
  FaUser,
  FaTrash,
} from "react-icons/fa";

const Shop = () => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("token")
  );
  const [customerData, setCustomerData] = useState({
    identification: "",
    dv: "",
    names: "",
    address: "",
    email: "",
    phone: "",
    legal_organization_id: 2,
    tribute_id: 21,
    identification_document_id: 3,
    municipality_id: 980,
  });
  const [formErrors, setFormErrors] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const products = [
    {
      id: 1,
      name: "Camiseta Básica",
      price: 50000,
      code: "PROD001",
      description: "Camiseta cómoda de algodón 100%.",
      image: "/products/1.jpg",
      sizes: ["S", "M", "L", "XL"],
      category: "Ropa",
    },
    {
      id: 2,
      name: "Pantalones Cargo",
      price: 75000,
      code: "PROD002",
      description: "Pantalones resistentes con múltiples bolsillos.",
      image: "/products/2.jpg",
      sizes: ["30", "32", "34", "36"],
      category: "Ropa",
    },
    {
      id: 3,
      name: "Zapatillas Deportivas",
      price: 30000,
      code: "PROD003",
      description: "Zapatillas ligeras ideales para correr.",
      image: "/products/3.jpg",
      sizes: ["38", "39", "40", "41"],
      category: "Calzado",
    },
  ];

  const addToCart = (product, size) => {
    const existing = cart.find(
      (item) => item.id === product.id && item.size === size
    );
    if (existing) {
      setCart(
        cart.map((item) =>
          item.id === product.id && item.size === size
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { ...product, quantity: 1, size }]);
    }
  };

  const removeFromCart = (productId, size) => {
    setCart(
      cart.filter((item) => !(item.id === productId && item.size === size))
    );
  };

  const updateQuantity = (productId, size, delta) => {
    setCart(
      cart.map((item) =>
        item.id === productId && item.size === size
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  const validateForm = () => {
    const errors = {};
    if (!customerData.identification) errors.identification = "Requerido";
    if (!customerData.names) errors.names = "Requerido";
    if (!customerData.email) errors.email = "Requerido";
    else if (!/\S+@\S+\.\S+/.test(customerData.email))
      errors.email = "Email inválido";
    if (!customerData.phone) errors.phone = "Requerido";
    if (!customerData.address) errors.address = "Requerido";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBuy = async () => {
    if (cart.length === 0) {
      alert("El carrito está vacío");
      return;
    }
    setShowForm(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    const invoiceData = {
      numbering_range_id: 8,
      reference_code: `COMPRA-${Date.now()}`,
      observation: "Compra desde la tienda",
      payment_method_code: 10,
      customer: { ...customerData },
      items: cart.map((item) => ({
        code_reference: `${item.code}-${item.size}`,
        name: `${item.name} (${item.size})`,
        quantity: item.quantity,
        discount_rate: 0,
        price: item.price,
        tax_rate: "19.00",
        unit_measure_id: 70,
        standard_code_id: 1,
        is_excluded: 0,
        tribute_id: 1,
        withholding_taxes: [],
      })),
    };

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "/api/v1/create-invoice/",
        invoiceData,
        {
          headers: { Authorization: `Token ${token}` },
        }
      );
      console.log("Respuesta de create-invoice:", response.data);
      const invoiceNumber =
        response.data.data?.bill?.number || response.data.number;
      if (!invoiceNumber) {
        throw new Error("No se encontró el número de factura en la respuesta");
      }
      navigate(`/invoices/${invoiceNumber}`, {
        state: { invoice: response.data },
      });
    } catch (error) {
      console.error("Error al crear la factura:", error);
      alert("Error al procesar la compra: " + (error.message || "Desconocido"));
    } finally {
      setLoading(false);
      setShowForm(false);
    }
  };

  const totalCart = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleInputChange = (e) => {
    setCustomerData({ ...customerData, [e.target.name]: e.target.value });
    setFormErrors({ ...formErrors, [e.target.name]: "" });
  };

  return (
    <>
      <Navbar isAuthenticated={isAuthenticated} />
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">
            Bienvenido a Nuestra Tienda Virtual
          </h2>

          {/* Lista de productos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1"
              >
                <div className="relative w-full pt-[75%]">
                  {" "}
                  {/* Aspect ratio 4:3 */}
                  <img
                    src={product.image}
                    alt={product.name}
                    className="absolute top-0 left-0 w-full h-full object-cover"
                    onError={(e) =>
                      (e.target.src = "/products/placeholder.jpg")
                    } // Imagen de respaldo
                  />
                </div>
                <div className="p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {product.description}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">
                    Código: {product.code}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 mb-3">
                    Categoría: {product.category}
                  </p>
                  <p className="text-xl sm:text-2xl font-medium text-gray-800 mb-4">
                    {product.price.toLocaleString("es-CO", {
                      style: "currency",
                      currency: "COP",
                    })}
                  </p>
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <select
                      className="w-full sm:w-auto p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={(e) => addToCart(product, e.target.value)}
                    >
                      <option value="">Selecciona un tamaño</option>
                      {product.sizes.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => addToCart(product, product.sizes[0])}
                      className="w-full sm:w-auto flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      <FaCartPlus className="mr-2" />
                      Añadir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Carrito */}
          <div className="mt-12 bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6 flex items-center">
              <FaShoppingCart className="mr-2 text-blue-600" />
              Tu Carrito de Compras
            </h3>
            {cart.length === 0 ? (
              <p className="text-gray-600 text-center py-4">
                No hay productos en el carrito
              </p>
            ) : (
              <>
                <div className="space-y-4 sm:space-y-6">
                  {cart.map((item) => (
                    <div
                      key={`${item.id}-${item.size}`}
                      className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center space-x-3 sm:space-x-4 mb-3 sm:mb-0 w-full sm:w-auto">
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="absolute top-0 left-0 w-full h-full object-cover rounded-md"
                            onError={(e) =>
                              (e.target.src = "/products/placeholder.jpg")
                            }
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 font-medium text-sm sm:text-base truncate">
                            {item.name} ({item.size})
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600 truncate">
                            {item.price.toLocaleString("es-CO", {
                              style: "currency",
                              currency: "COP",
                            })}{" "}
                            x {item.quantity}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto justify-between sm:justify-start">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.size, -1)
                            }
                            className="px-2 py-1 sm:px-3 sm:py-1 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                          >
                            -
                          </button>
                          <span className="text-gray-800 font-medium text-sm sm:text-base">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.size, 1)
                            }
                            className="px-2 py-1 sm:px-3 sm:py-1 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                          >
                            +
                          </button>
                        </div>
                        <p className="text-gray-800 font-medium text-sm sm:text-base">
                          {(item.price * item.quantity).toLocaleString(
                            "es-CO",
                            {
                              style: "currency",
                              currency: "COP",
                            }
                          )}
                        </p>
                        <button
                          onClick={() => removeFromCart(item.id, item.size)}
                          className="text-red-600 hover:text-red-800 transition"
                        >
                          <FaTrash className="text-sm sm:text-base" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                    <span className="text-lg font-semibold text-gray-900">
                      Total:
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-gray-900">
                      {totalCart.toLocaleString("es-CO", {
                        style: "currency",
                        currency: "COP",
                      })}
                    </span>
                  </div>
                  <button
                    onClick={handleBuy}
                    disabled={loading}
                    className={`w-full flex items-center justify-center px-6 py-3 rounded-lg text-white font-medium shadow-md transition-all duration-200 ${
                      loading
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700 hover:shadow-lg"
                    }`}
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Procesando...
                      </>
                    ) : (
                      "Confirmar Compra"
                    )}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Formulario */}
          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 max-w-lg w-full mx-4">
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                  <FaUser className="mr-2 text-blue-600" />
                  Completa tus Datos
                </h3>
                <form onSubmit={handleFormSubmit}>
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Identificación *
                      </label>
                      <input
                        type="text"
                        name="identification"
                        value={customerData.identification}
                        onChange={handleInputChange}
                        className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                          formErrors.identification
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        placeholder="Ej: 123456789"
                      />
                      {formErrors.identification && (
                        <p className="text-red-500 text-xs mt-1">
                          {formErrors.identification}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombres *
                      </label>
                      <input
                        type="text"
                        name="names"
                        value={customerData.names}
                        onChange={handleInputChange}
                        className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                          formErrors.names
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        placeholder="Ej: Juan Pérez"
                      />
                      {formErrors.names && (
                        <p className="text-red-500 text-xs mt-1">
                          {formErrors.names}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={customerData.email}
                        onChange={handleInputChange}
                        className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                          formErrors.email
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        placeholder="Ej: juan@example.com"
                      />
                      {formErrors.email && (
                        <p className="text-red-500 text-xs mt-1">
                          {formErrors.email}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono *
                      </label>
                      <input
                        type="text"
                        name="phone"
                        value={customerData.phone}
                        onChange={handleInputChange}
                        className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                          formErrors.phone
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        placeholder="Ej: 3001234567"
                      />
                      {formErrors.phone && (
                        <p className="text-red-500 text-xs mt-1">
                          {formErrors.phone}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dirección *
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={customerData.address}
                        onChange={handleInputChange}
                        className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                          formErrors.address
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        placeholder="Ej: Calle 1 # 2-68"
                      />
                      {formErrors.address && (
                        <p className="text-red-500 text-xs mt-1">
                          {formErrors.address}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dígito de Verificación (DV opcional)
                      </label>
                      <input
                        type="text"
                        name="dv"
                        value={customerData.dv}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="Ej: 3"
                      />
                    </div>
                  </div>
                  <div className="mt-8 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg text-white font-medium shadow-md transition-all duration-200 ${
                        loading
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-green-600 hover:bg-green-700 hover:shadow-lg"
                      }`}
                    >
                      {loading ? (
                        <>
                          <FaSpinner className="animate-spin mr-2" />
                          Procesando...
                        </>
                      ) : (
                        "Procesar Compra"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Shop;
