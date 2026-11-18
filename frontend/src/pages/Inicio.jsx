import Boton from "../components/Boton";
import Carrusel from "../components/Carrusel";
import Imagen from "../components/Imagen";
import SeccionTarjetas from "../components/SeccionTarjetas";
import { dondeEncontrarnos, novedades, queEncontrar, quienesSomos } from "../utils/contenido";
import useEventos from "../hooks/useEventos";

const FORMATO_FECHA = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function Inicio({ onNavegar }) {
  const { eventos, cargando } = useEventos();
  const proximo = eventos
    .filter((evento) => evento.fecha >= new Date().toISOString().slice(0, 10))
    .sort((a, b) => a.fecha.localeCompare(b.fecha))[0];

  return (
    <>
      <section id="fechas" className="bienvenida" aria-labelledby="bienvenida-titulo">
        <h1 id="bienvenida-titulo" className="titulo-principal">
          ¡Bienvenidos a la FuwaFuwaCon!
        </h1>
        {(cargando || proximo) && (
          <p className="bienvenida__fecha">
            Próximas fechas: {cargando
              ? "consultando..."
              : FORMATO_FECHA.format(new Date(`${proximo.fecha}T12:00:00`))}
          </p>
        )}
        <Carrusel diapositivas={novedades} onVerMas={() => onNavegar("eventos")} />
      </section>

      <section id="sobre-nosotros" className="sobre-nosotros" aria-labelledby="quienes-titulo">
        <h2 id="quienes-titulo" className="titulo-principal">
          {quienesSomos.titulo}
        </h2>
        <p className="texto-centrado">{quienesSomos.textoSuperior}</p>
        <div className="sobre-nosotros__imagenes">
          {quienesSomos.imagenes.map((foto) => (
            <Imagen key={foto.alt} src={foto.src} alt={foto.alt} />
          ))}
        </div>
        <p className="texto-centrado">{quienesSomos.textoInferior}</p>

        <h2 className="titulo-principal">{dondeEncontrarnos.titulo}</h2>
        <div className="sobre-nosotros__mapa">
          <Imagen src={dondeEncontrarnos.imagen} alt="Mapa de la ubicación del evento" />
          <Boton href={dondeEncontrarnos.mapa}>Ver en Maps</Boton>
        </div>
      </section>

      <section id="productos" className="productos" aria-labelledby="productos-titulo">
        <h2 id="productos-titulo" className="titulo-principal">
          {queEncontrar.titulo}
        </h2>
        <p className="texto-centrado">{queEncontrar.texto}</p>
        {queEncontrar.categorias.map((categoria) => (
          <SeccionTarjetas
            key={categoria.id}
            id={categoria.id}
            titulo={categoria.titulo}
            texto={categoria.texto}
            items={categoria.items}
            accion={categoria.accion && {
              texto: categoria.accion.texto,
              onClick: () => onNavegar(categoria.accion.pagina),
            }}
          />
        ))}
      </section>
    </>
  );
}

export default Inicio;
