import { Router } from 'express';
import ApiResponse from '../responses/ApiResponse.js';
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

router.get('/', manejar((req, res) => res.json(ApiResponse.success(SistemaService.listarEventos()))));
router.get('/:id/stands', manejar((req, res) => res.json(
    ApiResponse.success(SistemaService.listarStands(req.params.id, req.query.fecha))
)));
router.get('/:id/concursos', manejar((req, res) => res.json(ApiResponse.success(SistemaService.listarConcursos(req.params.id, req.query.fecha)))));

export default router;
