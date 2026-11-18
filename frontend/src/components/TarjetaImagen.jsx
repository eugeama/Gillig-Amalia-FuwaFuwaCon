import Imagen from "./Imagen";

function TarjetaImagen({ titulo, src }) {
  return (
    <article className="tarjeta">
      <Imagen src={src} alt={titulo} className="tarjeta__imagen" />
      <h4 className="tarjeta__titulo">{titulo}</h4>
    </article>
  );
}

export default TarjetaImagen;
