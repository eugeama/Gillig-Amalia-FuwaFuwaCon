import Usuario from './Usuario';

class Administrador extends Usuario {
    constructor(id, nombre, email, contrasena, fechaNacimiento) {
        super(id, nombre, email, contrasena, fechaNacimiento);
    }
}

export default Administrador;
