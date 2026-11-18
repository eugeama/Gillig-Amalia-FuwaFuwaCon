function AvisoApi({ children }) {
  return (
    <aside className="aviso-api" aria-label="Información importante">
      <strong>Información importante</strong>
      <p>{children}</p>
    </aside>
  );
}

export default AvisoApi;
