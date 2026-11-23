import { useEffect, useState } from "react";
import AvisoApi from "../components/AvisoApi";
import Boton from "../components/Boton";
import Cargando from "../components/Cargando";
import PaginaParticipacion from "../components/PaginaParticipacion";
import SelectorFechas from "../components/SelectorFechas";
import { getConcursos } from "../services/eventoService";
import { getMisInscripciones, inscribirEnConcurso } from "../services/concursoService";
import { useAuth } from "../utils/auth";
import { fechasVigentes, proximoEvento } from "../utils/fechas";
import { useNotificaciones } from "../utils/notificaciones";
import useEventos from "../hooks/useEventos";

function Concursos({ onNavegar, parametros }) {
  const { usuario } = useAuth();
  const { exito, error } = useNotificaciones();
  const { eventos } = useEventos();
  const [fechaElegida, setFechaElegida] = useState(parametros?.fecha ?? "");
  const evento = eventos.find((item) => String(item.id) === String(parametros?.eventoId)) ?? proximoEvento(eventos);
  const eventoId = evento ? String(evento.id) : "";
  const fechas = fechasVigentes(evento);
  const fecha = fechas.includes(fechaElegida) ? fechaElegida : fechas[0];
  const [concursos, setConcursos] = useState([]);
  const [inscripciones, setInscripciones] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [inscribiendo, setInscribiendo] = useState(null);
  const [falloCarga, setFalloCarga] = useState(false);
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    if (!eventoId || !fecha) return;
    let activo = true;
    setCargando(true);
    setFalloCarga(false);

    Promise.all([
      getConcursos(eventoId, fecha),
      usuario?.tipo === "cliente" ? getMisInscripciones() : Promise.resolve([]),
    ])
      .then(([lista, misInscripciones]) => {
        if (activo) {
          setConcursos(lista);
          setInscripciones(misInscripciones);
        }
      })
      .catch((err) => {
        if (activo) {
          setFalloCarga(true);
          error(err.message);
        }
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [eventoId, fecha, error, recarga, usuario]);

  async function inscribirse(concurso) {
    if (!usuario) {
      onNavegar("cuenta");
      return;
    }
    if (usuario.tipo !== "cliente") {
      error("Los concursos están disponibles para las cuentas de cliente.");
      return;
    }
    setInscribiendo(concurso.id);
    try {
      await inscribirEnConcurso(concurso.id, fecha);
      setInscripciones(await getMisInscripciones());
      setConcursos(await getConcursos(eventoId, fecha));
      exito(`Te inscribiste en ${concurso.nombre}.`);
    } catch (err) {
      error(err.message);
      setConcursos(await getConcursos(eventoId, fecha).catch(() => concursos));
    } finally {
      setInscribiendo(null);
    }
  }

  return (
    <PaginaParticipacion
      titulo="Concursos"
      descripcion="Consultá los cupos disponibles e inscribite a los concursos del evento."
    >
      <Boton variante="secundario" onClick={() => onNavegar("eventos", { eventoId })}>Volver al evento</Boton>
      {fechas.length > 0 && (
        <SelectorFechas fechas={fechas} seleccionada={fecha} onCambiar={setFechaElegida} />
      )}
      {cargando && <Cargando mensaje="Cargando concursos..." />}
      {!cargando && falloCarga && (
        <div className="panel-participacion">
          <p>No se pudieron cargar los concursos.</p>
          <Boton onClick={() => setRecarga((actual) => actual + 1)}>Reintentar</Boton>
        </div>
      )}
      {!cargando && !falloCarga && (
        concursos.length === 0 ? (
          <p className="panel-participacion">Todavía no hay concursos publicados para este evento.</p>
        ) : (
          <div className="participacion-opciones">
            {concursos.map((concurso) => {
              const inscripto = inscripciones.some((item) => item.concursoId === concurso.id && item.fecha === fecha);
              const deshabilitado = concurso.completo || inscripto || inscribiendo === concurso.id;
              return (
                <article className="panel-participacion concurso-card" key={concurso.id}>
                  <h2 className="titulo-secundario">{concurso.nombre}</h2>
                  {concurso.descripcion && <p>{concurso.descripcion}</p>}
                  <p>
                    {concurso.completo
                      ? "Cupos completos"
                      : `${concurso.cuposDisponibles} de ${concurso.cupo} cupos disponibles`}
                  </p>
                  {inscripto ? (
                    <p className="estado-inscripcion">Ya estás inscripto</p>
                  ) : usuario?.tipo === "cliente" ? (
                    <Boton onClick={() => inscribirse(concurso)} disabled={deshabilitado}>
                      {inscribiendo === concurso.id ? "Inscribiendo..." : concurso.completo ? "Sin cupos" : "Inscribirme"}
                    </Boton>
                  ) : (
                    <Boton onClick={() => inscribirse(concurso)} disabled={concurso.completo}>
                      {concurso.completo ? "Sin cupos" : usuario ? "Disponible para clientes" : "Ingresar para inscribirme"}
                    </Boton>
                  )}
                </article>
              );
            })}
          </div>
        )
      )}
      <AvisoApi>
        El servidor controla los cupos y evita inscripciones duplicadas, incluso si varias
        personas intentan anotarse al mismo tiempo.
      </AvisoApi>
    </PaginaParticipacion>
  );
}

export default Concursos;
