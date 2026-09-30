class ApiResponse {
    static success(data = null) {
        return {
            success: true,
            data
        };
    }

    static error(message) {
        return {
            success: false,
            message
        };
    }
}

export default ApiResponse;
