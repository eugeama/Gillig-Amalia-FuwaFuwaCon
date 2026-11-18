import Boton from "../components/Boton";
import Cargando from "../components/Cargando";
import PaginaParticipacion from "../components/PaginaParticipacion";
import useEventos from "../hooks/useEventos";

const FECHA_FORMATO = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function Eventos({ onNavegar }) {
  const { eventos, cargando, recargar } = useEventos();
  const hoy = new Date().toISOString().slice(0, 10);
  const proximosEventos = eventos
    .filter((evento) => evento.fecha >= hoy)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  return (
    <PaginaParticipacion
      titulo="Próximos eventos"
      descripcion="Consultá las fechas y temáticas de la FuwaFuwaCon y elegí cómo participar."
    >
      {cargando && <Cargando mensaje="Cargando eventos..." />}
      {!cargando && proximosEventos.length === 0 && (
        <div className="panel-participacion">
          <p>No hay próximos eventos publicados.</p>
          <Boton onClick={recargar}>Volver a cargar</Boton>
        </div>
      )}
      {!cargando && proximosEventos.map((evento) => (
        <article className="panel-participacion evento" key={evento.id}>
          <div className="evento__cabecera">
            <h2 className="titulo-secundario">{evento.nombre}</h2>
            <span className="evento__fecha">
              {FECHA_FORMATO.format(new Date(`${evento.fecha}T12:00:00`))}
            </span>
          </div>
          <dl className="evento__datos">
            <div><dt>Temática</dt><dd>{evento.tematica || "A confirmar"}</dd></div>
            <div><dt>Horario</dt><dd>{evento.horario || "A confirmar"}</dd></div>
            <div><dt>Ubicación</dt><dd>{evento.ubicacion || "A confirmar"}</dd></div>
            <div><dt>Stands</dt><dd>{evento.cantidadStands}</dd></div>
            <div><dt>Concursos</dt><dd>{evento.cantidadConcursos}</dd></div>
          </dl>
          {evento.descripcion && <p>{evento.descripcion}</p>}
          <div className="evento__acciones">
            <Boton onClick={() => onNavegar("stands", { eventoId: evento.id })}>Ver stands</Boton>
            <Boton variante="secundario" onClick={() => onNavegar("concursos", { eventoId: evento.id })}>
              Ver concursos
            </Boton>
          </div>
        </article>
      ))}
    </PaginaParticipacion>
  );
}

export default Eventos;
