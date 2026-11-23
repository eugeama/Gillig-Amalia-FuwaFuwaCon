class Evento {
    constructor(id, nombre, tematica, mes, fechas, horario, descripcion) {
        this.id = id;
        this.nombre = nombre;
        this.tematica = tematica;
        this.mes = mes;
        this.fechas = fechas;
        this.horario = horario;
        this.descripcion = descripcion;
        this.stands = [];
        this.concursos = [];
    }
}

export default Evento;
