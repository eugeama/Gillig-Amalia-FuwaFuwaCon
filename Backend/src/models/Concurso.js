class Concurso {
    constructor(id, nombre, cupo, evento) {
        this.id = id;
        this.nombre = nombre;
        this.cupo = cupo;
        this.evento = evento;
        this.inscriptos = [];
    }
}

export default Concurso;
