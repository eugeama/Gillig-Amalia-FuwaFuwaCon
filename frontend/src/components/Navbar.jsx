import fuwaLogo from "../assets/fotos/fuwalogopqnolopudenecontrar.png";

const ENLACES = [
  { pagina: "inicio", seccion: "fechas", texto: "Próximas fechas" },
  { pagina: "inicio", seccion: "sobre-nosotros", texto: "Sobre nosotros" },
  { pagina: "inicio", seccion: "productos", texto: "Más información" },
  { pagina: "cuenta", seccion: null, texto: "Mi cuenta" },
];

function Navbar({ pagina, onNavegar }) {
  function manejarClick(evento, destino, seccion) {
    evento.preventDefault();
    onNavegar(destino, seccion);
  }

  return (
    <header className="navbar">
      <a className="navbar__logo" href="#fechas" onClick={(e) => manejarClick(e, "inicio", "fechas")}>
        <img src={fuwaLogo} alt="FuwaFuwaCon" className="navbar__logo-imagen" />
      </a>
      <nav aria-label="Principal">
        <ul className="navbar__lista">
          {ENLACES.map((enlace) => (
            <li key={enlace.texto}>
              <a
                className="navbar__enlace"
                href={`#${enlace.seccion ?? enlace.pagina}`}
                aria-current={enlace.seccion === null && pagina === enlace.pagina ? "page" : undefined}
                onClick={(e) => manejarClick(e, enlace.pagina, enlace.seccion)}
              >
                {enlace.texto}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

export default Navbar;
