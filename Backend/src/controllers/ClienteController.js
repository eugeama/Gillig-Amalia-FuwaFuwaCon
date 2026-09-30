import ClienteService from '../services/ClienteService.js';
import ApiResponse from '../responses/ApiResponse.js';

class ClienteController {
    getAll = (req, res, next) => {
        try {
            const clientes = ClienteService.getAllClientes();
            return res.status(200).json(ApiResponse.success(clientes));
        } catch (error) {
            next(error);
        }
    };

    getById = (req, res, next) => {
        try {
            const { id } = req.params;
            const cliente = ClienteService.getClienteById(id);
            return res.status(200).json(ApiResponse.success(cliente));
        } catch (error) {
            next(error);
        }
    };

    create = (req, res, next) => {
        try {
            const newCliente = ClienteService.createCliente(req.body);
            return res.status(201).json(ApiResponse.success(newCliente));
        } catch (error) {
            next(error);
        }
    };
    
    update = (req, res, next) => {
        try {
            const { id } = req.params;
            const updatedCliente = ClienteService.updateCliente(id, req.body);
            return res.status(200).json(ApiResponse.success(updatedCliente));
        } catch (error) {
            next(error);
        }
    };

    delete = (req, res, next) => {
        try {
            const { id } = req.params;
            const result = ClienteService.deleteCliente(id);
            return res.status(200).json(ApiResponse.success(result));
        } catch (error) {
            next(error);
        }
    };
}

export default new ClienteController();
