import { formatearDiaMes } from "../utils/fechas";

function SelectorFechas({ fechas, seleccionada, onCambiar }) {
  return (
    <div className="selector-fechas" role="group" aria-label="Fechas del evento">
      {fechas.map((fecha) => (
        <button
          key={fecha}
          type="button"
          className="selector-fechas__fecha"
          aria-pressed={fecha === seleccionada}
          onClick={() => onCambiar(fecha)}
        >
          {formatearDiaMes(fecha)}
        </button>
      ))}
    </div>
  );
}

export default SelectorFechas;
