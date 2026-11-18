export const estadosReserva = [
  {
    id: "pendiente",
    nombre: "Pendiente",
    descripcion: "El emprendedor solicita la mesa y espera la revisión del administrador.",
  },
  {
    id: "confirmada",
    nombre: "Confirmada",
    descripcion: "El administrador acepta la solicitud y se deben comunicar los datos al emprendedor.",
  },
  {
    id: "cancelada",
    nombre: "Cancelada",
    descripcion: "La solicitud se rechaza o la reserva se cancela dentro del plazo permitido. La mesa se libera.",
  },
  {
    id: "finalizada",
    nombre: "Finalizada",
    descripcion: "El evento terminó y la mesa vuelve a quedar disponible para otros eventos.",
  },
];
