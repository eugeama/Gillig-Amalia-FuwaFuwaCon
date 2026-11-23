const DIA_MES = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long" });
const MES_ANIO = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" });

export function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

export function fechasVigentes(evento) {
  return (evento?.fechas ?? []).filter((fecha) => fecha >= hoyISO()).sort();
}

export function proximoEvento(eventos) {
  return eventos
    .filter((evento) => fechasVigentes(evento).length > 0)
    .sort((a, b) => fechasVigentes(a)[0].localeCompare(fechasVigentes(b)[0]))[0];
}

export function formatearDiaMes(fecha) {
  return DIA_MES.format(new Date(`${fecha}T12:00:00`));
}

export function formatearMes(mes) {
  return MES_ANIO.format(new Date(`${mes}-01T12:00:00`));
}
