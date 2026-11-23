import { useCallback, useEffect, useState } from "react";
import AvisoApi from "../components/AvisoApi";
import Boton from "../components/Boton";
import Cargando from "../components/Cargando";
import CampoFormulario from "../components/CampoFormulario";
import DialogoConfirmacion from "../components/DialogoConfirmacion";
import EditorFechas from "../components/EditorFechas";
import PaginaParticipacion from "../components/PaginaParticipacion";
import {
  createConcurso,
  createEvento,
  deleteConcurso,
  deleteEvento,
  getConcursos,
  updateEvento,
} from "../services/eventoService";
import { createNovedad, deleteNovedad } from "../services/novedadService";
import {
  eliminarReservaAdministrador,
  getReservasAdministrador,
  resolverReserva,
} from "../services/reservaService";
import {
  eliminarInscripcionAdministrador,
  getInscripcionesAdministrador,
} from "../services/concursoService";
import { formatearDiaMes, proximoEvento } from "../utils/fechas";
import { useNotificaciones } from "../utils/notificaciones";
import useEventos from "../hooks/useEventos";
import useNovedades from "../hooks/useNovedades";

const EVENTO_INICIAL = {
  nombre: "",
  tematica: "",
  fechas: [],
  descripcion: "",
};

const PUBLICACION_INICIAL = {
  titulo: "",
  texto: "",
  imagen: "",
};

const CONCURSO_INICIAL = {
  nombre: "",
  descripcion: "",
  cupos: {},
};

const ELIMINACIONES = {
  reserva: {
    mensaje: "La mesa quedará liberada y la reserva dejará de aparecer.",
    exito: "Reserva eliminada.",
  },
  inscripcion: {
    mensaje: "El cliente dejará de estar inscripto en este concurso.",
    exito: "Inscripción eliminada.",
  },
  evento: {
    mensaje: "Se borrarán también sus concursos, inscripciones, mesas y reservas.",
    exito: "Evento eliminado.",
  },
  concurso: {
    mensaje: "Se borrarán también sus inscripciones.",
    exito: "Concurso eliminado.",
  },
  publicacion: {
    mensaje: "La publicación dejará de aparecer en el carrusel.",
    exito: "Publicación eliminada.",
  },
};

