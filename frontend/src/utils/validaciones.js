const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const REQUISITO_CONTRASENA = "Usá al menos ocho letras, dos números y un signo especial.";

export function validarAcceso(valores) {
  const errores = {};

  if (!valores.email.trim()) {
    errores.email = "El email es obligatorio";
  } else if (!EMAIL_REGEX.test(valores.email.trim())) {
    errores.email = "Ingresá un email válido";
  }

  if (!valores.contrasena) {
    errores.contrasena = "La contraseña es obligatoria";
  }

  return errores;
}

export function validarCliente(valores, { editando }) {
  const errores = validarAcceso(valores);

  if (editando && !valores.contrasena) {
    delete errores.contrasena;
  }

  if (!valores.nombre.trim()) {
    errores.nombre = "El nombre es obligatorio";
  }

  if (valores.contrasena) {
    const letras = valores.contrasena.match(/\p{L}/gu) ?? [];
    const numeros = valores.contrasena.match(/[0-9]/g) ?? [];
    const tieneSigno = /[^\p{L}\p{N}\s]/u.test(valores.contrasena);

    if (letras.length < 8 || numeros.length < 2 || !tieneSigno) {
      errores.contrasena = REQUISITO_CONTRASENA;
    }
  }

  const fecha = new Date(`${valores.fechaNacimiento}T00:00:00`);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  if (!valores.fechaNacimiento) {
    errores.fechaNacimiento = "La fecha de nacimiento es obligatoria";
  } else if (
    Number.isNaN(fecha.getTime()) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(valores.fechaNacimiento) ||
    fecha.getFullYear() !== Number(valores.fechaNacimiento.slice(0, 4)) ||
    fecha.getMonth() + 1 !== Number(valores.fechaNacimiento.slice(5, 7)) ||
    fecha.getDate() !== Number(valores.fechaNacimiento.slice(8, 10))
  ) {
    errores.fechaNacimiento = "Ingresá una fecha válida";
  } else if (fecha > hoy) {
    errores.fechaNacimiento = "La fecha no puede ser futura";
  }

  return errores;
}

export function validarRegistro(valores) {
  const errores = validarCliente(valores, { editando: false });

  if (!["cliente", "emprendedor"].includes(valores.tipo)) {
    errores.tipo = "Elegí cliente o emprendedor";
  }

  if (valores.tipo === "emprendedor" && !valores.nombreEmprendimiento?.trim()) {
    errores.nombreEmprendimiento = "El nombre del emprendimiento es obligatorio";
  }

  return errores;
}
