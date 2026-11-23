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

router.get('/', manejar((req, res) => res.json(ApiResponse.success(SistemaService.listarNovedades()))));

export default router;
