import { useCallback, useEffect, useState } from "react";
import Boton from "../components/Boton";
import Cargando from "../components/Cargando";
import TablaUsuarios from "../components/TablaUsuarios";
import { asignarAdministrador, getUsuarios } from "../services/usuarioService";
import { useNotificaciones } from "../utils/notificaciones";

function Usuarios() {
  const { exito, error } = useNotificaciones();
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [falloCarga, setFalloCarga] = useState(false);
  const [asignando, setAsignando] = useState(false);

  const cargarUsuarios = useCallback(async () => {
    setCargando(true);
    setFalloCarga(false);

    try {
      setUsuarios(await getUsuarios());
    } catch (err) {
      setFalloCarga(true);
      error(err.message);
    } finally {
      setCargando(false);
    }
  }, [error]);

  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  async function hacerAdministrador(usuario) {
    setAsignando(true);

    try {
      await asignarAdministrador(usuario.id);
      exito(`${usuario.nombre} ahora es administrador`);
      await cargarUsuarios();
    } catch (err) {
      error(err.message);
    } finally {
      setAsignando(false);
    }
  }

  return (
    <section className="pagina-clientes" aria-labelledby="usuarios-titulo">
      <h1 id="usuarios-titulo" className="titulo-principal">
        Usuarios
      </h1>

      <div className="listado">
        <h2 className="titulo-secundario">Listado de usuarios</h2>
        {cargando && <Cargando mensaje="Cargando usuarios..." />}
        {!cargando && falloCarga && (
          <div className="texto-centrado">
            <p>No se pudieron cargar los usuarios.</p>
            <Boton onClick={cargarUsuarios}>Reintentar</Boton>
          </div>
        )}
        {!cargando && !falloCarga && (
          <TablaUsuarios usuarios={usuarios} asignando={asignando} onAsignarAdministrador={hacerAdministrador} />
        )}
      </div>
    </section>
  );
}

export default Usuarios;
