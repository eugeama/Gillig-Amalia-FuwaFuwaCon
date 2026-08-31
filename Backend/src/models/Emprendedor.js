import Usuario from './Usuario';

class Emprendedor extends Usuario {
    constructor(id, nombre, email, contrasena, fechaNacimiento, nombreEmprendimiento) {
        super(id, nombre, email, contrasena, fechaNacimiento);
        this.nombreEmprendimiento = nombreEmprendimiento;
        this.reservas = [];
    }
}

export default Emprendedor;
