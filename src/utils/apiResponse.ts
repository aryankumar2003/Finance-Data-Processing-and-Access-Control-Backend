export const apiResponse = {
    success<T>(data: T, message?: string) {
        return {
            success: true,
            message: message ?? 'OK',
            data,
        }
    },

    error(message: string, details?: { field: string; message: string }[]) {
        return {
            success: false,
            error: {
                message,
                ...(details && { details }),
            },
        }
    },
}