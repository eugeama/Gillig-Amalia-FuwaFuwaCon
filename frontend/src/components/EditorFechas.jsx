import { useState } from "react";
import Boton from "./Boton";
import { formatearDiaMes } from "../utils/fechas";
import { useNotificaciones } from "../utils/notificaciones";

function EditorFechas({ fechas, onCambiar, id }) {
  const [nueva, setNueva] = useState("");
  const { error } = useNotificaciones();

  function agregar() {
    if (!nueva) {
      error("Elegí una fecha para agregar.");
      return;
    }
    if (fechas.includes(nueva)) {
      error("Esa fecha ya está cargada.");
      return;
    }
    onCambiar([...fechas, nueva].sort());
    setNueva("");
  }

  function quitar(fecha) {
    onCambiar(fechas.filter((item) => item !== fecha));
  }

  return (
    <div className="editor-fechas">
      <div className="campo">
        <label className="campo__etiqueta" htmlFor={id}>Fechas del evento</label>
        <div className="editor-fechas__agregar">
          <input
            id={id}
            className="campo__input"
            type="date"
            value={nueva}
            onChange={(evento) => setNueva(evento.target.value)}
          />
          <Boton variante="secundario" onClick={agregar}>Agregar fecha</Boton>
        </div>
      </div>
      {fechas.length === 0 && <p>Todavía no agregaste fechas.</p>}
      <ul className="editor-fechas__lista">
        {fechas.map((fecha) => (
          <li key={fecha} className="editor-fechas__item">
            <span>{formatearDiaMes(fecha)}</span>
            <Boton variante="secundario" onClick={() => quitar(fecha)} aria-label={`Quitar ${formatearDiaMes(fecha)}`}>
              Quitar
            </Boton>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default EditorFechas;
