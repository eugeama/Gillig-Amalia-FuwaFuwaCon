import { Router } from 'express';
import ApiResponse from '../responses/ApiResponse.js';
import { requiereSesion, requiereTipo } from '../middlewares/autenticacion.js';
import SistemaService from '../services/SistemaService.js';

const router = Router();

function manejar(accion) {
    return (req, res, next) => {
        try {
            return accion(req, res);
        } catch (error) {
            return next(error);
        }
    };
}

router.use(requiereSesion);
router.get('/mias', manejar((req, res) => res.json(ApiResponse.success(SistemaService.listarReservas(req.usuario.id)))));
router.post('/', requiereTipo('emprendedor'), manejar((req, res) => {
    const reserva = SistemaService.solicitarReserva(req.usuario, req.body ?? {});
    return res.status(201).json(ApiResponse.success(reserva));
}));
router.delete('/:id', manejar((req, res) => res.json(ApiResponse.success(
    SistemaService.cancelarReserva(req.usuario, req.params.id)
))));

export default router;
