class Evento {
    constructor(id, nombre, tematica, fecha, horario, descripcion) {
        this.id = id;
        this.nombre = nombre;
        this.tematica = tematica;
        this.fecha = fecha;
        this.horario = horario;
        this.descripcion = descripcion;
        this.stands = [];
        this.concursos = [];
    }
}

export default Evento;
