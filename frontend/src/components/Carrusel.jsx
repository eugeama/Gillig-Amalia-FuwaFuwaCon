import { useState } from "react";
import Boton from "./Boton";
import Imagen from "./Imagen";

function Carrusel({ diapositivas, onVerMas }) {
  const [indice, setIndice] = useState(0);
  const actual = diapositivas[indice];

  function anterior() {
    setIndice((indice - 1 + diapositivas.length) % diapositivas.length);
  }

  function siguiente() {
    setIndice((indice + 1) % diapositivas.length);
  }

  return (
    <div className="carrusel" role="group" aria-roledescription="carrusel" aria-label="Novedades">
      <button type="button" className="carrusel__flecha" onClick={anterior} aria-label="Diapositiva anterior">
        ◀
      </button>

      <div className="carrusel__contenido" aria-live="polite">
        <Imagen src={actual.imagen} alt={`${actual.titulo}: ${actual.descripcion}`} className="carrusel__imagen" />
        <div className="carrusel__detalle">
          <h3 className="carrusel__titulo">{actual.titulo}</h3>
          <p>{actual.texto}</p>
          <Boton onClick={onVerMas}>Ver más</Boton>
        </div>
      </div>

      <button type="button" className="carrusel__flecha" onClick={siguiente} aria-label="Diapositiva siguiente">
        ▶
      </button>

      <div className="carrusel__puntos">
        {diapositivas.map((diapositiva, i) => (
          <button
            key={diapositiva.id}
            type="button"
            className="carrusel__punto"
            onClick={() => setIndice(i)}
            aria-label={`Ir a la diapositiva ${i + 1}`}
            aria-current={i === indice}
          ></button>
        ))}
      </div>
    </div>
  );
}

export default Carrusel;
