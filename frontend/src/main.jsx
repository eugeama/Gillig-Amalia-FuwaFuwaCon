import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import AuthProvider from "./components/AuthProvider";
import Notificaciones from "./components/Notificaciones";
import "./styles/global.css";
import "./styles/componentes.css";
import "./styles/inicio.css";
import "./styles/clientes.css";
import "./styles/participacion.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Notificaciones>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Notificaciones>
  </React.StrictMode>
);
