declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string
                role: 'VIEWER' | 'ANALYST' | 'ADMIN'
            }
        }
    }
}

export { }