import Boton from "./Boton";

const TIPOS = {
  cliente: "Cliente",
  emprendedor: "Emprendedor",
  administrador: "Administrador",
};

function TablaUsuarios({ usuarios, asignando, onAsignarAdministrador }) {
  if (usuarios.length === 0) {
    return <p className="texto-centrado">Todavía no hay usuarios registrados.</p>;
  }

  return (
    <div className="tabla-contenedor">
      <table className="tabla">
        <caption className="solo-lectores">Listado de usuarios</caption>
        <thead>
          <tr>
            <th scope="col">Nombre</th>
            <th scope="col">Email</th>
            <th scope="col">Tipo</th>
            <th scope="col">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((usuario) => (
            <tr key={usuario.id}>
              <td>{usuario.nombre}</td>
              <td>{usuario.email}</td>
              <td>{TIPOS[usuario.tipo] ?? usuario.tipo}</td>
              <td>
                {usuario.tipo !== "administrador" && (
                  <Boton
                    variante="secundario"
                    disabled={asignando}
                    onClick={() => onAsignarAdministrador(usuario)}
                    aria-label={`Hacer administrador a ${usuario.nombre}`}
                  >
                    Hacer administrador
                  </Boton>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TablaUsuarios;