function Admin() {
  const { exito, error } = useNotificaciones();
  const { eventos, recargar: recargarEventos } = useEventos();
  const { novedades, recargar: recargarNovedades } = useNovedades();
  const [reservas, setReservas] = useState([]);
  const [cargandoReservas, setCargandoReservas] = useState(true);
  const [inscripciones, setInscripciones] = useState([]);
  const [enProceso, setEnProceso] = useState(null);
  const [enviando, setEnviando] = useState("");
  const [concursosPorEvento, setConcursosPorEvento] = useState({});
  const [paraEliminar, setParaEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const eventoActual = proximoEvento(eventos);
  const [eventoForm, setEventoForm] = useState(EVENTO_INICIAL);
  const [concursoNuevo, setConcursoNuevo] = useState(CONCURSO_INICIAL);
  const [publicacionNueva, setPublicacionNueva] = useState(PUBLICACION_INICIAL);

  useEffect(() => {
    setEventoForm(eventoActual ? {
      nombre: eventoActual.nombre,
      tematica: eventoActual.tematica ?? "",
      fechas: [...eventoActual.fechas],
      descripcion: eventoActual.descripcion ?? "",
    } : EVENTO_INICIAL);
  }, [eventoActual?.id, eventos]);

  const cargarConcursos = useCallback(async () => {
    try {
      const pares = await Promise.all(
        eventos.map(async (evento) => [evento.id, await getConcursos(evento.id)])
      );
      setConcursosPorEvento(Object.fromEntries(pares));
    } catch (err) {
      error(err.message);
    }
  }, [eventos, error]);

  useEffect(() => {
    cargarConcursos();
  }, [cargarConcursos]);

  const cargarReservas = useCallback(async () => {
    setCargandoReservas(true);
    try {
      setReservas(await getReservasAdministrador());
    } catch (err) {
      error(err.message);
    } finally {
      setCargandoReservas(false);
    }
  }, [error]);

  useEffect(() => {
    cargarReservas();
  }, [cargarReservas]);

  const cargarInscripciones = useCallback(async () => {
    try {
      setInscripciones(await getInscripcionesAdministrador());
    } catch (err) {
      error(err.message);
    }
  }, [error]);

  useEffect(() => {
    cargarInscripciones();
  }, [cargarInscripciones]);

  async function resolver(reserva, estado) {
    setEnProceso(reserva.id);
    try {
      const resultado = await resolverReserva(reserva.id, estado);
      setReservas((actuales) => actuales.map((item) => item.id === resultado.id ? resultado : item));
      exito(estado === "confirmada" ? "Solicitud confirmada." : "Solicitud rechazada y mesa liberada.");
    } catch (err) {
      error(err.message);
      await cargarReservas();
    } finally {
      setEnProceso(null);
    }
  }

  function pedirEliminacion(tipo, id, nombre) {
    setParaEliminar({ tipo, id, nombre, mensaje: ELIMINACIONES[tipo].mensaje });
  }

  async function confirmarEliminacion() {
    setEliminando(true);
    try {
      if (paraEliminar.tipo === "evento") {
        await deleteEvento(paraEliminar.id);
        await recargarEventos();
        await cargarReservas();
        await cargarInscripciones();
      } else if (paraEliminar.tipo === "concurso") {
        await deleteConcurso(paraEliminar.id);
        await cargarConcursos();
        await cargarInscripciones();
      } else if (paraEliminar.tipo === "reserva") {
        await eliminarReservaAdministrador(paraEliminar.id);
        await cargarReservas();
      } else if (paraEliminar.tipo === "inscripcion") {
        await eliminarInscripcionAdministrador(paraEliminar.id);
        await cargarInscripciones();
      } else {
        await deleteNovedad(paraEliminar.id);
        await recargarNovedades();
      }
      exito(ELIMINACIONES[paraEliminar.tipo].exito);
      setParaEliminar(null);
    } catch (err) {
      error(err.message);
    } finally {
      setEliminando(false);
    }
  }

  async function enviarFormulario(tipo, evento) {
    evento?.preventDefault();
    setEnviando(tipo);
    try {
      if (tipo === "evento" || tipo === "actualizar-evento") {
        if (eventoForm.fechas.length === 0) {
          throw new Error("Agregá al menos una fecha al evento.");
        }
      }
      if (tipo === "evento") {
        await createEvento(eventoForm);
        await recargarEventos();
        exito("Evento creado.");
      } else if (tipo === "actualizar-evento") {
        await updateEvento(eventoActual.id, eventoForm);
        await recargarEventos();
        exito("Datos del evento actualizados.");
      } else if (tipo === "concurso") {
        const cupos = Object.fromEntries(
          eventoActual.fechas.map((fecha) => [fecha, Number(concursoNuevo.cupos[fecha])])
        );
        await createConcurso(eventoActual.id, { ...concursoNuevo, cupos });
        setConcursoNuevo(CONCURSO_INICIAL);
        await recargarEventos();
        exito("Concurso agregado al evento.");
      } else {
        await createNovedad(publicacionNueva);
        await recargarNovedades();
        setPublicacionNueva(PUBLICACION_INICIAL);
        exito("Publicación creada para el carrusel.");
      }
    } catch (err) {
      error(err.message);
    } finally {
      setEnviando("");
    }
  }

  return (
    <PaginaParticipacion
      titulo="Administración"
      descripcion="Revisá solicitudes y mantené los eventos, las mesas y los concursos."
    >
      <AvisoApi>
        Confirmar o rechazar una solicitud actualiza el estado desde el servidor. Al rechazarla,
        el stand vuelve a estar disponible.
      </AvisoApi>
      <section className="panel-participacion" aria-labelledby="solicitudes-pendientes">
        <div className="panel-titulo">
          <h2 id="solicitudes-pendientes" className="titulo-secundario">Solicitudes de mesas</h2>
          <Boton variante="secundario" onClick={cargarReservas} disabled={cargandoReservas}>Actualizar</Boton>
        </div>
        {cargandoReservas && <Cargando mensaje="Cargando solicitudes..." />}
        {!cargandoReservas && reservas.length === 0 && <p>No hay solicitudes de mesa.</p>}
        {!cargandoReservas && reservas.map((reserva) => (
          <article className="reserva-admin" key={reserva.id}>
            <div>
              <h3>{reserva.emprendedor?.nombre ?? "Emprendedor"}</h3>
              <p>{reserva.emprendedor?.email}</p>
              <p>{reserva.evento.nombre} · {reserva.stand?.nombre} · {reserva.fecha}</p>
              <span className={`estado-reserva estado-reserva--${reserva.estado}`}>{reserva.estado}</span>
            </div>
            <div className="tabla__acciones">
              {reserva.estado === "pendiente" && (
                <>
                  <Boton onClick={() => resolver(reserva, "confirmada")} disabled={enProceso === reserva.id}>
                    {enProceso === reserva.id ? "Guardando..." : "Confirmar"}
                  </Boton>
                  <Boton variante="peligro" onClick={() => resolver(reserva, "cancelada")} disabled={enProceso === reserva.id}>
                    Rechazar y liberar mesa
                  </Boton>
                </>
              )}
              <Boton variante="peligro" onClick={() => pedirEliminacion("reserva", reserva.id, `la reserva de ${reserva.stand?.nombre ?? "la mesa"}`)}>
                Eliminar reserva
              </Boton>
            </div>
          </article>
        ))}
      </section>

      <section className="panel-participacion" aria-labelledby="catalogo-titulo">
        <h2 id="catalogo-titulo" className="titulo-secundario">Eventos y actividades</h2>
        <form className="formulario formulario--admin" onSubmit={(evento) => enviarFormulario(evento.nativeEvent.submitter?.value === "actualizar" ? "actualizar-evento" : "evento", evento)}>
          <h3>{eventoActual ? "Evento del mes" : "Crear evento"}</h3>
          <CampoFormulario id="eventoNombre" name="nombre" etiqueta="Nombre" type="text" value={eventoForm.nombre} onChange={(e) => setEventoForm({ ...eventoForm, nombre: e.target.value })} required />
          <CampoFormulario id="eventoTematica" name="tematica" etiqueta="Temática" type="text" value={eventoForm.tematica} onChange={(e) => setEventoForm({ ...eventoForm, tematica: e.target.value })} required />
          <EditorFechas id="eventoFechas" fechas={eventoForm.fechas} onCambiar={(fechas) => setEventoForm({ ...eventoForm, fechas })} />
          <CampoFormulario id="eventoDescripcion" name="descripcion" etiqueta="Descripción" type="text" value={eventoForm.descripcion} onChange={(e) => setEventoForm({ ...eventoForm, descripcion: e.target.value })} />
          <div className="tabla__acciones">
            <Boton type="submit" value="crear" disabled={enviando === "evento"}>{enviando === "evento" ? "Guardando..." : "Crear evento"}</Boton>
            <Boton type="submit" value="actualizar" variante="secundario" disabled={!eventoActual || enviando === "actualizar-evento"}>
              {enviando === "actualizar-evento" ? "Guardando..." : "Actualizar evento"}
            </Boton>
          </div>
        </form>

        <div className="catalogo-formularios">
          <form className="formulario formulario--admin" onSubmit={(evento) => enviarFormulario("concurso", evento)}>
            <h3>Agregar concurso</h3>
            <CampoFormulario id="concursoNombre" name="nombre" etiqueta="Nombre del concurso" type="text" value={concursoNuevo.nombre} onChange={(e) => setConcursoNuevo({ ...concursoNuevo, nombre: e.target.value })} required />
            <CampoFormulario id="concursoDescripcion" name="descripcion" etiqueta="Descripción" type="text" value={concursoNuevo.descripcion} onChange={(e) => setConcursoNuevo({ ...concursoNuevo, descripcion: e.target.value })} />
            {eventoActual?.fechas.map((fecha) => (
              <CampoFormulario
                key={fecha}
                id={`concursoCupo-${fecha}`}
                name={`cupo-${fecha}`}
                etiqueta={`Cupo ${formatearDiaMes(fecha)}`}
                type="number"
                min="1"
                step="1"
                value={concursoNuevo.cupos[fecha] ?? ""}
                onChange={(e) => setConcursoNuevo({ ...concursoNuevo, cupos: { ...concursoNuevo.cupos, [fecha]: e.target.value } })}
                required
              />
            ))}
            <Boton type="submit" disabled={!eventoActual || enviando === "concurso"}>{enviando === "concurso" ? "Guardando..." : "Agregar concurso"}</Boton>
          </form>
        </div>

        <h3>Eventos cargados</h3>
        {eventos.length === 0 && <p>No hay eventos cargados.</p>}
        <ul>
          {eventos.map((evento) => (
            <li key={evento.id}>
              <div className="panel-titulo">
                <p><strong>{evento.nombre}</strong> · {evento.fechas.map((fecha) => formatearDiaMes(fecha)).join(", ")}</p>
                <Boton variante="peligro" onClick={() => pedirEliminacion("evento", evento.id, evento.nombre)}>Eliminar evento</Boton>
              </div>
              {(concursosPorEvento[evento.id] ?? []).length > 0 && (
                <ul>
                  {concursosPorEvento[evento.id].map((concurso) => (
                    <li key={concurso.id}>
                      <div className="panel-titulo">
                        <span>Concurso: {concurso.nombre}</span>
                        <Boton variante="peligro" onClick={() => pedirEliminacion("concurso", concurso.id, concurso.nombre)}>Eliminar concurso</Boton>
                      </div>
                      <ul>
                        {inscripciones.filter((inscripcion) => inscripcion.concursoId === concurso.id).map((inscripcion) => (
                          <li className="panel-titulo" key={inscripcion.id}>
                            <span>{inscripcion.cliente?.nombre ?? "Cliente"} · {formatearDiaMes(inscripcion.fecha)}</span>
                            <Boton variante="peligro" onClick={() => pedirEliminacion("inscripcion", inscripcion.id, inscripcion.cliente?.nombre ?? "la inscripción")}>Eliminar inscripción</Boton>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="panel-participacion" aria-labelledby="publicaciones-titulo">
        <h2 id="publicaciones-titulo" className="titulo-secundario">Publicaciones del carrusel</h2>
        <form className="formulario formulario--admin" onSubmit={(evento) => enviarFormulario("publicacion", evento)}>
          <h3>Crear publicación</h3>
          <CampoFormulario id="publicacionTitulo" name="titulo" etiqueta="Título" type="text" value={publicacionNueva.titulo} onChange={(e) => setPublicacionNueva({ ...publicacionNueva, titulo: e.target.value })} required />
          <CampoFormulario id="publicacionTexto" name="texto" etiqueta="Texto" type="text" value={publicacionNueva.texto} onChange={(e) => setPublicacionNueva({ ...publicacionNueva, texto: e.target.value })} required />
          <CampoFormulario id="publicacionImagen" name="imagen" etiqueta="Link de la imagen (opcional)" type="url" value={publicacionNueva.imagen} onChange={(e) => setPublicacionNueva({ ...publicacionNueva, imagen: e.target.value })} />
          <Boton type="submit" disabled={enviando === "publicacion"}>{enviando === "publicacion" ? "Guardando..." : "Crear publicación"}</Boton>
        </form>

        <h3>Publicaciones cargadas</h3>
        {novedades.length === 0 && <p>No hay publicaciones en el carrusel.</p>}
        <ul>
          {novedades.map((novedad) => (
            <li className="panel-titulo" key={novedad.id}>
              <span>{novedad.titulo}</span>
              <Boton variante="peligro" onClick={() => pedirEliminacion("publicacion", novedad.id, novedad.titulo)}>Eliminar publicación</Boton>
            </li>
          ))}
        </ul>
      </section>

      <DialogoConfirmacion
        abierto={paraEliminar !== null}
        titulo={`¿Eliminar ${paraEliminar?.nombre ?? ""}?`}
        mensaje={paraEliminar?.mensaje}
        textoConfirmar="Eliminar"
        textoProcesando="Eliminando..."
        procesando={eliminando}
        onConfirmar={confirmarEliminacion}
        onCancelar={() => setParaEliminar(null)}
      />
    </PaginaParticipacion>
  );
}

export default Admin;
