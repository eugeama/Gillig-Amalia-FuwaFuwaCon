function SelectorEvento({ eventos = [], eventoSeleccionado = "", onCambiar, cargando = false }) {
  return (
    <div className="campo">
      <label className="campo__etiqueta" htmlFor="evento">Evento</label>
      <select
        id="evento"
        className="campo__input"
        value={eventoSeleccionado}
        onChange={(evento) => onCambiar(evento.target.value)}
        disabled={cargando || eventos.length === 0}
      >
        {eventos.length === 0 && <option value="">{cargando ? "Cargando eventos..." : "No hay eventos disponibles"}</option>}
        {eventos.map((item) => (
          <option key={item.id} value={item.id}>
            {item.nombre} · {item.fecha}
          </option>
        ))}
      </select>
    </div>
  );
}

export default SelectorEvento;
