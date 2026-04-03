import swaggerJsdoc from 'swagger-jsdoc'

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Zorvyn Finance API',
            version: '1.0.0',
            description:
                'Finance Data Processing and Access Control Backend — REST API documentation',
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development server',
            },
            {
                url: 'https://zorvyn-finance-backend.onrender.com',
                description: 'Production server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                ApiSuccess: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        message: { type: 'string', example: 'OK' },
                        data: { type: 'object' },
                    },
                },
                ApiError: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        error: {
                            type: 'object',
                            properties: {
                                message: { type: 'string' },
                                details: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            field: { type: 'string' },
                                            message: { type: 'string' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: 'clx1234abcd' },
                        name: { type: 'string', example: 'John Doe' },
                        email: { type: 'string', example: 'john@example.com' },
                        role: { type: 'string', enum: ['VIEWER', 'ANALYST', 'ADMIN'] },
                        isActive: { type: 'boolean', example: true },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                Transaction: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: 'clx5678efgh' },
                        amount: { type: 'number', example: 5000.00 },
                        type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
                        category: { type: 'string', example: 'salary' },
                        date: { type: 'string', format: 'date-time' },
                        notes: { type: 'string', example: 'March salary', nullable: true },
                        isDeleted: { type: 'boolean', example: false },
                        userId: { type: 'string', example: 'clx1234abcd' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                PaginationMeta: {
                    type: 'object',
                    properties: {
                        total: { type: 'integer', example: 42 },
                        page: { type: 'integer', example: 1 },
                        limit: { type: 'integer', example: 20 },
                        totalPages: { type: 'integer', example: 3 },
                    },
                },
                DashboardSummary: {
                    type: 'object',
                    properties: {
                        totalIncome: { type: 'number', example: 85000.00 },
                        totalExpenses: { type: 'number', example: 62000.00 },
                        netBalance: { type: 'number', example: 23000.00 },
                        transactionCount: { type: 'integer', example: 142 },
                    },
                },
                CategoryTotal: {
                    type: 'object',
                    properties: {
                        category: { type: 'string', example: 'salary' },
                        type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
                        total: { type: 'number', example: 60000.00 },
                        count: { type: 'integer', example: 6 },
                    },
                },
                TrendEntry: {
                    type: 'object',
                    properties: {
                        label: { type: 'string', example: '2024-01' },
                        income: { type: 'number', example: 14000.00 },
                        expenses: { type: 'number', example: 10500.00 },
                        net: { type: 'number', example: 3500.00 },
                    },
                },
            },
        },
        security: [{ bearerAuth: [] }],
    },
    apis: ['./src/modules/**/*.router.ts'],
}

export const swaggerSpec = swaggerJsdoc(options)