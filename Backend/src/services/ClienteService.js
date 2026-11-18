import SistemaService from './SistemaService.js';
import { NotFoundError } from '../exceptions/AppError.js';

class ClienteService {
    getAllClientes() {
        return SistemaService.listarUsuarios().filter((usuario) => usuario.tipo === 'cliente');
    }

    getClienteById(id) {
        const cliente = this.getAllClientes().find((usuario) => usuario.id === Number(id));
        if (!cliente) {
            throw new NotFoundError('El cliente no existe');
        }
        return cliente;
    }

    createCliente(clienteData) {
        return SistemaService.crearCliente(clienteData);
    }

    updateCliente(id, clienteData) {
        const existing = this.getClienteById(id);
        return SistemaService.actualizarUsuario(existing.id, clienteData);
    }

    deleteCliente(id) {
        const cliente = this.getClienteById(id);
        SistemaService.eliminarUsuario(cliente.id);
        return { message: "Cliente eliminado correctamente" };
    }
}

export default new ClienteService();
