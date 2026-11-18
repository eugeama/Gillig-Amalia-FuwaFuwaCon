import { useEffect, useState } from "react";
import AvisoApi from "../components/AvisoApi";
import Boton from "../components/Boton";
import Cargando from "../components/Cargando";
import PaginaParticipacion from "../components/PaginaParticipacion";
import SelectorEvento from "../components/SelectorEvento";
import { solicitarReserva as crearReserva } from "../services/reservaService";
import { getStands } from "../services/eventoService";
import { useAuth } from "../utils/auth";
import { useNotificaciones } from "../utils/notificaciones";
import useEventos from "../hooks/useEventos";

function Stands({ onNavegar, parametros }) {
  const { usuario } = useAuth();
  const { exito, error } = useNotificaciones();
  const { eventos, cargando: cargandoEventos } = useEventos();
  const [eventoId, setEventoId] = useState(parametros?.eventoId ? String(parametros.eventoId) : "");
  const [stands, setStands] = useState([]);
  const [cargandoStands, setCargandoStands] = useState(false);
  const [falloCarga, setFalloCarga] = useState(false);
  const [standId, setStandId] = useState("");
  const [solicitando, setSolicitando] = useState(false);
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    if (!eventoId && eventos.length > 0) setEventoId(String(eventos[0].id));
  }, [eventoId, eventos]);

  useEffect(() => {
    if (!eventoId) return;
    let activo = true;
    setCargandoStands(true);
    setFalloCarga(false);

    getStands(eventoId)
      .then((resultado) => {
        if (activo) setStands(resultado);
      })
      .catch((err) => {
        if (activo) {
          setFalloCarga(true);
          error(err.message);
        }
      })
      .finally(() => {
        if (activo) setCargandoStands(false);
      });

    return () => {
      activo = false;
    };
  }, [eventoId, error, recarga]);

  async function solicitar() {
    if (!usuario) {
      onNavegar("cuenta");
      return;
    }
    if (usuario.tipo !== "emprendedor") {
      error("Para solicitar una mesa, ingresá con una cuenta de emprendedor.");
      return;
    }
    if (!standId) {
      error("Elegí un stand disponible.");
      return;
    }

    setSolicitando(true);
    try {
      const reserva = await crearReserva({ eventoId: Number(eventoId), standId: Number(standId) });
      exito(`Solicitud ${reserva.id} enviada. Quedó pendiente de revisión.`);
      setStandId("");
      setStands(await getStands(eventoId));
    } catch (err) {
      error(err.message);
    } finally {
      setSolicitando(false);
    }
  }

  const disponibles = stands.filter((stand) => stand.disponible);

  return (
    <PaginaParticipacion
      titulo="Stands del evento"
      descripcion="Consultá la disponibilidad y solicitá una mesa para tu emprendimiento."
    >
      <SelectorEvento
        eventos={eventos}
        eventoSeleccionado={eventoId}
        onCambiar={(id) => {
          setEventoId(id);
          setStandId("");
        }}
        cargando={cargandoEventos}
      />
      {cargandoStands && <Cargando mensaje="Consultando disponibilidad..." />}
      {!cargandoStands && falloCarga && (
        <div className="panel-participacion">
          <p>No se pudo cargar la disponibilidad de los stands.</p>
          <Boton onClick={() => setRecarga((actual) => actual + 1)}>Reintentar</Boton>
        </div>
      )}
      {!cargandoStands && !falloCarga && eventoId && (
        <>
          <section className="panel-participacion" aria-labelledby="stands-participantes">
            <div className="panel-titulo">
              <h2 id="stands-participantes" className="titulo-secundario">Mesas de este evento</h2>
              <p>{disponibles.length} de {stands.length} disponibles</p>
            </div>
            {stands.length === 0 ? (
              <p>No hay stands publicados para este evento.</p>
            ) : (
              <div className="stands-grid">
                {stands.map((stand) => (
                  <article className={`stand-card${stand.disponible ? "" : " stand-card--ocupado"}`} key={stand.id}>
                    <h3>{stand.nombre}</h3>
                    <p>{stand.disponible ? "Disponible" : stand.estado === "pendiente" ? "Solicitud pendiente" : "Ocupado"}</p>
                    <p>{stand.precio == null ? "Precio a confirmar" : `$${stand.precio}`}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
          <section className="panel-participacion" aria-labelledby="solicitud-stand">
            <h2 id="solicitud-stand" className="titulo-secundario">Solicitar una mesa</h2>
            <ul className="lista-reglas">
              <li>Solo las cuentas de emprendedor pueden solicitar un stand.</li>
              <li>Se permite una solicitud activa por persona y por evento.</li>
              <li>Una solicitud pendiente también reserva la mesa mientras la revisa administración.</li>
              <li>La mesa vuelve a estar disponible cuando se cancela o se rechaza la solicitud.</li>
            </ul>
            <div className="campo">
              <label className="campo__etiqueta" htmlFor="stand">Mesa disponible</label>
              <select
                id="stand"
                className="campo__input"
                value={standId}
                onChange={(evento) => setStandId(evento.target.value)}
                disabled={!disponibles.length || solicitando}
              >
                <option value="">Elegí una mesa</option>
                {disponibles.map((stand) => (
                  <option key={stand.id} value={stand.id}>
                    {stand.nombre}{stand.precio == null ? "" : ` · $${stand.precio}`}
                  </option>
                ))}
              </select>
            </div>
            {usuario?.tipo === "emprendedor" ? (
              <Boton onClick={solicitar} disabled={solicitando || !disponibles.length}>
                {solicitando ? "Enviando solicitud..." : "Solicitar mesa"}
              </Boton>
            ) : (
              <Boton onClick={solicitar}>
                {usuario ? "Necesitás una cuenta de emprendedor" : "Ingresar para solicitar"}
              </Boton>
            )}
            {disponibles.length === 0 && stands.length > 0 && <p>No quedan mesas disponibles para este evento.</p>}
            <AvisoApi>
              Las solicitudes quedan pendientes; administración las confirma o las rechaza.
              No se puede cancelar durante las 24 horas previas al evento.
            </AvisoApi>
          </section>
        </>
      )}
    </PaginaParticipacion>
  );
}

export default Stands;
