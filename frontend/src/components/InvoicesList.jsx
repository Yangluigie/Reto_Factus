import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "./Navbar";
import {
  FaSearch,
  FaSpinner,
  FaDownload,
  FaExternalLinkAlt,
} from "react-icons/fa";

const InvoicesList = () => {
  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    identification: "",
    names: "",
    number: "",
    prefix: "",
    reference_code: "",
    status: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState({});
  const [fetchingDian, setFetchingDian] = useState({});
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("token")
  );
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/", { replace: true });
    } else {
      fetchInvoices(currentPage);
    }
  }, [isAuthenticated, currentPage, navigate]);

  const refreshFactusToken = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/v1/authenticate/", {
        headers: { Authorization: `Token ${token}` },
      });
      localStorage.setItem("factus_token", response.data.access_token);
      return response.data.access_token;
    } catch (err) {
      throw new Error("No se pudo renovar el token de Factus");
    }
  };

  const fetchInvoices = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      let factusToken = localStorage.getItem("factus_token");
      const params = {
        page,
        ...(filters.identification && {
          "filter[identification]": filters.identification,
        }),
        ...(filters.names && { "filter[names]": filters.names }),
        ...(filters.number && { "filter[number]": filters.number }),
        ...(filters.prefix && { "filter[prefix]": filters.prefix }),
        ...(filters.reference_code && {
          "filter[reference_code]": filters.reference_code,
        }),
        ...(filters.status && { "filter[status]": filters.status }),
      };

      let response = await axios.get(
        "https://api-sandbox.factus.com.co/v1/bills",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${factusToken}`,
            Accept: "application/json",
          },
          params,
        }
      );

      if (response.status === 401) {
        factusToken = await refreshFactusToken();
        response = await axios.get(
          "https://api-sandbox.factus.com.co/v1/bills",
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${factusToken}`,
              Accept: "application/json",
            },
            params,
          }
        );
      }

      setInvoices(response.data.data.data);
      setPagination(response.data.data.pagination);
    } catch (err) {
      setError(err.response?.data?.error || "Error al cargar las facturas");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async (number) => {
    setDownloading((prev) => ({ ...prev, [number]: true }));
    try {
      let factusToken = localStorage.getItem("factus_token");
      let response = await axios.get(
        `https://api-sandbox.factus.com.co/v1/bills/download-pdf/${number}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${factusToken}`,
            Accept: "application/json",
          },
        }
      );

      if (response.status === 401) {
        factusToken = await refreshFactusToken();
        response = await axios.get(
          `https://api-sandbox.factus.com.co/v1/bills/download-pdf/${number}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${factusToken}`,
              Accept: "application/json",
            },
          }
        );
      }

      const { file_name, pdf_base_64_encoded } = response.data.data;
      const byteCharacters = atob(pdf_base_64_encoded);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${file_name}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        err.response?.data?.error || `Error al descargar la factura ${number}`
      );
    } finally {
      setDownloading((prev) => ({ ...prev, [number]: false }));
    }
  };

  const viewInDIAN = async (number) => {
    setFetchingDian((prev) => ({ ...prev, [number]: true }));
    try {
      let factusToken = localStorage.getItem("factus_token");
      let response = await axios.get(
        `https://api-sandbox.factus.com.co/v1/bills/show/${number}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${factusToken}`,
            Accept: "application/json",
          },
        }
      );

      if (response.status === 401) {
        factusToken = await refreshFactusToken();
        response = await axios.get(
          `https://api-sandbox.factus.com.co/v1/bills/show/${number}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${factusToken}`,
              Accept: "application/json",
            },
          }
        );
      }

      const cufe = response.data.data.bill.cufe;
      await navigator.clipboard.writeText(cufe);
      const dianUrl =
        "https://catalogo-vpfe-hab.dian.gov.co/User/SearchDocument";
      window.open(dianUrl, "_blank");
      alert(
        "El CUFE ha sido copiado al portapapeles. Pégalo en el campo 'CUFE o UUID' (Ctrl+V) y haz clic en 'Consultar'."
      );
    } catch (err) {
      setError(
        err.response?.data?.error ||
          `Error al obtener los detalles para la factura ${number}`
      );
    } finally {
      setFetchingDian((prev) => ({ ...prev, [number]: false }));
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchInvoices(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleViewInvoice = (number) => {
    navigate(`/invoices/${number}`);
  };

  return (
    <>
      <Navbar isAuthenticated={isAuthenticated} />
      <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-8">
            Lista de Facturas
          </h2>

          <form
            onSubmit={handleFilterSubmit}
            className="bg-white p-6 rounded-xl shadow-md mb-8"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Identificación
                </label>
                <input
                  type="text"
                  name="identification"
                  value={filters.identification}
                  onChange={handleFilterChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Ej: 123456789"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  name="names"
                  value={filters.names}
                  onChange={handleFilterChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Ej: Pepito Perez"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número
                </label>
                <input
                  type="text"
                  name="number"
                  value={filters.number}
                  onChange={handleFilterChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Ej: SETP990000203"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prefijo
                </label>
                <input
                  type="text"
                  name="prefix"
                  value={filters.prefix}
                  onChange={handleFilterChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Ej: SETP"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código de Referencia
                </label>
                <input
                  type="text"
                  name="reference_code"
                  value={filters.reference_code}
                  onChange={handleFilterChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Ej: I3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                >
                  <option value="">Todos</option>
                  <option value="1">Validada</option>
                  <option value="0">Pendiente</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="mt-6 w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-md hover:shadow-lg transition-all duration-200"
            >
              <FaSearch className="mr-2" />
              Aplicar Filtros
            </button>
          </form>

          {loading ? (
            <div className="flex items-center justify-center py-10 text-gray-600">
              <FaSpinner className="animate-spin mr-2" />
              <span>Cargando facturas...</span>
            </div>
          ) : error ? (
            <div className="text-center py-10">
              <p className="text-red-600 font-medium bg-red-100 px-4 py-2 rounded-lg inline-block">
                {error}
              </p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-gray-700">
                    <thead className="bg-gray-100 text-gray-900">
                      <tr>
                        <th className="p-4 text-left font-semibold">ID</th>
                        <th className="p-4 text-left font-semibold">Número</th>
                        <th className="p-4 text-left font-semibold">Cliente</th>
                        <th className="p-4 text-left font-semibold">
                          Identificación
                        </th>
                        <th className="p-4 text-left font-semibold">Total</th>
                        <th className="p-4 text-left font-semibold">Estado</th>
                        <th className="p-4 text-left font-semibold">Creado</th>
                        <th className="p-4 text-left font-semibold">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((invoice) => (
                        <tr
                          key={invoice.id}
                          className="border-b hover:bg-gray-50 transition-colors"
                        >
                          <td className="p-4">{invoice.id}</td>
                          <td className="p-4">{invoice.number}</td>
                          <td className="p-4">
                            {invoice.graphic_representation_name}
                          </td>
                          <td className="p-4">{invoice.identification}</td>
                          <td className="p-4">
                            {parseFloat(invoice.total).toLocaleString("es-CO", {
                              style: "currency",
                              currency: "COP",
                            })}
                          </td>
                          <td className="p-4">
                            <span
                              className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                invoice.status === 1
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {invoice.status === 1 ? "Validada" : "Pendiente"}
                            </span>
                          </td>
                          <td className="p-4">{invoice.created_at}</td>
                          <td className="p-4 flex space-x-2">
                            <button
                              onClick={() => handleViewInvoice(invoice.number)}
                              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm hover:shadow-md transition-all duration-200"
                              title="Ver detalles"
                            >
                              <FaSearch />
                            </button>
                            <button
                              onClick={() => downloadPDF(invoice.number)}
                              disabled={downloading[invoice.number]}
                              className={`p-2 rounded-lg text-white shadow-sm hover:shadow-md transition-all duration-200 ${
                                downloading[invoice.number]
                                  ? "bg-gray-400 cursor-not-allowed"
                                  : "bg-green-600 hover:bg-green-700"
                              }`}
                              title="Descargar PDF"
                            >
                              {downloading[invoice.number] ? (
                                <FaSpinner className="animate-spin" />
                              ) : (
                                <FaDownload />
                              )}
                            </button>
                            <button
                              onClick={() => viewInDIAN(invoice.number)}
                              disabled={fetchingDian[invoice.number]}
                              className={`p-2 rounded-lg text-white shadow-sm hover:shadow-md transition-all duration-200 ${
                                fetchingDian[invoice.number]
                                  ? "bg-gray-400 cursor-not-allowed"
                                  : "bg-purple-600 hover:bg-purple-700"
                              }`}
                              title="Ver en DIAN"
                            >
                              {fetchingDian[invoice.number] ? (
                                <FaSpinner className="animate-spin" />
                              ) : (
                                <FaExternalLinkAlt />
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {pagination.total > 0 && (
                <div className="mt-6 flex justify-center items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={
                      !pagination.links.find(
                        (link) => link.label === "« Anterior"
                      )?.url
                    }
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Anterior
                  </button>
                  {pagination.links
                    .filter((link) => String(link.label).match(/^\d+$/))
                    .map((link) => (
                      <button
                        key={link.page}
                        onClick={() => handlePageChange(link.page)}
                        className={`px-4 py-2 rounded-lg font-medium ${
                          link.active
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        } transition`}
                      >
                        {link.label}
                      </button>
                    ))}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={
                      !pagination.links.find(
                        (link) => link.label === "Siguiente »"
                      )?.url
                    }
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default InvoicesList;
