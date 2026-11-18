import Boton from "./Boton";
import TarjetaImagen from "./TarjetaImagen";

function SeccionTarjetas({ id, titulo, texto, items, accion }) {
  return (
    <section className="seccion-tarjetas" aria-labelledby={`${id}-titulo`}>
      <h3 id={`${id}-titulo`} className="titulo-secundario">
        {titulo}
      </h3>
      <p className="texto-centrado">{texto}</p>
      <div className="tarjetas">
        {items.map((item) => (
          <TarjetaImagen key={item.titulo} titulo={item.titulo} src={item.imagen} />
        ))}
      </div>
      {accion && (
        <div className="seccion-tarjetas__accion">
          <Boton onClick={accion.onClick}>{accion.texto}</Boton>
        </div>
      )}
    </section>
  );
}

export default SeccionTarjetas;
