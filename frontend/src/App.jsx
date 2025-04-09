import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Shop from "./components/Shop";
import Invoice from "./components/Invoice";
import InvoicesList from "./components/InvoicesList";

function App() {
  const isAuthenticated = !!localStorage.getItem("token");

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        path="/shop"
        element={isAuthenticated ? <Shop /> : <Navigate to="/" />}
      />
      <Route
        path="/invoice"
        element={isAuthenticated ? <Invoice /> : <Navigate to="/" />}
      />
      <Route
        path="/invoices"
        element={isAuthenticated ? <InvoicesList /> : <Navigate to="/" />}
      />
      <Route
        path="/invoices/:number"
        element={isAuthenticated ? <Invoice /> : <Navigate to="/" />}
      />
    </Routes>
  );
}

export default App;
