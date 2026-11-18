import AppError from '../exceptions/AppError.js';
import ApiResponse from '../responses/ApiResponse.js';

export const errorHandler = (err, req, res, next) => {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json(ApiResponse.error(err.message));
    }

    if (err?.type === 'entity.parse.failed') {
        return res.status(400).json(ApiResponse.error('El cuerpo de la solicitud debe ser JSON válido.'));
    }

    if (err?.type === 'entity.too.large') {
        return res.status(413).json(ApiResponse.error('El cuerpo de la solicitud es demasiado grande.'));
    }

    console.error("Unhandled Error Details:", err);
    return res.status(500).json(ApiResponse.error("Ocurrió un error interno en el servidor."));
};

export default errorHandler;
