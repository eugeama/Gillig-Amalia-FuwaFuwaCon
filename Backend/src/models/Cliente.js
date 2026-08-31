import Usuario from './Usuario';

class Cliente extends Usuario {
    constructor(id, nombre, email, contrasena, fechaNacimiento) {
        super(id, nombre, email, contrasena, fechaNacimiento);
        this.concursosInscriptos = [];
    }
}

export default Cliente;
