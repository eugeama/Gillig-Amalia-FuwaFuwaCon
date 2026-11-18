import carrousel1 from "../assets/fotos/carrousel1.png";
import carrousel2 from "../assets/fotos/carrousel2.png";
import carrousel3 from "../assets/fotos/carrousel3.png";
import qs1 from "../assets/fotos/qs1.png";
import qs2 from "../assets/fotos/qs2.png";
import ubicacion from "../assets/fotos/ubicacion.png";
import productos1 from "../assets/fotos/productos1.png";
import productos2 from "../assets/fotos/productos2.png";
import productos3 from "../assets/fotos/productos3.png";
import actividad1 from "../assets/fotos/actividad1.png";
import actividad2 from "../assets/fotos/actividad2.png";
import actividad3 from "../assets/fotos/actividad3.png";
import concurso1 from "../assets/fotos/concurso1.png";
import concurso2 from "../assets/fotos/concurso2.png";
import concurso3 from "../assets/fotos/concurso3.png";
import youtube from "../assets/fotos/youtube.png";
import instagram from "../assets/fotos/instagram.png";
import twitter from "../assets/fotos/twitter.png";
import tiktok from "../assets/fotos/tiktok.png";

export const novedades = [
  {
    id: 1,
    imagen: carrousel1,
    titulo: "Edición creadores latinos",
    texto: "Bienvenidxs a una nueva edición de FuwaFuwa Con, compartamos unos teres, unas cotufitas, unas arepas y un buen alfajor"+
            "En esta edición nos centramos en celebrar y explorar la creatividad hecha en LATAM ⚽"+
            "DOMINGO Y LUNES (FERIADO) 22 Y 23 DE NOVIEMBRE de 12 HS A 19 HS"
  },
  {
    id: 2,
    imagen: carrousel2,
    titulo: "Invitada especial: Yapura Meri",
    texto: "nos acompañará en esta edición como artista invitada el dia LUNES 23 y estará haciendo un PREGUNTAS Y RESPUESTAS en el auditorio 🎉"+
          "También podrás encontrar su stand de merchandising en la Zona de invitadxs 💐",
  },
  {
    id: 3,
    imagen: carrousel3,
    titulo: "ACTIVIDAD: Rolsito",
    texto: "🔮MESAS DE ROL PARA PRINCIPIANTES + JUEGOS EN AUDITORIO ⚔️"+
    "A cargo de @rolcito.para.sobrevivir , un grupo de amigxs llenxs de magia e historias 🌻"+
    "Podés conocerlos en la ZONA DE ACTIVIDADES (Adentro) casi todo el evento, o en sus juegos en el escenario de auditorio a las 15:00hs ☆",
  },
];

export const quienesSomos = {
  titulo: "¿Quiénes somos?",
  textoSuperior: "FuwaFuwaCon es un espacio para encontrarnos, recorrer stands y participar de actividades y concursos. Un evento hecho de fans para fans, donde vas a poder encontrar todo tipo de gente, merch y actividades para conectar con lo que más te gusta.",
  textoInferior: "Podés participar como cliente o como emprendedor. Elegí un evento para conocer su temática y las propuestas disponibles.",
  imagenes: [
    { src: qs1, alt: "Fotografía de quiénes somos 1" },
    { src: qs2, alt: "Fotografía de quiénes somos 2" },
  ],
};

export const dondeEncontrarnos = {
  titulo: "¿Dónde encontrarnos?",
  imagen: ubicacion,
  mapa: "https://maps.app.goo.gl/RiVZ94yNytT7CFRE6",
};

export const queEncontrar = {
  titulo: "¿Qué podés encontrar?",
  texto: "Conocé las distintas formas de participar de la FuwaFuwaCon.",
  categorias: [
    {
      id: "stands",
      titulo: "Productos de stands",
      texto: "Lo que podés encontrar",
      items: [
        { titulo: "stickers", imagen: productos1 },
        { titulo: "llaveros y charms", imagen: productos2 },
        { titulo: "merch multifandom", imagen: productos3 },
      ],
      accion: { texto: "Inscribir tu emprendimiento", pagina: "stands" },
    },
    {
      id: "actividades",
      titulo: "Actividades",
      texto: "Qué podés hacer durante el evento",
      items: [
        { titulo: "Intercambio de photocards", imagen: actividad1 },
        { titulo: "Entrevistas", imagen: actividad2 },
        { titulo: "Karaoke libre", imagen: actividad3 },
      ],
    },
    {
      id: "auditorio",
      titulo: "El auditorio",
      texto: "Todo lo que se puede hacer adentro",
      items: [
        { titulo: "Concurso de cosplay", imagen: concurso1 },
        { titulo: "Bingo", imagen: concurso2 },
        { titulo: "Y más", imagen: concurso3 },
      ],
      accion: { texto: "Ver concursos", pagina: "concursos" },
    },
  ],
};

export const contacto = {
  email: "fuwafuwaconinfo@gmail.com",
  redes: [
    { nombre: "YouTube", url: "https://www.youtube.com/@FuwaFuwaCon/videos", imagen: youtube },
    { nombre: "Instagram", url: "https://www.instagram.com/fuwafuwacon/", imagen: instagram },
    { nombre: "Twitter", url: "https://x.com/FuwaFuwaCon", imagen: twitter },
    { nombre: "TikTok", url: "https://www.tiktok.com/@fuwafuwacon?lang=es-419", imagen: tiktok },
  ],
};
