function Cargando({ mensaje = "Cargando..." }) {
  return (
    <p className="cargando" role="status">
      <span className="cargando__spinner" aria-hidden="true"></span>
      {mensaje}
    </p>
  );
}

export default Cargando;
