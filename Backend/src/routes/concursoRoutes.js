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

router.post('/:id/inscripciones', requiereSesion, requiereTipo('cliente'), manejar((req, res) => (
    res.status(201).json(ApiResponse.success(SistemaService.inscribirEnConcurso(req.usuario, req.params.id, req.body?.fecha)))
)));
router.get('/inscripciones/mias', requiereSesion, requiereTipo('cliente'), manejar((req, res) => (
    res.json(ApiResponse.success(SistemaService.listarInscripciones(req.usuario.id)))
)));
router.delete('/inscripciones/:id', requiereSesion, requiereTipo('cliente'), manejar((req, res) => {
    SistemaService.cancelarInscripcion(req.usuario, req.params.id);
    return res.json(ApiResponse.success({ message: 'Inscripción cancelada correctamente' }));
}));

export default router;
