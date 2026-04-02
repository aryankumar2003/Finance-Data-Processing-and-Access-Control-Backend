export class AppError extends Error {
    constructor(
        public message: string,
        public statusCode: number = 500,
        public details?: { field: string; message: string }[]
    ) {
        super(message)
        this.name = 'AppError'
        Object.setPrototypeOf(this, AppError.prototype)
    }
}