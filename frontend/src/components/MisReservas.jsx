import { useCallback, useEffect, useState } from "react";
import Boton from "./Boton";
import Cargando from "./Cargando";
import DialogoConfirmacion from "./DialogoConfirmacion";
import { eliminarMiReserva, getMisReservas } from "../services/reservaService";
import { useNotificaciones } from "../utils/notificaciones";
import { formatearFecha } from "../utils/formatearFecha";

const ETIQUETAS = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  cancelada: "Cancelada",
  finalizada: "Finalizada",
};

function MisReservas({ onNavegar }) {
  const { exito, error } = useNotificaciones();
  const [reservas, setReservas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [falloCarga, setFalloCarga] = useState(false);
  const [reservaSeleccionada, setReservaSeleccionada] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setFalloCarga(false);
    try {
      setReservas(await getMisReservas());
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
    if (!reservaSeleccionada) return;
    setEliminando(true);
    try {
      await eliminarMiReserva(reservaSeleccionada.id);
      setReservaSeleccionada(null);
      exito("La reserva se eliminó y el stand quedó disponible.");
      await cargar();
    } catch (err) {
      error(err.message);
    } finally {
      setEliminando(false);
    }
  }

  return (
    <section className="panel-participacion" aria-labelledby="mis-reservas-titulo">
      <h2 id="mis-reservas-titulo" className="titulo-secundario">Mis reservas</h2>
      {cargando && <Cargando mensaje="Cargando reservas..." />}
      {!cargando && falloCarga && (
        <div>
          <p>No se pudieron cargar tus reservas.</p>
          <Boton onClick={cargar}>Reintentar</Boton>
        </div>
      )}
      {!cargando && !falloCarga && reservas.length === 0 && (
        <div>
          <p>Todavía no tenés solicitudes de mesa.</p>
          <Boton onClick={() => onNavegar("stands")}>Consultar stands</Boton>
        </div>
      )}
      {!cargando && !falloCarga && reservas.map((reserva) => (
        <article className="reserva-card" key={reserva.id}>
          <div className="evento__cabecera">
            <h3 className="titulo-secundario">{reserva.evento.nombre}</h3>
            <span className={`estado-reserva estado-reserva--${reserva.estado}`}>
              {ETIQUETAS[reserva.estado] ?? reserva.estado}
            </span>
          </div>
          <dl className="evento__datos">
            <div><dt>Fecha del evento</dt><dd>{formatearFecha(reserva.evento.fecha)}</dd></div>
            <div><dt>Horario</dt><dd>{reserva.evento.horario}</dd></div>
            <div><dt>Ubicación</dt><dd>{reserva.evento.ubicacion}</dd></div>
            <div><dt>Mesa</dt><dd>{reserva.stand?.nombre ?? "No disponible"}</dd></div>
            {reserva.stand?.precio != null && (
              <div><dt>Precio</dt><dd>${reserva.stand.precio}</dd></div>
            )}
            <div><dt>Solicitud</dt><dd>{new Date(reserva.fechaSolicitud).toLocaleString("es-AR")}</dd></div>
          </dl>
          {reserva.estado === "pendiente" && (
            <p>La solicitud espera la revisión de administración.</p>
          )}
          {reserva.estado === "confirmada" && (
            <p>Tu mesa está confirmada. Revisá los datos del evento antes de asistir.</p>
          )}
          {reserva.estado === "confirmada" && (
            <p>Contáctate con FuwaFuwaCon en Instagram para recibir instrucciones y pagar tu mesa. El tiempo límite es una semana antes del evento. Si no te contactás, se eliminará tu reserva.</p>
          )}
          {["pendiente", "confirmada"].includes(reserva.estado) && (
            <Boton variante="peligro" onClick={() => setReservaSeleccionada(reserva)}>
              Eliminar reserva
            </Boton>
          )}
        </article>
      ))}
      <DialogoConfirmacion
        abierto={reservaSeleccionada !== null}
        titulo="¿Estás seguro?"
        mensaje={`Se eliminará tu mesa ${reservaSeleccionada?.stand?.nombre ?? ""} para ${reservaSeleccionada?.evento?.nombre ?? ""}.`}
        textoConfirmar="Eliminar reserva"
        textoProcesando="Eliminando..."
        procesando={eliminando}
        onConfirmar={confirmarEliminacion}
        onCancelar={() => setReservaSeleccionada(null)}
      />
    </section>
  );
}

export default MisReservas;
