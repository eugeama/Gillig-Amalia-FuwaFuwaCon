import { contacto } from "../utils/contenido";

function Footer() {
  return (
    <footer className="footer">
      <ul className="footer__redes">
        {contacto.redes.map((red) => (
          <li key={red.nombre}>
            <a href={red.url} target="_blank" rel="noopener noreferrer">
              <img src={red.imagen} alt={red.nombre} className="footer__icono" />
            </a>
          </li>
        ))}
      </ul>
      <p>{contacto.email}</p>
    </footer>
  );
}

export default Footer;
