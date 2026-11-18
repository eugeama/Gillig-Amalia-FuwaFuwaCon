import { useState } from "react";
import AvisoApi from "../components/AvisoApi";
import Boton from "../components/Boton";
import CampoFormulario from "../components/CampoFormulario";
import MisReservas from "../components/MisReservas";
import PaginaParticipacion from "../components/PaginaParticipacion";
import { useAuth } from "../utils/auth";
import { useNotificaciones } from "../utils/notificaciones";
import { REQUISITO_CONTRASENA, validarAcceso, validarRegistro } from "../utils/validaciones";

const VALORES_INICIALES = {
  nombre: "",
  nombreEmprendimiento: "",
  email: "",
  contrasena: "",
  fechaNacimiento: "",
  tipo: "cliente",
  clave: "",
};

function Cuenta({ onNavegar }) {
  const [modo, setModo] = useState("ingreso");
  const [valores, setValores] = useState(VALORES_INICIALES);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const { usuario, ingresar, registrar, crearAdministrador, salir } = useAuth();
  const { exito, error } = useNotificaciones();
  const registro = modo === "registro";

  function cambiarModo(nuevoModo) {
    setModo(nuevoModo);
    setValores(VALORES_INICIALES);
    setErrores({});
  }

  function cambiarCampo(evento) {
    const { name, value } = evento.target;
    setValores((actuales) => ({ ...actuales, [name]: value }));
    setErrores((actuales) => ({ ...actuales, [name]: undefined }));
  }

  async function enviar(evento) {
    evento.preventDefault();
    const nuevosErrores = registro ? validarRegistro(valores) : modo === "ingreso" ? validarAcceso(valores) : {};

    if (modo === "administrador") {
      if (!valores.nombre.trim()) nuevosErrores.nombre = "El nombre es obligatorio";
      if (!valores.clave) nuevosErrores.clave = "La clave de configuración es obligatoria";
      Object.assign(nuevosErrores, validarAcceso(valores));
      const contraseñaValida = validarRegistro({
        ...valores,
        tipo: "cliente",
        fechaNacimiento: "2000-01-01",
      });
      if (contraseñaValida.contrasena) nuevosErrores.contrasena = contraseñaValida.contrasena;
    }

    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) {
      error("Revisá los campos del formulario.");
      document.getElementById(Object.keys(nuevosErrores)[0])?.focus();
      return;
    }

    setEnviando(true);
    try {
      if (modo === "ingreso") {
        await ingresar({ email: valores.email, contrasena: valores.contrasena });
        exito("Sesión iniciada correctamente");
      } else if (registro) {
        await registrar({
          nombre: valores.nombre.trim(),
          email: valores.email.trim(),
          contrasena: valores.contrasena,
          fechaNacimiento: valores.fechaNacimiento,
          tipo: valores.tipo,
          ...(valores.tipo === "emprendedor"
            ? { nombreEmprendimiento: valores.nombreEmprendimiento.trim() }
            : {}),
        });
        exito("Cuenta creada correctamente");
      } else {
        await crearAdministrador({
          nombre: valores.nombre.trim(),
          email: valores.email.trim(),
          contrasena: valores.contrasena,
          clave: valores.clave,
        });
        exito("Cuenta de administración inicial creada");
      }
      setValores(VALORES_INICIALES);
    } catch (err) {
      error(err.message);
    } finally {
      setEnviando(false);
    }
  }

  async function cerrarSesion() {
    try {
      await salir();
      exito("Sesión cerrada");
    } catch (err) {
      error(err.message);
    }
  }

  if (usuario) {
    return (
      <PaginaParticipacion titulo="Mi cuenta" descripcion="Tu sesión está activa.">
        <section className="panel-participacion">
          <h2 className="titulo-secundario">Datos de la cuenta</h2>
          <dl className="datos-cuenta">
            <div><dt>Nombre</dt><dd>{usuario.nombre}</dd></div>
            <div><dt>Email</dt><dd>{usuario.email}</dd></div>
            <div><dt>Tipo de cuenta</dt><dd>{usuario.tipo}</dd></div>
            {usuario.nombreEmprendimiento && (
              <div><dt>Emprendimiento</dt><dd>{usuario.nombreEmprendimiento}</dd></div>
            )}
          </dl>
          <Boton variante="secundario" onClick={cerrarSesion}>Cerrar sesión</Boton>
        </section>
        {usuario.tipo === "administrador" && (
          <section className="panel-participacion">
            <h2 className="titulo-secundario">Administración</h2>
            <div className="cuenta-opciones">
              <Boton onClick={() => onNavegar("administracion")}>Administración</Boton>
              <Boton variante="secundario" onClick={() => onNavegar("usuarios")}>Usuarios</Boton>
            </div>
          </section>
        )}
        {usuario.tipo === "emprendedor" && <MisReservas onNavegar={onNavegar} />}
      </PaginaParticipacion>
    );
  }

  return (
    <PaginaParticipacion
      titulo="Mi cuenta"
      descripcion="Ingresá con tu cuenta o registrate como cliente o emprendedor."
    >
      <AvisoApi>
        La contraseña se guarda cifrada en el servidor. No compartas la clave de configuración
        del administrador: se usa una sola vez para crear la primera cuenta administrativa.
      </AvisoApi>
      <div className="cuenta-opciones" role="group" aria-label="Elegir formulario">
        <Boton variante={modo === "ingreso" ? "principal" : "secundario"} aria-pressed={modo === "ingreso"} onClick={() => cambiarModo("ingreso")}>
          Iniciar sesión
        </Boton>
        <Boton variante={registro ? "principal" : "secundario"} aria-pressed={registro} onClick={() => cambiarModo("registro")}>
          Registrarme
        </Boton>
        <Boton variante={modo === "administrador" ? "principal" : "secundario"} aria-pressed={modo === "administrador"} onClick={() => cambiarModo("administrador")}>
          Configurar administrador
        </Boton>
      </div>
      <form className="formulario" onSubmit={enviar} noValidate aria-labelledby="cuenta-formulario">
        <h2 id="cuenta-formulario" className="titulo-secundario">
          {modo === "administrador" ? "Primer administrador" : registro ? "Crear cuenta" : "Iniciar sesión"}
        </h2>
        {(registro || modo === "administrador") && (
          <CampoFormulario
            id="nombre"
            etiqueta="Nombre"
            type="text"
            value={valores.nombre}
            error={errores.nombre}
            onChange={cambiarCampo}
            autoComplete="name"
            required
          />
        )}
        {registro && (
          <>
            <div className="campo">
              <label className="campo__etiqueta" htmlFor="tipo">Tipo de cuenta</label>
              <select id="tipo" name="tipo" className="campo__input" value={valores.tipo} onChange={cambiarCampo} required>
                <option value="cliente">Cliente</option>
                <option value="emprendedor">Emprendedor</option>
              </select>
            </div>
            {valores.tipo === "emprendedor" && (
              <CampoFormulario
                id="nombreEmprendimiento"
                etiqueta="Nombre del emprendimiento"
                type="text"
                value={valores.nombreEmprendimiento}
                error={errores.nombreEmprendimiento}
                onChange={cambiarCampo}
                required
              />
            )}
          </>
        )}
        <CampoFormulario
          id="email"
          etiqueta="Email"
          type="email"
          value={valores.email}
          error={errores.email}
          onChange={cambiarCampo}
          autoComplete="email"
          required
        />
        <CampoFormulario
          id="contrasena"
          etiqueta="Contraseña"
          type="password"
          value={valores.contrasena}
          error={errores.contrasena}
          onChange={cambiarCampo}
          autoComplete={modo === "ingreso" ? "current-password" : "new-password"}
          aria-describedby={
            modo !== "ingreso"
              ? `contrasena-ayuda${errores.contrasena ? " contrasena-error" : ""}`
              : errores.contrasena ? "contrasena-error" : undefined
          }
          required
        />
        {modo !== "ingreso" && (
          <p id="contrasena-ayuda" className="formulario__ayuda">{REQUISITO_CONTRASENA}</p>
        )}
        {registro && (
          <CampoFormulario
            id="fechaNacimiento"
            etiqueta="Fecha de nacimiento"
            type="date"
            value={valores.fechaNacimiento}
            error={errores.fechaNacimiento}
            onChange={cambiarCampo}
            autoComplete="bday"
            required
          />
        )}
        {modo === "administrador" && (
          <CampoFormulario
            id="clave"
            etiqueta="Clave de configuración"
            type="password"
            value={valores.clave}
            error={errores.clave}
            onChange={cambiarCampo}
            autoComplete="off"
            required
          />
        )}
        <Boton type="submit" disabled={enviando}>
          {enviando ? "Procesando..." : modo === "administrador" ? "Crear administrador" : registro ? "Crear cuenta" : "Iniciar sesión"}
        </Boton>
      </form>
    </PaginaParticipacion>
  );
}

export default Cuenta;
