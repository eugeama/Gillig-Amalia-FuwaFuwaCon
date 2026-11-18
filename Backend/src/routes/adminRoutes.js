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

router.use(requiereSesion, requiereTipo('administrador'));
router.get('/reservas', manejar((req, res) => res.json(ApiResponse.success(SistemaService.listarReservasAdministrador()))));
router.patch('/reservas/:id', manejar((req, res) => res.json(ApiResponse.success(
    SistemaService.resolverReserva(req.params.id, req.body?.estado)
))));
router.post('/eventos', manejar((req, res) => res.status(201).json(
    ApiResponse.success(SistemaService.crearEvento(req.body))
)));
router.put('/eventos/:id', manejar((req, res) => res.json(
    ApiResponse.success(SistemaService.actualizarEvento(req.params.id, req.body ?? {}))
)));
router.post('/eventos/:id/stands', manejar((req, res) => res.status(201).json(
    ApiResponse.success(SistemaService.crearStand(req.params.id, req.body))
)));
router.post('/eventos/:id/concursos', manejar((req, res) => res.status(201).json(
    ApiResponse.success(SistemaService.crearConcurso(req.params.id, req.body))
)));
router.get('/usuarios', manejar((req, res) => res.json(ApiResponse.success(SistemaService.listarUsuarios()))));
router.put('/usuarios/:id', manejar((req, res) => res.json(ApiResponse.success(
    SistemaService.actualizarUsuario(req.params.id, req.body ?? {})
))));
router.patch('/usuarios/:id/administrador', manejar((req, res) => res.json(ApiResponse.success(
    SistemaService.asignarAdministrador(req.params.id)
))));
router.delete('/usuarios/:id', manejar((req, res) => {
    SistemaService.eliminarUsuario(req.params.id);
    return res.json(ApiResponse.success({ message: 'Usuario eliminado correctamente' }));
}));

export default router;
