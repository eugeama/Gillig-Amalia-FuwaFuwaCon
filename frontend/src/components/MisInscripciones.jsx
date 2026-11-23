import { useCallback, useEffect, useState } from "react";
import Boton from "./Boton";
import Cargando from "./Cargando";
import DialogoConfirmacion from "./DialogoConfirmacion";
import { cancelarInscripcion, getMisInscripciones } from "../services/concursoService";
import { useNotificaciones } from "../utils/notificaciones";
import { formatearFecha } from "../utils/formatearFecha";

function MisInscripciones() {
  const { exito, error } = useNotificaciones();
  const [inscripciones, setInscripciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [falloCarga, setFalloCarga] = useState(false);
  const [inscripcionSeleccionada, setInscripcionSeleccionada] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setFalloCarga(false);
    try {
      setInscripciones(await getMisInscripciones());
    } catch (err) {
      setFalloCarga(true);
      error(err.message);
    } finally {
      setCargando(false);
    }
  }, [error]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function confirmarEliminacion() {
    if (!inscripcionSeleccionada) return;
    setEliminando(true);
    try {
      await cancelarInscripcion(inscripcionSeleccionada.id);
      setInscripcionSeleccionada(null);
      exito("La inscripción se eliminó correctamente.");
      await cargar();
    } catch (err) {
      error(err.message);
    } finally {
      setEliminando(false);
    }
  }

  return (
    <section className="panel-participacion" aria-labelledby="mis-inscripciones-titulo">
      <h2 id="mis-inscripciones-titulo" className="titulo-secundario">Mis inscripciones</h2>
      {cargando && <Cargando mensaje="Cargando inscripciones..." />}
      {!cargando && falloCarga && (
        <div>
          <p>No se pudieron cargar tus inscripciones.</p>
          <Boton onClick={cargar}>Reintentar</Boton>
        </div>
      )}
      {!cargando && !falloCarga && inscripciones.length === 0 && (
        <p>Todavía no estás inscripto en ningún concurso.</p>
      )}
      {!cargando && !falloCarga && inscripciones.map((inscripcion) => (
        <article className="reserva-card" key={inscripcion.id}>
          <div className="evento__cabecera">
            <h3 className="titulo-secundario">{inscripcion.concurso?.nombre ?? "Concurso"}</h3>
          </div>
          <dl className="evento__datos">
            <div><dt>Evento</dt><dd>{inscripcion.evento?.nombre ?? "No disponible"}</dd></div>
            <div><dt>Fecha</dt><dd>{formatearFecha(inscripcion.fecha)}</dd></div>
            <div><dt>Horario</dt><dd>{inscripcion.evento?.horario ?? "No disponible"}</dd></div>
            <div><dt>Ubicación</dt><dd>{inscripcion.evento?.ubicacion ?? "No disponible"}</dd></div>
          </dl>
          <Boton variante="peligro" onClick={() => setInscripcionSeleccionada(inscripcion)}>
            Eliminar inscripción
          </Boton>
        </article>
      ))}
      <DialogoConfirmacion
        abierto={inscripcionSeleccionada !== null}
        titulo="¿Estás seguro?"
        mensaje={`Se eliminará tu inscripción al concurso ${inscripcionSeleccionada?.concurso?.nombre ?? ""}.`}
        textoConfirmar="Eliminar inscripción"
        textoProcesando="Eliminando..."
        procesando={eliminando}
        onConfirmar={confirmarEliminacion}
        onCancelar={() => setInscripcionSeleccionada(null)}
      />
    </section>
  );
}

export default MisInscripciones;
