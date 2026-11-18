function PaginaParticipacion({ titulo, descripcion, children }) {
  return (
    <section className="pagina-participacion" aria-labelledby="participacion-titulo">
      <header className="pagina-participacion__cabecera">
        <h1 id="participacion-titulo" className="titulo-principal">{titulo}</h1>
        <p className="texto-centrado">{descripcion}</p>
      </header>
      {children}
    </section>
  );
}

export default PaginaParticipacion;
