import { useCallback, useEffect, useMemo, useState } from "react";
import { cerrarSesion, iniciarSesion, obtenerUsuarioActual, registrarUsuario } from "../services/authService";
import { AuthContext } from "../utils/auth";
import { useNotificaciones } from "../utils/notificaciones";

function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);
  const { error } = useNotificaciones();

  const actualizarUsuario = useCallback(async (accion) => {
    const usuarioActual = await accion();
    setUsuario(usuarioActual);
    return usuarioActual;
  }, []);

  useEffect(() => {
    let activo = true;

    obtenerUsuarioActual()
      .then((usuarioActual) => {
        if (activo) setUsuario(usuarioActual);
      })
      .catch((err) => {
        if (activo && err.status !== 401) error(err.message);
      })
      .finally(() => {
        if (activo) setCargandoSesion(false);
      });

    return () => {
      activo = false;
    };
  }, [error]);

  const valor = useMemo(() => ({
    usuario,
    cargandoSesion,
    ingresar: (datos) => actualizarUsuario(() => iniciarSesion(datos)),
    registrar: (datos) => actualizarUsuario(() => registrarUsuario(datos)),
    salir: async () => {
      await cerrarSesion();
      setUsuario(null);
    },
  }), [actualizarUsuario, cargandoSesion, usuario]);

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
