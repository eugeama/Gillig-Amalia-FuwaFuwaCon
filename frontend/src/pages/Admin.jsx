import { useCallback, useEffect, useState } from "react";
import AvisoApi from "../components/AvisoApi";
import Boton from "../components/Boton";
import Cargando from "../components/Cargando";
import CampoFormulario from "../components/CampoFormulario";
import PaginaParticipacion from "../components/PaginaParticipacion";
import {
  createConcurso,
  createEvento,
  createStand,
  updateEvento,
} from "../services/eventoService";
import { getReservasAdministrador, resolverReserva } from "../services/reservaService";
import { useNotificaciones } from "../utils/notificaciones";
import useEventos from "../hooks/useEventos";

const RESERVA_INICIAL = {
  nombre: "",
  tematica: "",
  fecha: "",
  horario: "",
  ubicacion: "",
  descripcion: "",
};

function Admin() {
  const { exito, error } = useNotificaciones();
  const { eventos, cargando: cargandoEventos, recargar: recargarEventos } = useEventos();
  const [reservas, setReservas] = useState([]);
  const [cargandoReservas, setCargandoReservas] = useState(true);
  const [enProceso, setEnProceso] = useState(null);
  const [enviando, setEnviando] = useState("");
  const [eventoSeleccionado, setEventoSeleccionado] = useState("");
  const [eventoNuevo, setEventoNuevo] = useState(RESERVA_INICIAL);
  const [eventoEditado, setEventoEditado] = useState(RESERVA_INICIAL);
  const [standNuevo, setStandNuevo] = useState({ nombre: "", precio: "" });
  const [concursoNuevo, setConcursoNuevo] = useState({ nombre: "", descripcion: "", cupo: "" });

  useEffect(() => {
    if (!eventoSeleccionado && eventos.length) setEventoSeleccionado(String(eventos[0].id));
  }, [eventoSeleccionado, eventos]);

  useEffect(() => {
    const evento = eventos.find((item) => String(item.id) === eventoSeleccionado);
    if (evento) {
      setEventoEditado({
        nombre: evento.nombre,
        tematica: evento.tematica ?? "",
        fecha: evento.fecha,
        horario: evento.horario ?? "",
        ubicacion: evento.ubicacion ?? "",
        descripcion: evento.descripcion ?? "",
      });
    }
  }, [eventoSeleccionado, eventos]);

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

  async function enviarFormulario(tipo, evento) {
    evento.preventDefault();
    setEnviando(tipo);
    try {
      if (tipo === "evento") {
        await createEvento(eventoNuevo);
        setEventoNuevo(RESERVA_INICIAL);
        await recargarEventos();
        exito("Evento creado.");
      } else if (tipo === "stand") {
        await createStand(eventoSeleccionado, standNuevo);
        setStandNuevo({ nombre: "", precio: "" });
        await recargarEventos();
        exito("Stand agregado al evento.");
      } else if (tipo === "concurso") {
        await createConcurso(eventoSeleccionado, concursoNuevo);
        setConcursoNuevo({ nombre: "", descripcion: "", cupo: "" });
        await recargarEventos();
        exito("Concurso agregado al evento.");
      } else {
        await updateEvento(eventoSeleccionado, eventoEditado);
        await recargarEventos();
        exito("Datos del evento actualizados.");
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
              <p>{reserva.evento.nombre} · {reserva.stand?.nombre} · {reserva.evento.fecha}</p>
              <span className={`estado-reserva estado-reserva--${reserva.estado}`}>{reserva.estado}</span>
            </div>
            {reserva.estado === "pendiente" && (
              <div className="tabla__acciones">
                <Boton onClick={() => resolver(reserva, "confirmada")} disabled={enProceso === reserva.id}>
                  {enProceso === reserva.id ? "Guardando..." : "Confirmar"}
                </Boton>
                <Boton variante="peligro" onClick={() => resolver(reserva, "cancelada")} disabled={enProceso === reserva.id}>
                  Rechazar y liberar mesa
                </Boton>
              </div>
            )}
          </article>
        ))}
      </section>

      <section className="panel-participacion" aria-labelledby="catalogo-titulo">
        <h2 id="catalogo-titulo" className="titulo-secundario">Eventos y actividades</h2>
        <form className="formulario formulario--admin" onSubmit={(evento) => enviarFormulario("evento", evento)}>
          <h3>Crear evento</h3>
          <CampoFormulario id="eventoNombre" name="nombre" etiqueta="Nombre" type="text" value={eventoNuevo.nombre} onChange={(e) => setEventoNuevo({ ...eventoNuevo, nombre: e.target.value })} required />
          <CampoFormulario id="eventoTematica" name="tematica" etiqueta="Temática" type="text" value={eventoNuevo.tematica} onChange={(e) => setEventoNuevo({ ...eventoNuevo, tematica: e.target.value })} required />
          <CampoFormulario id="eventoFecha" name="fecha" etiqueta="Fecha" type="date" value={eventoNuevo.fecha} onChange={(e) => setEventoNuevo({ ...eventoNuevo, fecha: e.target.value })} required />
          <CampoFormulario id="eventoHorario" name="horario" etiqueta="Horario" type="text" value={eventoNuevo.horario} onChange={(e) => setEventoNuevo({ ...eventoNuevo, horario: e.target.value })} />
          <CampoFormulario id="eventoUbicacion" name="ubicacion" etiqueta="Ubicación" type="text" value={eventoNuevo.ubicacion} onChange={(e) => setEventoNuevo({ ...eventoNuevo, ubicacion: e.target.value })} />
          <CampoFormulario id="eventoDescripcion" name="descripcion" etiqueta="Descripción" type="text" value={eventoNuevo.descripcion} onChange={(e) => setEventoNuevo({ ...eventoNuevo, descripcion: e.target.value })} />
          <Boton type="submit" disabled={enviando === "evento"}>{enviando === "evento" ? "Guardando..." : "Crear evento"}</Boton>
        </form>

        <div className="campo">
          <label className="campo__etiqueta" htmlFor="eventoAdministracion">Evento para agregar stands o concursos</label>
          <select
            id="eventoAdministracion"
            className="campo__input"
            value={eventoSeleccionado}
            onChange={(evento) => setEventoSeleccionado(evento.target.value)}
            disabled={cargandoEventos || eventos.length === 0}
          >
            {eventos.map((evento) => <option value={evento.id} key={evento.id}>{evento.nombre} · {evento.fecha}</option>)}
          </select>
        </div>

        <form className="formulario formulario--admin" onSubmit={(evento) => enviarFormulario("editar-evento", evento)}>
          <h3>Datos del evento seleccionado</h3>
          <CampoFormulario id="editarEventoNombre" name="nombre" etiqueta="Nombre" type="text" value={eventoEditado.nombre} onChange={(e) => setEventoEditado({ ...eventoEditado, nombre: e.target.value })} required />
          <CampoFormulario id="editarEventoTematica" name="tematica" etiqueta="Temática" type="text" value={eventoEditado.tematica} onChange={(e) => setEventoEditado({ ...eventoEditado, tematica: e.target.value })} required />
          <CampoFormulario id="editarEventoFecha" name="fecha" etiqueta="Fecha" type="date" value={eventoEditado.fecha} onChange={(e) => setEventoEditado({ ...eventoEditado, fecha: e.target.value })} required />
          <CampoFormulario id="editarEventoHorario" name="horario" etiqueta="Horario" type="text" value={eventoEditado.horario} onChange={(e) => setEventoEditado({ ...eventoEditado, horario: e.target.value })} />
          <CampoFormulario id="editarEventoUbicacion" name="ubicacion" etiqueta="Ubicación" type="text" value={eventoEditado.ubicacion} onChange={(e) => setEventoEditado({ ...eventoEditado, ubicacion: e.target.value })} />
          <CampoFormulario id="editarEventoDescripcion" name="descripcion" etiqueta="Descripción" type="text" value={eventoEditado.descripcion} onChange={(e) => setEventoEditado({ ...eventoEditado, descripcion: e.target.value })} />
          <Boton type="submit" disabled={!eventoSeleccionado || enviando === "editar-evento"}>
            {enviando === "editar-evento" ? "Guardando..." : "Actualizar evento"}
          </Boton>
        </form>

        <div className="catalogo-formularios">
          <form className="formulario formulario--admin" onSubmit={(evento) => enviarFormulario("stand", evento)}>
            <h3>Agregar stand</h3>
            <CampoFormulario id="standNombre" name="nombre" etiqueta="Nombre de la mesa" type="text" value={standNuevo.nombre} onChange={(e) => setStandNuevo({ ...standNuevo, nombre: e.target.value })} required />
            <CampoFormulario id="standPrecio" name="precio" etiqueta="Precio (opcional)" type="number" min="0" step="0.01" value={standNuevo.precio} onChange={(e) => setStandNuevo({ ...standNuevo, precio: e.target.value })} />
            <Boton type="submit" disabled={!eventoSeleccionado || enviando === "stand"}>{enviando === "stand" ? "Guardando..." : "Agregar stand"}</Boton>
          </form>
          <form className="formulario formulario--admin" onSubmit={(evento) => enviarFormulario("concurso", evento)}>
            <h3>Agregar concurso</h3>
            <CampoFormulario id="concursoNombre" name="nombre" etiqueta="Nombre del concurso" type="text" value={concursoNuevo.nombre} onChange={(e) => setConcursoNuevo({ ...concursoNuevo, nombre: e.target.value })} required />
            <CampoFormulario id="concursoDescripcion" name="descripcion" etiqueta="Descripción" type="text" value={concursoNuevo.descripcion} onChange={(e) => setConcursoNuevo({ ...concursoNuevo, descripcion: e.target.value })} />
            <CampoFormulario id="concursoCupo" name="cupo" etiqueta="Cupo" type="number" min="1" step="1" value={concursoNuevo.cupo} onChange={(e) => setConcursoNuevo({ ...concursoNuevo, cupo: e.target.value })} required />
            <Boton type="submit" disabled={!eventoSeleccionado || enviando === "concurso"}>{enviando === "concurso" ? "Guardando..." : "Agregar concurso"}</Boton>
          </form>
        </div>
      </section>
    </PaginaParticipacion>
  );
}

export default Admin;
