import assert from "node:assert/strict";
import test from "node:test";
import { validarAcceso, validarCliente, validarRegistro } from "./validaciones.js";

const registro = {
  nombre: "Visitante",
  email: "visitante@example.com",
  contrasena: "abcdefgh12!",
  fechaNacimiento: "2000-01-15",
  tipo: "cliente",
};

test("acepta el mínimo de ocho letras, dos números y un signo en ambos perfiles", () => {
  for (const tipo of ["cliente", "emprendedor"]) {
    assert.deepEqual(
      validarRegistro({
        ...registro,
        tipo,
        ...(tipo === "emprendedor" ? { nombreEmprendimiento: "Mi tienda" } : {}),
      }),
      {}
    );
  }
  assert.deepEqual(validarRegistro({ ...registro, contrasena: "ábcdefghi123!!" }), {});
});

test("rechaza contraseñas que no alcanzan cada requisito", () => {
  for (const contrasena of ["abcdefg12!", "abcdefgh1!", "abcdefgh12", "abcdefgh12 "]) {
    assert.ok(validarRegistro({ ...registro, contrasena }).contrasena, contrasena);
  }
});

test("exige todos los datos y no admite registro de administrador", () => {
  const errores = validarRegistro({
    nombre: " ", email: "", contrasena: "", fechaNacimiento: "", tipo: "administrador",
  });
  assert.deepEqual(Object.keys(errores).sort(), ["contrasena", "email", "fechaNacimiento", "nombre", "tipo"]);
  assert.ok(validarRegistro({ ...registro, email: "no-es-email" }).email);
  assert.ok(validarRegistro({ ...registro, tipo: "emprendedor" }).nombreEmprendimiento);
});

test("rechaza fechas inválidas y futuras", () => {
  for (const fechaNacimiento of ["invalida", "2000-02-31", "2999-01-01"]) {
    assert.ok(validarRegistro({ ...registro, fechaNacimiento }).fechaNacimiento);
  }
});

test("no exige la nueva regla al ingresar ni al editar sin cambiar contraseña", () => {
  assert.deepEqual(validarAcceso({ email: registro.email, contrasena: "claveAnterior" }), {});
  assert.deepEqual(validarCliente({ ...registro, contrasena: "" }, { editando: true }), {});
});
