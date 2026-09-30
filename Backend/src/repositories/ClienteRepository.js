import Cliente from '../models/Cliente.js';

class ClienteRepository {
    constructor() {
        this.clientes = [];
        this.currentId = 1;

        this.seedInitialData();
    }

    seedInitialData() {
        this.create({
            nombre: "pepe pepito",
            email: "amalia@gmail.com",
            contrasena: "securePassword123",
            fechaNacimiento: "1998-05-15"
        });
        this.create({
            nombre: "juan perez",
            email: "juan@example.com",
            contrasena: "pass1234",
            fechaNacimiento: "1994-11-23"
        });
    }

    findAll() {
        return this.clientes;
    }

    findById(id) {
        const parsedId = parseInt(id, 10);
        return this.clientes.find(cliente => cliente.id === parsedId);
    }

    findByEmail(email) {
        if (!email) return undefined;
        return this.clientes.find(cliente => cliente.email.toLowerCase() === email.toLowerCase());
    }

    create(clienteData) {
        const id = this.currentId++;
        const { nombre, email, contrasena, fechaNacimiento } = clienteData;
        const newCliente = new Cliente(id, nombre, email, contrasena, fechaNacimiento);
        this.clientes.push(newCliente);
        return newCliente;
    }

    update(id, clienteData) {
        const parsedId = parseInt(id, 10);
        const index = this.clientes.findIndex(cliente => cliente.id === parsedId);
        if (index === -1) {
            return null;
        }

        const existingCliente = this.clientes[index];

        if (clienteData.nombre !== undefined) existingCliente.nombre = clienteData.nombre;
        if (clienteData.email !== undefined) existingCliente.email = clienteData.email;
        if (clienteData.contrasena !== undefined) existingCliente.contrasena = clienteData.contrasena;
        if (clienteData.fechaNacimiento !== undefined) existingCliente.fechaNacimiento = clienteData.fechaNacimiento;
        if (clienteData.concursosInscriptos !== undefined) existingCliente.concursosInscriptos = clienteData.concursosInscriptos;

        return existingCliente;
    }

    delete(id) {
        const parsedId = parseInt(id, 10);
        const index = this.clientes.findIndex(cliente => cliente.id === parsedId);
        if (index === -1) {
            return false;
        }
        this.clientes.splice(index, 1);
        return true;
    }
}

export default new ClienteRepository();
