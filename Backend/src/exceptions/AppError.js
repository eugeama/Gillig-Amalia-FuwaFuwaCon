class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class BadRequestError extends AppError {
    constructor(message) {
        super(message, 400);
    }
}

export class NotFoundError extends AppError {
    constructor(message) {
        super(message, 404);
    }
}

export class ConflictError extends AppError {
    constructor(message) {
        super(message, 409);
    }
}

export class ForbiddenError extends AppError {
    constructor(message) {
        super(message, 403);
    }
}

export class AuthenticationError extends AppError {
    constructor(message) {
        super(message, 401);
    }
}

export class ServiceUnavailableError extends AppError {
    constructor(message) {
        super(message, 503);
    }
}

export default AppError;
