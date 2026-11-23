import { useState } from "react";
import Boton from "../components/Boton";
import Cargando from "../components/Cargando";
import PaginaParticipacion from "../components/PaginaParticipacion";
import SelectorFechas from "../components/SelectorFechas";
import useEventos from "../hooks/useEventos";
import { fechasVigentes, formatearMes, proximoEvento } from "../utils/fechas";

function Eventos({ onNavegar, parametros }) {
  const { eventos, cargando } = useEventos();
  const [fechaElegida, setFechaElegida] = useState("");

  const evento = eventos.find((item) => String(item.id) === String(parametros?.eventoId)) ?? proximoEvento(eventos);
  const fechas = fechasVigentes(evento);
  const fecha = fechas.includes(fechaElegida) ? fechaElegida : fechas[0];

  return (
    <PaginaParticipacion
      titulo="Eventos"
      descripcion="Elegí la fecha del evento y conocé sus stands y concursos."
    >
      {cargando && <Cargando mensaje="Cargando eventos..." />}
      {!cargando && !evento && (
        <div className="panel-participacion">
          <p>No hay próximos eventos publicados.</p>
        </div>
      )}
      {!cargando && evento && (
        <article className="evento-tarjeta" aria-labelledby="evento-titulo">
          <header className="evento-tarjeta__cabecera">
            <h2 id="evento-titulo" className="evento-tarjeta__titulo">{evento.nombre}</h2>
            <p>{formatearMes(evento.mes)}</p>
          </header>
          <div className="evento-tarjeta__cuerpo">
            <SelectorFechas fechas={fechas} seleccionada={fecha} onCambiar={setFechaElegida} />
            <dl className="evento-tarjeta__datos">
              <div><dt>Temática</dt><dd>{evento.tematica}</dd></div>
              <div><dt>Horario</dt><dd>{evento.horario}</dd></div>
              <div><dt>Ubicación</dt><dd>{evento.ubicacion}</dd></div>
            </dl>
            <div className="evento-tarjeta__acciones">
              <Boton onClick={() => onNavegar("stands", { eventoId: evento.id, fecha })}>Ver stands</Boton>
              <Boton variante="secundario" onClick={() => onNavegar("concursos", { eventoId: evento.id, fecha })}>
                Ver concursos
              </Boton>
            </div>
          </div>
        </article>
      )}
    </PaginaParticipacion>
  );
}

export default Eventos;
