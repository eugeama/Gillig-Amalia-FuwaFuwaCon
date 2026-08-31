class Reserva {
    constructor(id, emprendedor, stand, evento) {
        this.id = id;
        this.fechaSolicitud = new Date();
        this.estado = 'pendiente';
        this.emprendedor = emprendedor;
        this.stand = stand;
        this.evento = evento;
    }
}

export default Reserva;
