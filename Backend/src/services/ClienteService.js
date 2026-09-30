import ClienteRepository from '../repositories/ClienteRepository.js';
import { Messages } from '../enums/Messages.js';
import { BadRequestError, NotFoundError, ConflictError } from '../exceptions/AppError.js';

class ClienteService {
    getAllClientes() {
        return ClienteRepository.findAll();
    }

    getClienteById(id) {
        const cliente = ClienteRepository.findById(id);
        if (!cliente) {
            throw new NotFoundError(Messages.USER_NOT_FOUND);
        }
        return cliente;
    }

    createCliente(clienteData) {
        const { nombre, email, contrasena } = clienteData;

        if (!nombre || !email || !contrasena) {
            throw new BadRequestError(Messages.INVALID_DATA);
        }

        const existingCliente = ClienteRepository.findByEmail(email);
        if (existingCliente) {
            throw new ConflictError(Messages.DUPLICATED_RESOURCE);
        }

        return ClienteRepository.create(clienteData);
    }

    updateCliente(id, clienteData) {
        const existingCliente = ClienteRepository.findById(id);
        if (!existingCliente) {
            throw new NotFoundError(Messages.USER_NOT_FOUND);
        }

        if (clienteData.email && clienteData.email.toLowerCase() !== existingCliente.email.toLowerCase()) {
            const emailInUse = ClienteRepository.findByEmail(clienteData.email);
            if (emailInUse && emailInUse.id !== existingCliente.id) {
                throw new ConflictError(Messages.DUPLICATED_RESOURCE);
            }
        }

        return ClienteRepository.update(id, clienteData);
    }

    deleteCliente(id) {
        const deleted = ClienteRepository.delete(id);
        if (!deleted) {
            throw new NotFoundError(Messages.USER_NOT_FOUND);
        }
        return { message: "Cliente eliminado correctamente" };
    }
}

export default new ClienteService();
