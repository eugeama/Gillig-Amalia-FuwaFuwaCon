import AppError from '../exceptions/AppError.js';
import ApiResponse from '../responses/ApiResponse.js';

export const errorHandler = (err, req, res, next) => {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json(ApiResponse.error(err.message));
    }

    console.error("Unhandled Error Details:", err);
    return res.status(500).json(ApiResponse.error("Ocurrió un error interno en el servidor."));
};

export default errorHandler;
