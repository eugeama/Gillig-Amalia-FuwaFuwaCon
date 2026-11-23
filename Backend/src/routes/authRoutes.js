import { Router } from 'express';
import ApiResponse from '../responses/ApiResponse.js';
import SistemaService from '../services/SistemaService.js';
import {
    establecerCookieSesion,
    limpiarCookieSesion,
    obtenerToken,
    requiereSesion,
} from '../middlewares/autenticacion.js';

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

function responderSesion(res, sesion, status = 200) {
    establecerCookieSesion(res, sesion.token);
    return res.status(status).json(ApiResponse.success(sesion.usuario));
}

router.post('/registro', manejar((req, res) => responderSesion(res, SistemaService.registrar(req.body), 201)));
router.post('/login', manejar((req, res) => responderSesion(res, SistemaService.iniciarSesion(req.body))));
router.get('/me', manejar((req, res) => res.json(ApiResponse.success(
    SistemaService.obtenerSesion(obtenerToken(req))
))));
router.post('/logout', requiereSesion, manejar((req, res) => {
    SistemaService.cerrarSesion(obtenerToken(req));
    limpiarCookieSesion(res);
    return res.json(ApiResponse.success({ message: 'Sesión cerrada' }));
}));

export default router;
