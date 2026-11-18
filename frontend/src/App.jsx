import { useEffect, useRef, useState } from "react";
import Admin from "./pages/Admin";
import Footer from "./components/Footer";
import Usuarios from "./pages/Usuarios";
import Navbar from "./components/Navbar";
import { useAuth } from "./utils/auth";
import Concursos from "./pages/Concursos";
import Cuenta from "./pages/Cuenta";
import Eventos from "./pages/Eventos";
import Inicio from "./pages/Inicio";
import Stands from "./pages/Stands";

function App() {
  const [pagina, setPagina] = useState("inicio");
  const seccionPendiente = useRef(null);
  const [parametros, setParametros] = useState(null);
  const { usuario, cargandoSesion } = useAuth();

  function navegar(nuevaPagina, destino) {
    if (nuevaPagina === pagina) {
      if (typeof destino === "string") irASeccion(destino);
      else window.scrollTo(0, 0);
      return;
    }

    seccionPendiente.current = typeof destino === "string" ? destino : null;
    setParametros(typeof destino === "object" ? destino : null);
    setPagina(nuevaPagina);
  }

  function irASeccion(seccion) {
    if (seccion) {
      document.getElementById(seccion)?.scrollIntoView();
    } else {
      window.scrollTo(0, 0);
    }
  }

  useEffect(() => {
    irASeccion(seccionPendiente.current);
    seccionPendiente.current = null;
  }, [pagina]);

  return (
    <>
      <Navbar pagina={pagina} onNavegar={navegar} />
      <main>
        {pagina === "inicio" && <Inicio onNavegar={navegar} />}
        {pagina === "eventos" && <Eventos onNavegar={navegar} />}
        {pagina === "stands" && <Stands onNavegar={navegar} parametros={parametros} />}
        {pagina === "concursos" && <Concursos onNavegar={navegar} parametros={parametros} />}
        {pagina === "cuenta" && <Cuenta onNavegar={navegar} />}
        {pagina === "administracion" && usuario?.tipo === "administrador" && <Admin />}
        {pagina === "usuarios" && usuario?.tipo === "administrador" && <Usuarios />}
        {cargandoSesion && <div className="sesion-cargando">Verificando sesión...</div>}
      </main>
      <Footer />
    </>
  );
}

export default App;
