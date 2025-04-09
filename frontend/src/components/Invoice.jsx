import { useState, useEffect } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "./Navbar";
import { FaDownload, FaSpinner } from "react-icons/fa";

const Invoice = () => {
  const location = useLocation();
  const { number } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(location.state?.invoice || null);
  const [loading, setLoading] = useState(!location.state?.invoice);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("token")
  );

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/", { replace: true });
    } else if (!invoice && number) {
      fetchInvoice();
    }
  }, [isAuthenticated, invoice, number, navigate]);

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

  const fetchInvoice = async () => {
    setLoading(true);
    setError(null);
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

      setInvoice(response.data);
    } catch (err) {
      setError(err.response?.data?.error || "Error al cargar la factura");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!number) {
      setError("Número de factura no disponible");
      return;
    }
    setDownloading(true);
    setError(null);
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
      setError(err.response?.data?.error || "Error al descargar el PDF");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar isAuthenticated={isAuthenticated} />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="flex items-center space-x-2 text-gray-600">
            <FaSpinner className="animate-spin" />
            <span>Cargando factura...</span>
          </div>
        </div>
      </>
    );
  }

  if (error || !invoice) {
    return (
      <>
        <Navbar isAuthenticated={isAuthenticated} />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-red-600 font-medium bg-red-100 px-4 py-2 rounded-lg">
            {error || "No se encontró la factura"}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar isAuthenticated={isAuthenticated} />
      <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6">
            <h2 className="text-2xl md:text-3xl font-bold text-white text-center">
              Factura #{invoice.data.bill.number}
            </h2>
            <p className="text-blue-100 text-center mt-1">
              Fecha: {invoice.data.bill.created_at}
            </p>
          </div>
          <div className="p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Detalles de la Factura
                </h3>
                <div className="space-y-2 text-gray-700">
                  <p>
                    <span className="font-medium">Número:</span>{" "}
                    {invoice.data.bill.number}
                  </p>
                  <p>
                    <span className="font-medium">Total:</span>{" "}
                    {parseFloat(invoice.data.bill.total).toLocaleString(
                      "es-CO",
                      { style: "currency", currency: "COP" }
                    )}
                  </p>
                  <p>
                    <span className="font-medium">CUFE:</span>{" "}
                    <span className="text-sm break-all">
                      {invoice.data.bill.cufe}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium">Estado:</span>{" "}
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        invoice.data.bill.status === 1
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {invoice.data.bill.status === 1
                        ? "Validada"
                        : "Pendiente"}
                    </span>
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Cliente
                </h3>
                <div className="space-y-2 text-gray-700">
                  <p>
                    <span className="font-medium">Nombre:</span>{" "}
                    {invoice.data.customer.graphic_representation_name}
                  </p>
                  <p>
                    <span className="font-medium">Identificación:</span>{" "}
                    {invoice.data.customer.identification}
                  </p>
                  <p>
                    <span className="font-medium">Email:</span>{" "}
                    {invoice.data.customer.email || "No disponible"}
                  </p>
                  <p>
                    <span className="font-medium">Dirección:</span>{" "}
                    {invoice.data.customer.address || "No disponible"}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">
                Items
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-gray-700">
                  <thead className="bg-gray-100 text-gray-900">
                    <tr>
                      <th className="p-3 text-left font-semibold">Producto</th>
                      <th className="p-3 text-left font-semibold">Cantidad</th>
                      <th className="p-3 text-left font-semibold">
                        Precio Unitario
                      </th>
                      <th className="p-3 text-left font-semibold">Descuento</th>
                      <th className="p-3 text-left font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.data.items.map((item, index) => (
                      <tr
                        key={index}
                        className="border-b hover:bg-gray-50 transition-colors"
                      >
                        <td className="p-3">{item.name}</td>
                        <td className="p-3">{item.quantity}</td>
                        <td className="p-3">
                          {parseFloat(item.price).toLocaleString("es-CO", {
                            style: "currency",
                            currency: "COP",
                          })}
                        </td>
                        <td className="p-3">
                          {parseFloat(item.discount).toLocaleString("es-CO", {
                            style: "currency",
                            currency: "COP",
                          })}
                        </td>
                        <td className="p-3">
                          {parseFloat(item.total).toLocaleString("es-CO", {
                            style: "currency",
                            currency: "COP",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mt-8 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Código QR
                </h3>
                <img
                  src={invoice.data.bill.qr_image}
                  alt="Código QR"
                  className="w-32 h-32 md:w-40 md:h-40 mx-auto rounded-lg shadow-sm"
                />
              </div>
              <button
                onClick={downloadPDF}
                disabled={downloading}
                className={`flex items-center justify-center px-6 py-3 rounded-lg text-white font-medium shadow-md transition-all duration-200 ${
                  downloading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg"
                }`}
              >
                {downloading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Descargando...
                  </>
                ) : (
                  <>
                    <FaDownload className="mr-2" />
                    Descargar PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Invoice;
