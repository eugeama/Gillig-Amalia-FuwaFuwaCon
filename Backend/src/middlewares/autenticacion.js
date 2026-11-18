import { ForbiddenError } from '../exceptions/AppError.js';
import SistemaService from '../services/SistemaService.js';

const COOKIE_SESION = 'fuwafuwacon_session';

function leerCookie(req, nombre) {
    const cookie = req.headers.cookie
        ?.split(';')
        .map((parte) => parte.trim())
        .find((parte) => parte.startsWith(`${nombre}=`));
    return cookie ? decodeURIComponent(cookie.slice(nombre.length + 1)) : null;
}

export function obtenerToken(req) {
    return leerCookie(req, COOKIE_SESION);
}

export function establecerCookieSesion(res, token) {
    const seguro = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    res.setHeader(
        'Set-Cookie',
        `${COOKIE_SESION}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800${seguro}`
    );
}

export function limpiarCookieSesion(res) {
    res.setHeader('Set-Cookie', `${COOKIE_SESION}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
}

export function requiereSesion(req, res, next) {
    const token = obtenerToken(req);
    const usuario = SistemaService.obtenerSesion(token);
    if (!usuario) {
        return res.status(401).json({ success: false, message: 'Iniciá sesión para continuar' });
    }
    req.usuario = usuario;
    req.tokenSesion = token;
    return next();
}

export function requiereTipo(...tipos) {
    return (req, res, next) => {
        if (!req.usuario || !tipos.includes(req.usuario.tipo)) {
            return next(new ForbiddenError('No tenés permiso para realizar esta acción'));
        }
        return next();
    };
}

export { COOKIE_SESION };
