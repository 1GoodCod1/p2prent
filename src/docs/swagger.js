import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: '🏠 RentShare API',
            version: '2.0.0',
            description: `
# 🚀 RentShare - P2P Rental Platform API

**Complete API documentation for RentShare platform**

## 📋 Platform Overview
RentShare is a peer-to-peer rental marketplace platform connecting owners with renters. This API provides full functionality for the platform.

### 🏆 Core Features
| Feature | Status | Description |
|---------|--------|-------------|
| ✅ User Authentication | Live | JWT-based auth with email verification |
| ✅ Product Management | Live | List, search, and manage rental items |
| ✅ Rental System | Live | Complete booking and payment flow |
| ✅ Payment Processing | Live | Stripe integration |
| ✅ Review System | Live | User and product ratings |
| ✅ VIP System | Live | Product promotion features |
| ✅ Admin Dashboard | Live | Full moderation tools |
| ✅ Real-time Chat | Live | WebSocket communication |
| ✅ Fraud Detection | Live | Risk assessment and monitoring |
| ✅ Dispute Resolution | Live | Conflict management system |

### 💰 Business Rules
| Rule | Value | Description |
|------|-------|-------------|
| Minimum Price | 1 MDL/day | Minimum rental price |
| Maximum Rental | 90 days | Maximum rental duration |
| Platform Commission | 10% | Base commission rate |
| VAT (Moldova) | 20% | Value Added Tax |
| Income Tax | 12% | Income tax for owners |
| Minimum Withdrawal | 100 MDL | Minimum withdrawal amount |
| VIP Commission Discount | 5% | Discount for VIP products |

### 👥 User Roles
| Role | Permissions | Description |
|------|-------------|-------------|
| **USER** | Can rent items | Standard user account |
| **OWNER** | Can list and rent items | Can create products |
| **ADMIN** | Full platform access | System administration |

## 🔐 Authentication
All protected endpoints require JWT authentication in the Authorization header:
\`Authorization: Bearer <your_token>\`

## 📊 Rate Limiting
- **Authentication**: 10 requests/hour
- **API Endpoints**: 100 requests/15 minutes
- **File Uploads**: 20 requests/hour

## 🚨 Error Handling
All errors follow consistent format:
\`\`\`json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "errors": [
    { "field": "email", "message": "Invalid email format" }
  ]
}
\`\`\`

## 📞 Support
For API support: **support@rentshare.com**

---
`,
            contact: {
                name: 'RentShare Support',
                email: 'support@rentshare.com',
                url: 'https://rentshare.com',
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT',
            },
        },
        servers: [
            {
                url: 'http://localhost:3000/api',
                description: '🛠 Development Server',
            },
            {
                url: 'https://api.rentshare.com/api',
                description: '🚀 Production Server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Standard user/owner authentication token',
                },
                adminAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Admin access token (requires ADMIN role)',
                },
            },
            schemas: {
                // ============ USER SCHEMAS ============
                User: {
                    type: 'object',
                    required: ['id', 'email', 'firstName', 'lastName', 'role', 'status'],
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                            example: '123e4567-e89b-12d3-a456-426614174000'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'user@example.com'
                        },
                        firstName: {
                            type: 'string',
                            example: 'John'
                        },
                        lastName: {
                            type: 'string',
                            example: 'Doe'
                        },
                        phone: {
                            type: 'string',
                            example: '+37360123456'
                        },
                        avatar: {
                            type: 'string',
                            format: 'url',
                            example: 'https://example.com/avatar.jpg'
                        },
                        bio: {
                            type: 'string',
                            example: 'Experienced photographer and tech enthusiast'
                        },
                        role: {
                            type: 'string',
                            enum: ['USER', 'OWNER', 'ADMIN'],
                            example: 'USER'
                        },
                        status: {
                            type: 'string',
                            enum: ['PENDING', 'ACTIVE', 'SUSPENDED', 'BANNED'],
                            example: 'ACTIVE'
                        },
                        emailVerified: {
                            type: 'boolean',
                            example: true
                        },
                        phoneVerified: {
                            type: 'boolean',
                            example: false
                        },
                        isVerified: {
                            type: 'boolean',
                            example: false
                        },
                        verificationLevel: {
                            type: 'string',
                            enum: ['BASIC', 'VERIFIED', 'PREMIUM'],
                            example: 'BASIC'
                        },
                        rating: {
                            type: 'number',
                            format: 'float',
                            minimum: 0,
                            maximum: 5,
                            example: 4.5
                        },
                        totalReviews: {
                            type: 'integer',
                            example: 10
                        },
                        balance: {
                            type: 'number',
                            format: 'float',
                            example: 1500.50
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        lastSeen: {
                            type: 'string',
                            format: 'date-time'
                        },
                    },
                    example: {
                        id: '123e4567-e89b-12d3-a456-426614174000',
                        email: 'john.doe@example.com',
                        firstName: 'John',
                        lastName: 'Doe',
                        phone: '+37360123456',
                        avatar: 'https://example.com/avatar.jpg',
                        role: 'USER',
                        status: 'ACTIVE',
                        emailVerified: true,
                        rating: 4.5,
                        totalReviews: 12,
                        balance: 1500.50,
                        createdAt: '2024-01-15T10:30:00.000Z',
                        lastSeen: '2024-01-15T14:20:00.000Z'
                    }
                },

                // ============ PRODUCT SCHEMAS ============
                Product: {
                    type: 'object',
                    required: ['id', 'title', 'description', 'pricePerDay', 'status', 'ownerId'],
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid'
                        },
                        title: {
                            type: 'string',
                            example: 'Professional DSLR Camera - Canon EOS R5'
                        },
                        description: {
                            type: 'string',
                            example: 'High-quality mirrorless camera with 45MP sensor, perfect for professional photography and videography. Includes lens, battery, and carrying case.'
                        },
                        categoryId: {
                            type: 'string',
                            format: 'uuid'
                        },
                        ownerId: {
                            type: 'string',
                            format: 'uuid'
                        },
                        pricePerDay: {
                            type: 'number',
                            format: 'float',
                            minimum: 1,
                            example: 100.00
                        },
                        pricePerWeek: {
                            type: 'number',
                            format: 'float',
                            example: 500.00
                        },
                        pricePerMonth: {
                            type: 'number',
                            format: 'float',
                            example: 1800.00
                        },
                        status: {
                            type: 'string',
                            enum: ['DRAFT', 'ACTIVE', 'INACTIVE', 'BANNED', 'ARCHIVED'],
                            example: 'ACTIVE'
                        },
                        condition: {
                            type: 'string',
                            enum: ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR'],
                            example: 'GOOD'
                        },
                        brand: {
                            type: 'string',
                            example: 'Canon'
                        },
                        model: {
                            type: 'string',
                            example: 'EOS R5'
                        },
                        year: {
                            type: 'integer',
                            example: 2022
                        },
                        dimensions: {
                            type: 'string',
                            example: '30×20×15 cm'
                        },
                        weight: {
                            type: 'number',
                            format: 'float',
                            example: 2.5
                        },
                        rules: {
                            type: 'string',
                            example: 'No smoking near the equipment. Handle with care. Must return in same condition.'
                        },
                        deposit: {
                            type: 'number',
                            format: 'float',
                            example: 2000.00
                        },
                        maxRentalDays: {
                            type: 'integer',
                            example: 30
                        },
                        minRentalDays: {
                            type: 'integer',
                            example: 1
                        },
                        views: {
                            type: 'integer',
                            example: 150
                        },
                        rating: {
                            type: 'number',
                            format: 'float',
                            example: 4.8
                        },
                        totalReviews: {
                            type: 'integer',
                            example: 12
                        },
                        vipLevel: {
                            type: 'string',
                            enum: ['NONE', 'STANDARD', 'PREMIUM', 'MAXIMUM'],
                            example: 'STANDARD'
                        },
                        vipExpiresAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                    },
                    example: {
                        id: '123e4567-e89b-12d3-a456-426614174001',
                        title: 'Professional DSLR Camera',
                        description: 'High-quality camera for professional use',
                        ownerId: '123e4567-e89b-12d3-a456-426614174000',
                        categoryId: '123e4567-e89b-12d3-a456-426614174002',
                        pricePerDay: 100.00,
                        pricePerWeek: 500.00,
                        pricePerMonth: 1800.00,
                        status: 'ACTIVE',
                        condition: 'GOOD',
                        brand: 'Canon',
                        model: 'EOS R5',
                        views: 245,
                        rating: 4.8,
                        totalReviews: 15,
                        vipLevel: 'STANDARD',
                        vipExpiresAt: '2024-02-15T10:30:00.000Z',
                        createdAt: '2024-01-01T10:30:00.000Z'
                    }
                },

                // ============ RENTAL SCHEMAS ============
                Rental: {
                    type: 'object',
                    required: ['id', 'productId', 'renterId', 'ownerId', 'startDate', 'endDate', 'status'],
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid'
                        },
                        productId: {
                            type: 'string',
                            format: 'uuid'
                        },
                        renterId: {
                            type: 'string',
                            format: 'uuid'
                        },
                        ownerId: {
                            type: 'string',
                            format: 'uuid'
                        },
                        startDate: {
                            type: 'string',
                            format: 'date-time'
                        },
                        endDate: {
                            type: 'string',
                            format: 'date-time'
                        },
                        totalDays: {
                            type: 'integer',
                            example: 7
                        },
                        baseAmount: {
                            type: 'number',
                            format: 'float',
                            example: 700.00
                        },
                        insuranceAmount: {
                            type: 'number',
                            format: 'float',
                            example: 70.00
                        },
                        platformFee: {
                            type: 'number',
                            format: 'float',
                            example: 70.00
                        },
                        totalAmount: {
                            type: 'number',
                            format: 'float',
                            example: 840.00
                        },
                        insuranceLevel: {
                            type: 'string',
                            enum: ['NONE', 'BASIC', 'PREMIUM', 'FULL'],
                            example: 'BASIC'
                        },
                        status: {
                            type: 'string',
                            enum: ['PENDING', 'CONFIRMED', 'PAID', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED'],
                            example: 'CONFIRMED'
                        },
                        paymentStatus: {
                            type: 'string',
                            enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED'],
                            example: 'COMPLETED'
                        },
                        stripePaymentId: {
                            type: 'string',
                            example: 'pi_123456789'
                        },
                        stripeRefundId: {
                            type: 'string',
                            example: 're_123456789'
                        },
                        cancellationReason: {
                            type: 'string',
                            example: 'Change of plans'
                        },
                        confirmedAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        paidAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        startedAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        completedAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                    },
                    example: {
                        id: '123e4567-e89b-12d3-a456-426614174003',
                        productId: '123e4567-e89b-12d3-a456-426614174001',
                        renterId: '123e4567-e89b-12d3-a456-426614174004',
                        ownerId: '123e4567-e89b-12d3-a456-426614174000',
                        startDate: '2024-01-20T10:00:00.000Z',
                        endDate: '2024-01-27T18:00:00.000Z',
                        totalDays: 7,
                        baseAmount: 700.00,
                        insuranceAmount: 70.00,
                        platformFee: 70.00,
                        totalAmount: 840.00,
                        insuranceLevel: 'BASIC',
                        status: 'CONFIRMED',
                        paymentStatus: 'COMPLETED',
                        confirmedAt: '2024-01-15T14:30:00.000Z',
                        paidAt: '2024-01-15T14:35:00.000Z',
                        createdAt: '2024-01-15T10:30:00.000Z'
                    }
                },

                // ============ REVIEW SCHEMAS ============
                Review: {
                    type: 'object',
                    required: ['id', 'rentalId', 'reviewerId', 'revieweeId', 'rating'],
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid'
                        },
                        rentalId: {
                            type: 'string',
                            format: 'uuid'
                        },
                        reviewerId: {
                            type: 'string',
                            format: 'uuid'
                        },
                        revieweeId: {
                            type: 'string',
                            format: 'uuid'
                        },
                        rating: {
                            type: 'integer',
                            minimum: 1,
                            maximum: 5,
                            example: 5
                        },
                        comment: {
                            type: 'string',
                            example: 'Great experience! The product was exactly as described.'
                        },
                        type: {
                            type: 'string',
                            enum: ['OWNER_TO_RENTER', 'RENTER_TO_OWNER'],
                            example: 'RENTER_TO_OWNER'
                        },
                        isActive: {
                            type: 'boolean',
                            example: true
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                    },
                },

                // ============ TRANSACTION SCHEMAS ============
                Transaction: {
                    type: 'object',
                    required: ['id', 'userId', 'type', 'amount', 'status'],
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid'
                        },
                        userId: {
                            type: 'string',
                            format: 'uuid'
                        },
                        type: {
                            type: 'string',
                            enum: [
                                'DEPOSIT',
                                'WITHDRAWAL_REQUEST',
                                'WITHDRAWAL_COMPLETED',
                                'WITHDRAWAL_REVERSAL',
                                'RENTAL_INCOME',
                                'COMMISSION',
                                'REFUND',
                                'VIP_PURCHASE',
                                'VIP_RENEWAL',
                                'ADMIN_ACTION'
                            ],
                            example: 'RENTAL_INCOME'
                        },
                        amount: {
                            type: 'number',
                            format: 'float',
                            example: 150.50
                        },
                        balance: {
                            type: 'number',
                            format: 'float',
                            example: 1200.00
                        },
                        description: {
                            type: 'string',
                            example: 'Rental income from Camera rental'
                        },
                        status: {
                            type: 'string',
                            enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED'],
                            example: 'COMPLETED'
                        },
                        stripeId: {
                            type: 'string',
                            example: 'ch_123456789'
                        },
                        completedAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                    },
                },

                // ============ VIP SUBSCRIPTION SCHEMAS ============
                VIPSubscription: {
                    type: 'object',
                    required: ['id', 'userId', 'level', 'amount', 'expiresAt'],
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid'
                        },
                        userId: {
                            type: 'string',
                            format: 'uuid'
                        },
                        productId: {
                            type: 'string',
                            format: 'uuid'
                        },
                        level: {
                            type: 'string',
                            enum: ['STANDARD', 'PREMIUM', 'MAXIMUM'],
                            example: 'STANDARD'
                        },
                        amount: {
                            type: 'number',
                            format: 'float',
                            example: 50.00
                        },
                        duration: {
                            type: 'integer',
                            example: 7
                        },
                        expiresAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        isActive: {
                            type: 'boolean',
                            example: true
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                    },
                },

                // ============ NOTIFICATION SCHEMAS ============
                Notification: {
                    type: 'object',
                    required: ['id', 'userId', 'type', 'title', 'message'],
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid'
                        },
                        userId: {
                            type: 'string',
                            format: 'uuid'
                        },
                        type: {
                            type: 'string',
                            enum: [
                                'RENTAL_REQUEST',
                                'RENTAL_CONFIRMED',
                                'RENTAL_CANCELLED',
                                'PAYMENT_RECEIVED',
                                'PAYMENT_REFUNDED',
                                'REVIEW_RECEIVED',
                                'WITHDRAWAL_REQUEST',
                                'SYSTEM_ALERT',
                                'PROMOTIONAL',
                                'UPCOMING_RENTAL',
                                'OVERDUE_RENTAL',
                                'RENTAL_AUTO_COMPLETED',
                                'WITHDRAWAL_CANCELLED',
                                'VIP_EXPIRING',
                                'VIP_EXPIRED'
                            ],
                            example: 'RENTAL_REQUEST'
                        },
                        title: {
                            type: 'string',
                            example: 'New Rental Request'
                        },
                        message: {
                            type: 'string',
                            example: 'Someone wants to rent your Camera'
                        },
                        data: {
                            type: 'object'
                        },
                        isRead: {
                            type: 'boolean',
                            example: false
                        },
                        readAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                    },
                },

                // ============ CATEGORY SCHEMAS ============
                Category: {
                    type: 'object',
                    required: ['id', 'name'],
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid'
                        },
                        name: {
                            type: 'string',
                            example: 'Electronics'
                        },
                        description: {
                            type: 'string',
                            example: 'Electronic devices and gadgets'
                        },
                        icon: {
                            type: 'string',
                            example: '📱'
                        },
                        parentId: {
                            type: 'string',
                            format: 'uuid'
                        },
                        order: {
                            type: 'integer',
                            example: 1
                        },
                        isActive: {
                            type: 'boolean',
                            example: true
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                    },
                },

                // ============ ERROR RESPONSE SCHEMAS ============
                Error: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false
                        },
                        error: {
                            type: 'string',
                            example: 'Validation failed'
                        },
                        code: {
                            type: 'string',
                            example: 'VALIDATION_ERROR'
                        },
                        errors: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    field: {
                                        type: 'string',
                                        example: 'email'
                                    },
                                    message: {
                                        type: 'string',
                                        example: 'Invalid email format'
                                    },
                                },
                            },
                        },
                    },
                },

                // ============ SUCCESS RESPONSE SCHEMAS ============
                Success: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true
                        },
                        data: {
                            type: 'object'
                        },
                        message: {
                            type: 'string',
                            example: 'Operation successful'
                        },
                    },
                },

                // ============ PAGINATION SCHEMAS ============
                Pagination: {
                    type: 'object',
                    properties: {
                        page: {
                            type: 'integer',
                            example: 1
                        },
                        limit: {
                            type: 'integer',
                            example: 20
                        },
                        total: {
                            type: 'integer',
                            example: 150
                        },
                        pages: {
                            type: 'integer',
                            example: 8
                        },
                    },
                },
            },
            responses: {
                // ============ ERROR RESPONSES ============
                UnauthorizedError: {
                    description: '🔐 Authentication required',
                    content: {
                        'application/json': {
                            schema: {$ref: '#/components/schemas/Error'},
                            example: {
                                success: false,
                                error: 'Authentication required',
                                code: 'UNAUTHORIZED',
                            },
                        },
                    },
                },
                ForbiddenError: {
                    description: '🚫 Insufficient permissions',
                    content: {
                        'application/json': {
                            schema: {$ref: '#/components/schemas/Error'},
                            example: {
                                success: false,
                                error: 'Insufficient permissions',
                                code: 'FORBIDDEN',
                            },
                        },
                    },
                },
                NotFoundError: {
                    description: '🔍 Resource not found',
                    content: {
                        'application/json': {
                            schema: {$ref: '#/components/schemas/Error'},
                            example: {
                                success: false,
                                error: 'Resource not found',
                                code: 'NOT_FOUND',
                            },
                        },
                    },
                },
                ValidationError: {
                    description: '📝 Validation failed',
                    content: {
                        'application/json': {
                            schema: {$ref: '#/components/schemas/Error'},
                            example: {
                                success: false,
                                error: 'Validation failed',
                                code: 'VALIDATION_ERROR',
                                errors: [
                                    {field: 'email', message: 'Invalid email format'},
                                    {field: 'password', message: 'Password must be at least 8 characters'},
                                ],
                            },
                        },
                    },
                },
                ConflictError: {
                    description: '⚡ Resource conflict',
                    content: {
                        'application/json': {
                            schema: {$ref: '#/components/schemas/Error'},
                            example: {
                                success: false,
                                error: 'User already exists',
                                code: 'CONFLICT',
                            },
                        },
                    },
                },
                TooManyRequestsError: {
                    description: '⏰ Rate limit exceeded',
                    content: {
                        'application/json': {
                            schema: {$ref: '#/components/schemas/Error'},
                            example: {
                                success: false,
                                error: 'Too many requests',
                                code: 'RATE_LIMIT_EXCEEDED',
                            },
                        },
                    },
                },
                InternalServerError: {
                    description: '💥 Internal server error',
                    content: {
                        'application/json': {
                            schema: {$ref: '#/components/schemas/Error'},
                            example: {
                                success: false,
                                error: 'Internal server error',
                                code: 'INTERNAL_ERROR',
                            },
                        },
                    },
                },

                // ============ SUCCESS RESPONSES ============
                SuccessResponse: {
                    description: '✅ Operation successful',
                    content: {
                        'application/json': {
                            schema: {$ref: '#/components/schemas/Success'},
                        },
                    },
                },
                CreatedResponse: {
                    description: '📝 Resource created successfully',
                    content: {
                        'application/json': {
                            schema: {$ref: '#/components/schemas/Success'},
                        },
                    },
                },
                PaginatedResponse: {
                    description: '📄 Paginated response',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: {type: 'boolean', example: true},
                                    data: {
                                        type: 'object',
                                        properties: {
                                            items: {type: 'array'},
                                            pagination: {$ref: '#/components/schemas/Pagination'},
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            parameters: {
                // ============ COMMON PARAMETERS ============
                PageParam: {
                    name: 'page',
                    in: 'query',
                    description: 'Page number',
                    required: false,
                    schema: {
                        type: 'integer',
                        minimum: 1,
                        default: 1,
                    },
                },
                LimitParam: {
                    name: 'limit',
                    in: 'query',
                    description: 'Items per page',
                    required: false,
                    schema: {
                        type: 'integer',
                        minimum: 1,
                        maximum: 100,
                        default: 20,
                    },
                },
                SearchParam: {
                    name: 'search',
                    in: 'query',
                    description: 'Search query',
                    required: false,
                    schema: {type: 'string'},
                },
                SortByParam: {
                    name: 'sortBy',
                    in: 'query',
                    description: 'Field to sort by',
                    required: false,
                    schema: {
                        type: 'string',
                        enum: ['createdAt', 'updatedAt', 'price', 'rating', 'views'],
                        default: 'createdAt',
                    },
                },
                SortOrderParam: {
                    name: 'sortOrder',
                    in: 'query',
                    description: 'Sort order',
                    required: false,
                    schema: {
                        type: 'string',
                        enum: ['asc', 'desc'],
                        default: 'desc',
                    },
                },
                TimeRangeParam: {
                    name: 'timeRange',
                    in: 'query',
                    description: 'Time range for reports',
                    required: false,
                    schema: {
                        type: 'string',
                        enum: ['1d', '7d', '30d', '90d', '1y'],
                        default: '7d',
                    },
                },

                // ============ PATH PARAMETERS ============
                IdParam: {
                    name: 'id',
                    in: 'path',
                    description: 'Resource ID',
                    required: true,
                    schema: {
                        type: 'string',
                        format: 'uuid',
                    },
                },
                UserIdParam: {
                    name: 'userId',
                    in: 'path',
                    description: 'User ID',
                    required: true,
                    schema: {
                        type: 'string',
                        format: 'uuid',
                    },
                },
                ProductIdParam: {
                    name: 'productId',
                    in: 'path',
                    description: 'Product ID',
                    required: true,
                    schema: {
                        type: 'string',
                        format: 'uuid',
                    },
                },
                RentalIdParam: {
                    name: 'rentalId',
                    in: 'path',
                    description: 'Rental ID',
                    required: true,
                    schema: {
                        type: 'string',
                        format: 'uuid',
                    },
                },
                TransactionIdParam: {
                    name: 'transactionId',
                    in: 'path',
                    description: 'Transaction ID',
                    required: true,
                    schema: {
                        type: 'string',
                        format: 'uuid',
                    },
                },
                ReviewIdParam: {
                    name: 'reviewId',
                    in: 'path',
                    description: 'Review ID',
                    required: true,
                    schema: {
                        type: 'string',
                        format: 'uuid',
                    },
                },
                TokenParam: {
                    name: 'token',
                    in: 'path',
                    description: 'Verification or reset token',
                    required: true,
                    schema: {type: 'string'},
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
        tags: [
            {
                name: '🏠 Home',
                description: 'Home and health check endpoints',
            },
            {
                name: '🔐 Authentication',
                description: 'User authentication and authorization',
            },
            {
                name: '👤 Users',
                description: 'User profile management',
            },
            {
                name: '🛍️ Products',
                description: 'Product listing and management',
            },
            {
                name: '📅 Rentals',
                description: 'Rental booking and management',
            },
            {
                name: '⭐ Reviews',
                description: 'Review and rating system',
            },
            {
                name: '💎 VIP',
                description: 'VIP subscription management',
            },
            {
                name: '💰 Payments',
                description: 'Payment processing and transactions',
            },
            {
                name: '🏦 Withdrawals',
                description: 'Withdrawal requests management',
            },
            {
                name: '📊 Owner Stats',
                description: 'Product owner statistics and analytics',
            },
            {
                name: '👑 Admin',
                description: 'Administrative endpoints (ADMIN role required)',
            },
            {
                name: '🔔 Notifications',
                description: 'Notification system',
            },
            {
                name: '🛡️ Webhooks',
                description: 'External service webhooks',
            },
            {
                name: '💬 Chat',
                description: 'Real-time chat endpoints',
            },
        ],
        paths: {
            // ==================== HOME ENDPOINTS ====================
            '/': {
                get: {
                    tags: ['🏠 Home'],
                    summary: 'API Welcome',
                    description: 'Welcome endpoint with API information',
                    responses: {
                        '200': {
                            description: 'API information',
                            content: {
                                'application/json': {
                                    example: {
                                        success: true,
                                        message: 'Welcome to RentShare API v2.0.0',
                                        documentation: '/api-docs',
                                        version: '2.0.0',
                                        environment: process.env.NODE_ENV || 'development',
                                    },
                                },
                            },
                        },
                    },
                },
            },

            '/health': {
                get: {
                    tags: ['🏠 Home'],
                    summary: 'Health Check',
                    description: 'Check API health status and service availability',
                    responses: {
                        '200': {
                            description: 'API is healthy',
                            content: {
                                'application/json': {
                                    example: {
                                        status: 'ok',
                                        timestamp: '2024-01-15T10:30:00.000Z',
                                        service: 'RentShare API',
                                        version: '2.0.0',
                                        uptime: 86400,
                                        database: 'connected',
                                        websocket: 'connected',
                                    },
                                },
                            },
                        },
                    },
                },
            },

            // ==================== AUTHENTICATION ENDPOINTS ====================
            '/auth/register': {
                post: {
                    tags: ['🔐 Authentication'],
                    summary: 'Register new user',
                    description: 'Create a new user account with email and password',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['email', 'password', 'firstName', 'lastName'],
                                    properties: {
                                        email: {
                                            type: 'string',
                                            format: 'email',
                                            example: 'user@example.com'
                                        },
                                        password: {
                                            type: 'string',
                                            minLength: 6,
                                            example: 'Password123!'
                                        },
                                        firstName: {
                                            type: 'string',
                                            example: 'John'
                                        },
                                        lastName: {
                                            type: 'string',
                                            example: 'Doe'
                                        },
                                        phone: {
                                            type: 'string',
                                            example: '+37360123456'
                                        },
                                        role: {
                                            type: 'string',
                                            enum: ['USER', 'OWNER'],
                                            default: 'USER'
                                        },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        '201': {
                            description: 'User registered successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: {type: 'boolean', example: true},
                                            data: {
                                                type: 'object',
                                                properties: {
                                                    user: {$ref: '#/components/schemas/User'},
                                                    tokens: {
                                                        type: 'object',
                                                        properties: {
                                                            accessToken: {type: 'string'},
                                                            refreshToken: {type: 'string'},
                                                        },
                                                    },
                                                },
                                            },
                                            message: {type: 'string', example: 'Registration successful'},
                                        },
                                    },
                                    example: {
                                        success: true,
                                        data: {
                                            user: {
                                                id: '123e4567-e89b-12d3-a456-426614174000',
                                                email: 'user@example.com',
                                                firstName: 'John',
                                                lastName: 'Doe',
                                                role: 'USER',
                                                status: 'PENDING',
                                                emailVerified: false,
                                            },
                                            tokens: {
                                                accessToken: 'eyJhbGciOiJIUzI1NiIs...',
                                                refreshToken: 'eyJhbGciOiJIUzI1NiIs...',
                                            },
                                        },
                                        message: 'Registration successful. Please check your email to verify your account.',
                                    },
                                },
                            },
                        },
                        '400': {$ref: '#/components/responses/ValidationError'},
                        '409': {$ref: '#/components/responses/ConflictError'},
                    },
                },
            },

            '/auth/login': {
                post: {
                    tags: ['🔐 Authentication'],
                    summary: 'User login',
                    description: 'Authenticate user with email and password',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['email', 'password'],
                                    properties: {
                                        email: {
                                            type: 'string',
                                            format: 'email',
                                            example: 'user@example.com'
                                        },
                                        password: {
                                            type: 'string',
                                            example: 'Password123!'
                                        },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        '200': {
                            description: 'Login successful',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: {type: 'boolean', example: true},
                                            data: {
                                                type: 'object',
                                                properties: {
                                                    user: {$ref: '#/components/schemas/User'},
                                                    tokens: {
                                                        type: 'object',
                                                        properties: {
                                                            accessToken: {type: 'string'},
                                                            refreshToken: {type: 'string'},
                                                        },
                                                    },
                                                },
                                            },
                                            message: {type: 'string', example: 'Login successful'},
                                        },
                                    },
                                    example: {
                                        success: true,
                                        data: {
                                            user: {
                                                id: '123e4567-e89b-12d3-a456-426614174000',
                                                email: 'user@example.com',
                                                firstName: 'John',
                                                lastName: 'Doe',
                                                role: 'USER',
                                                status: 'ACTIVE',
                                                emailVerified: true,
                                                rating: 4.5,
                                                balance: 1500.50,
                                            },
                                            tokens: {
                                                accessToken: 'eyJhbGciOiJIUzI1NiIs...',
                                                refreshToken: 'eyJhbGciOiJIUzI1NiIs...',
                                            },
                                        },
                                        message: 'Login successful',
                                    },
                                },
                            },
                        },
                        '401': {
                            description: 'Invalid credentials',
                            content: {
                                'application/json': {
                                    example: {
                                        success: false,
                                        error: 'Invalid credentials',
                                        code: 'INVALID_CREDENTIALS',
                                    },
                                },
                            },
                        },
                    },
                },
            },

            '/auth/refresh-token': {
                post: {
                    tags: ['🔐 Authentication'],
                    summary: 'Refresh access token',
                    description: 'Get new access token using refresh token',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['refreshToken'],
                                    properties: {
                                        refreshToken: {
                                            type: 'string',
                                            example: 'eyJhbGciOiJIUzI1NiIs...'
                                        },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        '200': {
                            description: 'Token refreshed successfully',
                            content: {
                                'application/json': {
                                    example: {
                                        success: true,
                                        data: {
                                            tokens: {
                                                accessToken: 'eyJhbGciOiJIUzI1NiIs...',
                                                refreshToken: 'eyJhbGciOiJIUzI1NiIs...',
                                            },
                                        },
                                        message: 'Token refreshed successfully',
                                    },
                                },
                            },
                        },
                        '401': {
                            description: 'Invalid refresh token',
                            content: {
                                'application/json': {
                                    example: {
                                        success: false,
                                        error: 'Invalid refresh token',
                                        code: 'INVALID_REFRESH_TOKEN',
                                    },
                                },
                            },
                        },
                    },
                },
            },

            '/auth/verify-email/{token}': {
                get: {
                    tags: ['🔐 Authentication'],
                    summary: 'Verify email address',
                    description: 'Verify user email using verification token',
                    parameters: [
                        {$ref: '#/components/parameters/TokenParam'},
                    ],
                    responses: {
                        '200': {
                            description: 'Email verified successfully',
                            content: {
                                'application/json': {
                                    example: {
                                        success: true,
                                        message: 'Email verified successfully',
                                    },
                                },
                            },
                        },
                        '400': {
                            description: 'Invalid or expired token',
                            content: {
                                'application/json': {
                                    example: {
                                        success: false,
                                        error: 'Invalid or expired verification token',
                                        code: 'INVALID_TOKEN',
                                    },
                                },
                            },
                        },
                    },
                },
            },

            '/auth/forgot-password': {
                post: {
                    tags: ['🔐 Authentication'],
                    summary: 'Request password reset',
                    description: 'Send password reset email to user',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['email'],
                                    properties: {
                                        email: {
                                            type: 'string',
                                            format: 'email',
                                            example: 'user@example.com'
                                        },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        '200': {
                            description: 'Reset email sent',
                            content: {
                                'application/json': {
                                    example: {
                                        success: true,
                                        message: 'If an account exists with this email, you will receive reset instructions',
                                    },
                                },
                            },
                        },
                    },
                },
            },

            '/auth/reset-password/{token}': {
                post: {
                    tags: ['🔐 Authentication'],
                    summary: 'Reset password',
                    description: 'Reset password using reset token',
                    parameters: [
                        {$ref: '#/components/parameters/TokenParam'},
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['password'],
                                    properties: {
                                        password: {
                                            type: 'string',
                                            minLength: 6,
                                            example: 'NewPassword123!'
                                        },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        '200': {
                            description: 'Password reset successful',
                            content: {
                                'application/json': {
                                    example: {
                                        success: true,
                                        message: 'Password reset successful',
                                    },
                                },
                            },
                        },
                        '400': {
                            description: 'Invalid or expired token',
                            content: {
                                'application/json': {
                                    example: {
                                        success: false,
                                        error: 'Invalid or expired reset token',
                                        code: 'INVALID_TOKEN',
                                    },
                                },
                            },
                        },
                    },
                },
            },

            // ==================== USER PROFILE ENDPOINTS ====================
            '/auth/profile': {
                get: {
                    tags: ['👤 Users'],
                    summary: 'Get user profile',
                    description: 'Get current authenticated user profile',
                    security: [{bearerAuth: []}],
                    responses: {
                        '200': {
                            description: 'User profile',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: {type: 'boolean', example: true},
                                            data: {
                                                type: 'object',
                                                properties: {
                                                    user: {$ref: '#/components/schemas/User'},
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        '401': {$ref: '#/components/responses/UnauthorizedError'},
                    },
                },
                put: {
                    tags: ['👤 Users'],
                    summary: 'Update user profile',
                    description: 'Update current user profile information',
                    security: [{bearerAuth: []}],
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        firstName: {type: 'string', example: 'John'},
                                        lastName: {type: 'string', example: 'Doe'},
                                        phone: {type: 'string', example: '+37360123456'},
                                        bio: {type: 'string', example: 'I love photography!'},
                                        avatar: {type: 'string', format: 'url'},
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        '200': {
                            description: 'Profile updated successfully',
                            content: {
                                'application/json': {
                                    example: {
                                        success: true,
                                        data: {
                                            user: {
                                                id: '123e4567-e89b-12d3-a456-426614174000',
                                                email: 'user@example.com',
                                                firstName: 'John',
                                                lastName: 'Doe',
                                                phone: '+37360123456',
                                                bio: 'I love photography!',
                                                avatar: 'https://example.com/avatar.jpg',
                                            },
                                        },
                                        message: 'Profile updated successfully',
                                    },
                                },
                            },
                        },
                        '401': {$ref: '#/components/responses/UnauthorizedError'},
                        '400': {$ref: '#/components/responses/ValidationError'},
                    },
                },
            },

            '/auth/change-password': {
                post: {
                    tags: ['👤 Users'],
                    summary: 'Change password',
                    description: 'Change current user password',
                    security: [{bearerAuth: []}],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['currentPassword', 'newPassword'],
                                    properties: {
                                        currentPassword: {
                                            type: 'string',
                                            example: 'OldPassword123!'
                                        },
                                        newPassword: {
                                            type: 'string',
                                            minLength: 6,
                                            example: 'NewPassword123!'
                                        },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        '200': {
                            description: 'Password changed successfully',
                            content: {
                                'application/json': {
                                    example: {
                                        success: true,
                                        message: 'Password changed successfully',
                                    },
                                },
                            },
                        },
                        '401': {$ref: '#/components/responses/UnauthorizedError'},
                        '400': {
                            description: 'Current password incorrect',
                            content: {
                                'application/json': {
                                    example: {
                                        success: false,
                                        error: 'Current password is incorrect',
                                        code: 'INCORRECT_PASSWORD',
                                    },
                                },
                            },
                        },
                    },
                },
            },

            '/auth/logout': {
                post: {
                    tags: ['👤 Users'],
                    summary: 'Logout user',
                    description: 'Logout current user (invalidate token)',
                    security: [{bearerAuth: []}],
                    responses: {
                        '200': {
                            description: 'Logout successful',
                            content: {
                                'application/json': {
                                    example: {
                                        success: true,
                                        message: 'Logout successful',
                                    },
                                },
                            },
                        },
                        '401': {$ref: '#/components/responses/UnauthorizedError'},
                    },
                },
            },

            // ==================== PRODUCT ENDPOINTS ====================
            '/products': {
                post: {
                    tags: ['🛍️ Products'],
                    summary: 'Create product',
                    description: 'Create a new product listing',
                    security: [{bearerAuth: []}],
                    requestBody: {
                        required: true,
                        content: {
                            'multipart/form-data': {
                                schema: {
                                    type: 'object',
                                    required: ['title', 'description', 'categoryId', 'pricePerDay', 'condition'],
                                    properties: {
                                        title: {type: 'string', example: 'Professional Camera'},
                                        description: {type: 'string', example: 'High-quality DSLR camera'},
                                        categoryId: {type: 'string', format: 'uuid'},
                                        pricePerDay: {type: 'number', example: 100.00},
                                        pricePerWeek: {type: 'number', example: 500.00},
                                        pricePerMonth: {type: 'number', example: 1800.00},
                                        condition: {
                                            type: 'string',
                                            enum: ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR']
                                        },
                                        brand: {type: 'string', example: 'Canon'},
                                        model: {type: 'string', example: 'EOS R5'},
                                        year: {type: 'integer', example: 2022},
                                        dimensions: {type: 'string', example: '30x20x15 cm'},
                                        weight: {type: 'number', example: 2.5},
                                        rules: {type: 'string', example: 'No smoking, handle with care'},
                                        deposit: {type: 'number', example: 2000.00},
                                        maxRentalDays: {type: 'integer', example: 30},
                                        minRentalDays: {type: 'integer', example: 1},
                                        images: {
                                            type: 'array',
                                            items: {type: 'string', format: 'binary'},
                                            description: 'Product images (max 5)',
                                        },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        '201': {
                            description: 'Product created successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: {type: 'boolean', example: true},
                                            data: {
                                                type: 'object',
                                                properties: {
                                                    product: {$ref: '#/components/schemas/Product'},
                                                },
                                            },
                                            message: {type: 'string', example: 'Product created successfully'},
                                        },
                                    },
                                },
                            },
                        },
                        '401': {$ref: '#/components/responses/UnauthorizedError'},
                        '400': {$ref: '#/components/responses/ValidationError'},
                    },
                },
                get: {
                    tags: ['🛍️ Products'],
                    summary: 'Search products',
                    description: 'Search and filter products with pagination',
                    parameters: [
                        {$ref: '#/components/parameters/PageParam'},
                        {$ref: '#/components/parameters/LimitParam'},
                        {$ref: '#/components/parameters/SearchParam'},
                        {$ref: '#/components/parameters/SortByParam'},
                        {$ref: '#/components/parameters/SortOrderParam'},
                        {
                            name: 'categoryId',
                            in: 'query',
                            description: 'Filter by category ID',
                            schema: {type: 'string', format: 'uuid'},
                        },
                        {
                            name: 'minPrice',
                            in: 'query',
                            description: 'Minimum price per day',
                            schema: {type: 'number', minimum: 0},
                        },
                        {
                            name: 'maxPrice',
                            in: 'query',
                            description: 'Maximum price per day',
                            schema: {type: 'number', minimum: 0},
                        },
                        {
                            name: 'condition',
                            in: 'query',
                            description: 'Filter by condition',
                            schema: {
                                type: 'string',
                                enum: ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR'],
                            },
                        },
                        {
                            name: 'vipOnly',
                            in: 'query',
                            description: 'Show only VIP products',
                            schema: {type: 'boolean', default: false},
                        },
                        {
                            name: 'availableFrom',
                            in: 'query',
                            description: 'Available from date (ISO format)',
                            schema: {type: 'string', format: 'date-time'},
                        },
                        {
                            name: 'availableTo',
                            in: 'query',
                            description: 'Available to date (ISO format)',
                            schema: {type: 'string', format: 'date-time'},
                        },
                    ],
                    responses: {
                        '200': {
                            description: 'List of products',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: {type: 'boolean', example: true},
                                            data: {
                                                type: 'object',
                                                properties: {
                                                    products: {
                                                        type: 'array',
                                                        items: {$ref: '#/components/schemas/Product'},
                                                    },
                                                    pagination: {$ref: '#/components/schemas/Pagination'},
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },

            '/products/{id}': {
                get: {
                    tags: ['🛍️ Products'],
                    summary: 'Get product details',
                    description: 'Get detailed information about a product',
                    parameters: [
                        {$ref: '#/components/parameters/IdParam'},
                    ],
                    responses: {
                        '200': {
                            description: 'Product details',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: {type: 'boolean', example: true},
                                            data: {
                                                type: 'object',
                                                properties: {
                                                    product: {$ref: '#/components/schemas/Product'},
                                                    owner: {$ref: '#/components/schemas/User'},
                                                    images: {
                                                        type: 'array',
                                                        items: {
                                                            type: 'object',
                                                            properties: {
                                                                id: {type: 'string', format: 'uuid'},
                                                                url: {type: 'string', format: 'url'},
                                                                isPrimary: {type: 'boolean'},
                                                            },
                                                        },
                                                    },
                                                    attributes: {
                                                        type: 'array',
                                                        items: {
                                                            type: 'object',
                                                            properties: {
                                                                key: {type: 'string'},
                                                                value: {type: 'string'},
                                                            },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        '404': {$ref: '#/components/responses/NotFoundError'},
                    },
                },
                put: {
                    tags: ['🛍️ Products'],
                    summary: 'Update product',
                    description: 'Update product information',
                    security: [{bearerAuth: []}],
                    parameters: [
                        {$ref: '#/components/parameters/IdParam'},
                    ],
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        title: {type: 'string'},
                                        description: {type: 'string'},
                                        pricePerDay: {type: 'number'},
                                        pricePerWeek: {type: 'number'},
                                        pricePerMonth: {type: 'number'},
                                        condition: {
                                            type: 'string',
                                            enum: ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR']
                                        },
                                        status: {
                                            type: 'string',
                                            enum: ['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED']
                                        },
                                        rules: {type: 'string'},
                                        deposit: {type: 'number'},
                                        maxRentalDays: {type: 'integer'},
                                        minRentalDays: {type: 'integer'},
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        '200': {
                            description: 'Product updated successfully',
                            content: {
                                'application/json': {
                                    example: {
                                        success: true,
                                        data: {
                                            product: {
                                                id: '123e4567-e89b-12d3-a456-426614174001',
                                                title: 'Updated Camera Title',
                                                pricePerDay: 120.00,
                                            },
                                        },
                                        message: 'Product updated successfully',
                                    },
                                },
                            },
                        },
                        '401': {$ref: '#/components/responses/UnauthorizedError'},
                        '403': {$ref: '#/components/responses/ForbiddenError'},
                        '404': {$ref: '#/components/responses/NotFoundError'},
                    },
                },
                delete: {
                    tags: ['🛍️ Products'],
                    summary: 'Delete product',
                    description: 'Delete a product listing',
                    security: [{bearerAuth: []}],
                    parameters: [
                        {$ref: '#/components/parameters/IdParam'},
                    ],
                    responses: {
                        '200': {
                            description: 'Product deleted successfully',
                            content: {
                                'application/json': {
                                    example: {
                                        success: true,
                                        message: 'Product deleted successfully',
                                    },
                                },
                            },
                        },
                        '401': {$ref: '#/components/responses/UnauthorizedError'},
                        '403': {$ref: '#/components/responses/ForbiddenError'},
                        '404': {$ref: '#/components/responses/NotFoundError'},
                        '400': {
                            description: 'Cannot delete product with active rentals',
                            content: {
                                'application/json': {
                                    example: {
                                        success: false,
                                        error: 'Cannot delete product with active rentals',
                                        code: 'ACTIVE_RENTALS_EXIST',
                                    },
                                },
                            },
                        },
                    },
                },
            },

            '/products/{id}/availability': {
                get: {
                    tags: ['🛍️ Products'],
                    summary: 'Check availability',
                    description: 'Check if product is available for specific dates',
                    parameters: [
                        {$ref: '#/components/parameters/IdParam'},
                        {
                            name: 'startDate',
                            in: 'query',
                            required: true,
                            description: 'Start date (ISO format)',
                            schema: {type: 'string', format: 'date-time'},
                        },
                        {
                            name: 'endDate',
                            in: 'query',
                            required: true,
                            description: 'End date (ISO format)',
                            schema: {type: 'string', format: 'date-time'},
                        },
                    ],
                    responses: {
                        '200': {
                            description: 'Availability check result',
                            content: {
                                'application/json': {
                                    example: {
                                        success: true,
                                        data: {
                                            isAvailable: true,
                                            message: 'Product is available for the selected dates',
                                        },
                                    },
                                },
                            },
                        },
                        '400': {
                            description: 'Invalid dates or product not available',
                            content: {
                                'application/json': {
                                    example: {
                                        success: false,
                                        error: 'Product is not available for the selected dates',
                                        code: 'NOT_AVAILABLE',
                                    },
                                },
                            },
                        },
                        '404': {$ref: '#/components/responses/NotFoundError'},
                    },
                },
            },

            '/products/user/products': {
                get: {
                    tags: ['🛍️ Products'],
                    summary: 'Get user products',
                    description: 'Get all products owned by current user',
                    security: [{bearerAuth: []}],
                    parameters: [
                        {$ref: '#/components/parameters/PageParam'},
                        {$ref: '#/components/parameters/LimitParam'},
                        {
                            name: 'status',
                            in: 'query',
                            description: 'Filter by status',
                            schema: {
                                type: 'string',
                                enum: ['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'],
                            },
                        },
                    ],
                    responses: {
                        '200': {
                            description: 'List of user products',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: {type: 'boolean', example: true},
                                            data: {
                                                type: 'object',
                                                properties: {
                                                    products: {
                                                        type: 'array',
                                                        items: {$ref: '#/components/schemas/Product'},
                                                    },
                                                    pagination: {$ref: '#/components/schemas/Pagination'},
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        '401': {$ref: '#/components/responses/UnauthorizedError'},
                    },
                },
            },

            '/products/{productId}/favorite': {
                post: {
                    tags: ['🛍️ Products'],
                    summary: 'Toggle favorite',
                    description: 'Add or remove product from favorites',
                    security: [{bearerAuth: []}],
                    parameters: [
                        {$ref: '#/components/parameters/ProductIdParam'},
                    ],
                    responses: {
                        '200': {
                            description: 'Favorite status toggled',
                            content: {
                                'application/json': {
                                    example: {
                                        success: true,
                                        data: {
                                            favorited: true,
                                        },
                                        message: 'Product added to favorites',
                                    },
                                },
                            },
                        },
                        '401': {$ref: '#/components/responses/UnauthorizedError'},
                        '404': {$ref: '#/components/responses/NotFoundError'},
                    },
                },
            },

            '/products/user/favorites': {
                get: {
                    tags: ['🛍️ Products'],
                    summary: 'Get user favorites',
                    description: 'Get all favorite products of current user',
                    security: [{bearerAuth: []}],
                    parameters: [
                        {$ref: '#/components/parameters/PageParam'},
                        {$ref: '#/components/parameters/LimitParam'},
                    ],
                    responses: {
                        '200': {
                            description: 'List of favorite products',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: {type: 'boolean', example: true},
                                            data: {
                                                type: 'object',
                                                properties: {
                                                    products: {
                                                        type: 'array',
                                                        items: {$ref: '#/components/schemas/Product'},
                                                    },
                                                    pagination: {$ref: '#/components/schemas/Pagination'},
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        '401': {$ref: '#/components/responses/UnauthorizedError'},
                    },
                },
            },

            '/products/categories': {
                get: {
                    tags: ['🛍️ Products'],
                    summary: 'Get categories',
                    description: 'Get all product categories',
                    responses: {
                        '200': {
                            description: 'List of categories',
                            content: {
                                'application/json': {
                                    example: {
                                        success: true,
                                        data: {
                                            categories: [
                                                {
                                                    id: '123e4567-e89b-12d3-a456-426614174002',
                                                    name: 'Electronics',
                                                    description: 'Electronic devices',
                                                    icon: '📱',
                                                    children: [
                                                        {
                                                            id: '123e4567-e89b-12d3-a456-426614174003',
                                                            name: 'Cameras',
                                                            description: 'Photography equipment',
                                                            icon: '📷',
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },

            // ==================== RENTAL ENDPOINTS ====================
            '/rentals/{productId}/calculate': {
                get: {
                    tags: ['📅 Rentals'],
                    summary: 'Calculate rental cost',
                    description: 'Calculate rental cost for specific product and dates',
                    parameters: [
                        {$ref: '#/components/parameters/ProductIdParam'},
                        {
                            name: 'startDate',
                            in: 'query',
                            required: true,
                            description: 'Start date (ISO format)',
                            schema: {type: 'string', format: 'date-time'},
                        },
                        {
                            name: 'endDate',
                            in: 'query',
                            required: true,
                            description: 'End date (ISO format)',
                            schema: {type: 'string', format: 'date-time'},
                        },
                        {
                            name: 'insuranceLevel',
                            in: 'query',
                            description: 'Insurance level',
                            schema: {
                                type: 'string',
                                enum: ['NONE', 'BASIC', 'PREMIUM', 'FULL'],
                                default: 'NONE',
                            },
                        },
                    ],
                    responses: {
                        '200': {
                            description: 'Rental cost calculation',
                            content: {
                                'application/json': {
                                    example: {
                                        success: true,
                                        data: {
                                            totalDays: 7,
                                            baseAmount: 700.00,
                                            insuranceAmount: 70.00,
                                            platformFee: 70.00,
                                            commissionDiscount: 3.50,
                                            totalAmount: 836.50,
                                            deposit: 2000.00,
                                            breakdown: {
                                                daily: 100.00,
                                                weekly: 500.00,
                                                monthly: 1800.00,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        '400': {
                            description: 'Invalid dates or calculation error',
                            content: {
                                'application/json': {
                                    example: {
                                        success: false,
                                        error: 'Minimum rental period is 2 days',
                                        code: 'MIN_RENTAL_DAYS',
                                    },
                                },
                            },
                        },
                        '404': {$ref: '#/components/responses/NotFoundError'},
                    },
                },
            },

            '/rentals': {
                post: {
                    tags: ['📅 Rentals'],
                    summary: 'Create rental request',
                    description: 'Create a new rental request for a product',
                    security: [{bearerAuth: []}],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['productId', 'startDate', 'endDate'],
                                    properties: {
                                        productId: {
                                            type: 'string',
                                            format: 'uuid',
                                            example: '123e4567-e89b-12d3-a456-426614174001'
                                        },
                                        startDate: {
                                            type: 'string',
                                            format: 'date-time',
                                            example: '2024-01-20T10:00:00.000Z'
                                        },
                                        endDate: {
                                            type: 'string',
                                            format: 'date-time',
                                            example: '2024-01-27T18:00:00.000Z'
                                        },
                                        insuranceLevel: {
                                            type: 'string',
                                            enum: ['NONE', 'BASIC', 'PREMIUM', 'FULL'],
                                            default: 'NONE'
                                        },
                                        promoCode: {
                                            type: 'string',
                                            example: 'WELCOME10'
                                        },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        '201': {
                            description: 'Rental request created',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: {type: 'boolean', example: true},
                                            data: {
                                                type: 'object',
                                                properties: {
                                                    rental: {$ref: '#/components/schemas/Rental'},
                                                    cost: {
                                                        type: 'object',
                                                        properties: {
                                                            totalDays: {type: 'integer'},
                                                            baseAmount: {type: 'number'},
                                                            insuranceAmount: {type: 'number'},
                                                            platformFee: {type: 'number'},
                                                            totalAmount: {type: 'number'},
                                                            deposit: {type: 'number'},
                                                        },
                                                    },
                                                    promoDiscount: {type: 'number'},
                                                },
                                            },
                                            message: {type: 'string', example: 'Rental request created successfully'},
                                        },
                                    },
                                },
                            },
                        },
                        '401': {$ref: '#/components/responses/UnauthorizedError'},
                        '400': {$ref: '#/components/responses/ValidationError'},
                        '404': {$ref: '#/components/responses/NotFoundError'},
                        '409': {
                            description: 'Cannot rent own product',
                            content: {
                                'application/json': {
                                    example: {
                                        success: false,
                                        error: 'Cannot rent your own product',
                                        code: 'SELF_RENTAL',
                                    },
                                },
                            },
                        },
                    },
                },
            },

            '/rentals/{id}/confirm': {
                post: {
                    tags: ['📅 Rentals'],
                    summary: 'Confirm rental',
                    description: 'Confirm a rental request (owner only)',
                    security: [{bearerAuth: []}],
                    parameters: [
                        {$ref: '#/components/parameters/RentalIdParam'},
                    ],
                    responses: {
                        '200': {
                            description: 'Rental confirmed',
                            content: {
                                'application/json': {
                                    example: {
                                        success: true,
                                        data: {
                                            rental: {
                                                id: '123e4567-e89b-12d3-a456-426614174003',
                                                status: 'CONFIRMED',
                                                confirmedAt: '2024-01-15T14:30:00.000Z',
                                            },
                                        },
                                        message: 'Rental confirmed successfully',
                                    },
                                },
                            },
                        },
                        '401': {$ref: '#/components/responses/UnauthorizedError'},
                        '403': {$ref: '#/components/responses/ForbiddenError'},
                        '404': {$ref: '#/components/responses/NotFoundError'},
                    },
                },
            },

            '/rentals/{id}/cancel': {
                post: {
                    tags: ['📅 Rentals'],
                    summary: 'Cancel rental',
                    description: 'Cancel a rental request',
                    security: [{bearerAuth: []}],
                    parameters: [
                        {$ref: '#/components/parameters/RentalIdParam'},
                    ],
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        reason: {
                                            type: 'string',
                                            example: 'Change of plans'
                                        },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        '200': {
                            description: 'Rental cancelled',
                            content: {
                                'application/json': {
                                    example: {
                                        success: true,
                                        data: {
                                            rental: {
                                                id: '123e4567-e89b-12d3-a456-426614174003',
                                                status: 'CANCELLED',
                                                cancellationReason: 'Change of plans',
                                            },
                                        },
                                        message: 'Rental cancelled successfully',
                                    },
                                },
                            },
                        },
                        '401': {$ref: '#/components/responses/UnauthorizedError'},
                        '403': {$ref: '#/components/responses/ForbiddenError'},
                        '404': {$ref: '#/components/responses/NotFoundError'},
                        '400': {
                            description: 'Cannot cancel rental',
                            content: {
                                'application/json': {
                                    example: {
                                        success: false,
                                        error: 'Cannot cancel rental in progress',
                                        code: 'RENTAL_IN_PROGRESS',
                                    },
                                },
                            },
                        },
                    },
                },
            },

            '/rentals/{id}/payment': {
                post: {
                    tags: ['📅 Rentals'],
                    summary: 'Process payment',
                    description: 'Process payment for a confirmed rental',
                    security: [{bearerAuth: []}],
                    parameters: [
                        {$ref: '#/components/parameters/RentalIdParam'},
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['paymentMethodId'],
                                    properties: {
                                        paymentMethodId: {
                                            type: 'string',
                                            example: 'pm_123456789'
                                        },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        '200': {
                            description: 'Payment processed',
                            content: {
                                'application/json': {
                                    example: {
                                        success: true,
                                        data: {
                                            rental: {
                                                id: '123e4567-e89b-12d3-a456-426614174003',
                                                paymentStatus: 'COMPLETED',
                                                paidAt: '2024-01-15T14:35:00.000Z',
                                            },
                                            paymentIntent: {
                                                id: 'pi_123456789',
                                                status: 'succeeded',
                                            },
                                        },
                                        message: 'Payment processed successfully',
                                    },
                                },
                            },
                        },
                    },

                    '/rentals/{id}/start': {
                        post: {
                            tags: ['📅 Rentals'],
                            summary: 'Start rental',
                            description: 'Mark rental as started (owner only)',
                            security: [{bearerAuth: []}],
                            parameters: [
                                {$ref: '#/components/parameters/RentalIdParam'},
                            ],
                            responses: {
                                '200': {
                                    description: 'Rental started',
                                    content: {
                                        'application/json': {
                                            example: {
                                                success: true,
                                                data: {
                                                    rental: {
                                                        id: '123e4567-e89b-12d3-a456-426614174003',
                                                        status: 'IN_PROGRESS',
                                                        startedAt: '2024-01-20T10:00:00.000Z',
                                                    },
                                                },
                                                message: 'Rental started successfully',
                                            },
                                        },
                                    },
                                },
                                '401': {$ref: '#/components/responses/UnauthorizedError'},
                                '403': {$ref: '#/components/responses/ForbiddenError'},
                                '404': {$ref: '#/components/responses/NotFoundError'},
                                '400': {
                                    description: 'Cannot start rental',
                                    content: {
                                        'application/json': {
                                            example: {
                                                success: false,
                                                error: 'Rental has not been paid yet',
                                                code: 'RENTAL_NOT_PAID',
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },

                    '/rentals/{id}/complete': {
                        post: {
                            tags: ['📅 Rentals'],
                            summary: 'Complete rental',
                            description: 'Mark rental as completed (owner only)',
                            security: [{bearerAuth: []}],
                            parameters: [
                                {$ref: '#/components/parameters/RentalIdParam'},
                            ],
                            responses: {
                                '200': {
                                    description: 'Rental completed',
                                    content: {
                                        'application/json': {
                                            example: {
                                                success: true,
                                                data: {
                                                    rental: {
                                                        id: '123e4567-e89b-12d3-a456-426614174003',
                                                        status: 'COMPLETED',
                                                        completedAt: '2024-01-27T18:00:00.000Z',
                                                    },
                                                    transaction: {
                                                        id: '123e4567-e89b-12d3-a456-426614174005',
                                                        type: 'RENTAL_INCOME',
                                                        amount: 700.00,
                                                        status: 'COMPLETED',
                                                    },
                                                },
                                                message: 'Rental completed successfully',
                                            },
                                        },
                                    },
                                },
                                '401': {$ref: '#/components/responses/UnauthorizedError'},
                                '403': {$ref: '#/components/responses/ForbiddenError'},
                                '404': {$ref: '#/components/responses/NotFoundError'},
                                '400': {
                                    description: 'Cannot complete rental',
                                    content: {
                                        'application/json': {
                                            example: {
                                                success: false,
                                                error: 'Rental is not in progress',
                                                code: 'RENTAL_NOT_IN_PROGRESS',
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },

                    '/rentals/{id}/dispute': {
                        post: {
                            tags: ['📅 Rentals'],
                            summary: 'Create dispute',
                            description: 'Create a dispute for a rental',
                            security: [{bearerAuth: []}],
                            parameters: [
                                {$ref: '#/components/parameters/RentalIdParam'},
                            ],
                            requestBody: {
                                required: true,
                                content: {
                                    'application/json': {
                                        schema: {
                                            type: 'object',
                                            required: ['reason'],
                                            properties: {
                                                reason: {
                                                    type: 'string',
                                                    example: 'Product was damaged during rental'
                                                },
                                                description: {
                                                    type: 'string',
                                                    example: 'The camera lens has scratches that were not mentioned'
                                                },
                                                evidence: {
                                                    type: 'array',
                                                    items: {type: 'string', format: 'url'},
                                                    description: 'URLs to evidence images',
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                            responses: {
                                '200': {
                                    description: 'Dispute created',
                                    content: {
                                        'application/json': {
                                            example: {
                                                success: true,
                                                data: {
                                                    dispute: {
                                                        id: '123e4567-e89b-12d3-a456-426614174006',
                                                        rentalId: '123e4567-e89b-12d3-a456-426614174003',
                                                        status: 'OPEN',
                                                    },
                                                    rental: {
                                                        status: 'DISPUTED',
                                                    },
                                                },
                                                message: 'Dispute created successfully',
                                            },
                                        },
                                    },
                                },
                                '401': {$ref: '#/components/responses/UnauthorizedError'},
                                '403': {$ref: '#/components/responses/ForbiddenError'},
                                '404': {$ref: '#/components/responses/NotFoundError'},
                            },
                        },
                    },

                    '/rentals/user/rentals': {
                        get: {
                            tags: ['📅 Rentals'],
                            summary: 'Get user rentals',
                            description: 'Get all rentals for current user (both as renter and owner)',
                            security: [{bearerAuth: []}],
                            parameters: [
                                {$ref: '#/components/parameters/PageParam'},
                                {$ref: '#/components/parameters/LimitParam'},
                                {
                                    name: 'status',
                                    in: 'query',
                                    description: 'Filter by status',
                                    schema: {
                                        type: 'string',
                                        enum: ['PENDING', 'CONFIRMED', 'PAID', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED'],
                                    },
                                },
                                {
                                    name: 'role',
                                    in: 'query',
                                    description: 'Filter by user role in rental',
                                    schema: {
                                        type: 'string',
                                        enum: ['RENTER', 'OWNER'],
                                    },
                                },
                            ],
                            responses: {
                                '200': {
                                    description: 'List of user rentals',
                                    content: {
                                        'application/json': {
                                            schema: {
                                                type: 'object',
                                                properties: {
                                                    success: {type: 'boolean', example: true},
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            rentals: {
                                                                type: 'array',
                                                                items: {$ref: '#/components/schemas/Rental'},
                                                            },
                                                            pagination: {$ref: '#/components/schemas/Pagination'},
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                                '401': {$ref: '#/components/responses/UnauthorizedError'},
                            },
                        },
                    },

                    '/rentals/{id}': {
                        get: {
                            tags: ['📅 Rentals'],
                            summary: 'Get rental details',
                            description: 'Get detailed information about a rental',
                            security: [{bearerAuth: []}],
                            parameters: [
                                {$ref: '#/components/parameters/RentalIdParam'},
                            ],
                            responses: {
                                '200': {
                                    description: 'Rental details',
                                    content: {
                                        'application/json': {
                                            schema: {
                                                type: 'object',
                                                properties: {
                                                    success: {type: 'boolean', example: true},
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            rental: {$ref: '#/components/schemas/Rental'},
                                                            product: {$ref: '#/components/schemas/Product'},
                                                            renter: {$ref: '#/components/schemas/User'},
                                                            owner: {$ref: '#/components/schemas/User'},
                                                            payment: {
                                                                type: 'object',
                                                                properties: {
                                                                    status: {type: 'string'},
                                                                    amount: {type: 'number'},
                                                                    stripePaymentId: {type: 'string'},
                                                                },
                                                            },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                                '401': {$ref: '#/components/responses/UnauthorizedError'},
                                '403': {$ref: '#/components/responses/ForbiddenError'},
                                '404': {$ref: '#/components/responses/NotFoundError'},
                            },
                        },
                    },

                    // ==================== REVIEW ENDPOINTS ====================
                    '/reviews/rental/{rentalId}': {
                        post: {
                            tags: ['⭐ Reviews'],
                            summary: 'Create review',
                            description: 'Create a review for a completed rental',
                            security: [{bearerAuth: []}],
                            parameters: [
                                {$ref: '#/components/parameters/RentalIdParam'},
                            ],
                            requestBody: {
                                required: true,
                                content: {
                                    'application/json': {
                                        schema: {
                                            type: 'object',
                                            required: ['rating', 'comment'],
                                            properties: {
                                                rating: {
                                                    type: 'integer',
                                                    minimum: 1,
                                                    maximum: 5,
                                                    example: 5
                                                },
                                                comment: {
                                                    type: 'string',
                                                    example: 'Great experience! Everything was perfect.'
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                            responses: {
                                '201': {
                                    description: 'Review created',
                                    content: {
                                        'application/json': {
                                            example: {
                                                success: true,
                                                data: {
                                                    review: {
                                                        id: '123e4567-e89b-12d3-a456-426614174007',
                                                        rentalId: '123e4567-e89b-12d3-a456-426614174003',
                                                        rating: 5,
                                                        comment: 'Great experience!',
                                                    },
                                                },
                                                message: 'Review created successfully',
                                            },
                                        },
                                    },
                                },
                                '401': {$ref: '#/components/responses/UnauthorizedError'},
                                '403': {$ref: '#/components/responses/ForbiddenError'},
                                '404': {$ref: '#/components/responses/NotFoundError'},
                                '400': {
                                    description: 'Cannot create review',
                                    content: {
                                        'application/json': {
                                            example: {
                                                success: false,
                                                error: 'Review already exists for this rental',
                                                code: 'DUPLICATE_REVIEW',
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        get: {
                            tags: ['⭐ Reviews'],
                            summary: 'Get rental reviews',
                            description: 'Get all reviews for a specific rental',
                            parameters: [
                                {$ref: '#/components/parameters/RentalIdParam'},
                            ],
                            responses: {
                                '200': {
                                    description: 'List of reviews',
                                    content: {
                                        'application/json': {
                                            schema: {
                                                type: 'object',
                                                properties: {
                                                    success: {type: 'boolean', example: true},
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            reviews: {
                                                                type: 'array',
                                                                items: {$ref: '#/components/schemas/Review'},
                                                            },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                                '404': {$ref: '#/components/responses/NotFoundError'},
                            },
                        },
                    },

                    '/reviews/user/{userId}': {
                        get: {
                            tags: ['⭐ Reviews'],
                            summary: 'Get user reviews',
                            description: 'Get all reviews for a specific user',
                            parameters: [
                                {$ref: '#/components/parameters/UserIdParam'},
                                {$ref: '#/components/parameters/PageParam'},
                                {$ref: '#/components/parameters/LimitParam'},
                            ],
                            responses: {
                                '200': {
                                    description: 'List of user reviews',
                                    content: {
                                        'application/json': {
                                            schema: {
                                                type: 'object',
                                                properties: {
                                                    success: {type: 'boolean', example: true},
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            reviews: {
                                                                type: 'array',
                                                                items: {$ref: '#/components/schemas/Review'},
                                                            },
                                                            pagination: {$ref: '#/components/schemas/Pagination'},
                                                            summary: {
                                                                type: 'object',
                                                                properties: {
                                                                    averageRating: {type: 'number'},
                                                                    totalReviews: {type: 'integer'},
                                                                    ratingDistribution: {
                                                                        type: 'object',
                                                                        properties: {
                                                                            '5': {type: 'integer'},
                                                                            '4': {type: 'integer'},
                                                                            '3': {type: 'integer'},
                                                                            '2': {type: 'integer'},
                                                                            '1': {type: 'integer'},
                                                                        },
                                                                    },
                                                                },
                                                            },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                                '404': {$ref: '#/components/responses/NotFoundError'},
                            },
                        },
                    },

                    '/reviews/product/{productId}': {
                        get: {
                            tags: ['⭐ Reviews'],
                            summary: 'Get product reviews',
                            description: 'Get all reviews for a specific product',
                            parameters: [
                                {$ref: '#/components/parameters/ProductIdParam'},
                                {$ref: '#/components/parameters/PageParam'},
                                {$ref: '#/components/parameters/LimitParam'},
                            ],
                            responses: {
                                '200': {
                                    description: 'List of product reviews',
                                    content: {
                                        'application/json': {
                                            schema: {
                                                type: 'object',
                                                properties: {
                                                    success: {type: 'boolean', example: true},
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            reviews: {
                                                                type: 'array',
                                                                items: {$ref: '#/components/schemas/Review'},
                                                            },
                                                            pagination: {$ref: '#/components/schemas/Pagination'},
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                                '404': {$ref: '#/components/responses/NotFoundError'},
                            },
                        },
                    },

                    '/reviews/{id}': {
                        delete: {
                            tags: ['⭐ Reviews'],
                            summary: 'Delete review',
                            description: 'Delete a review (reviewer or admin only)',
                            security: [{bearerAuth: []}],
                            parameters: [
                                {$ref: '#/components/parameters/ReviewIdParam'},
                            ],
                            responses: {
                                '200': {
                                    description: 'Review deleted',
                                    content: {
                                        'application/json': {
                                            example: {
                                                success: true,
                                                message: 'Review deleted successfully',
                                            },
                                        },
                                    },
                                },
                                '401': {$ref: '#/components/responses/UnauthorizedError'},
                                '403': {$ref: '#/components/responses/ForbiddenError'},
                                '404': {$ref: '#/components/responses/NotFoundError'},
                            },
                        },
                        put: {
                            tags: ['⭐ Reviews'],
                            summary: 'Update review',
                            description: 'Update a review (reviewer only)',
                            security: [{bearerAuth: []}],
                            parameters: [
                                {$ref: '#/components/parameters/ReviewIdParam'},
                            ],
                            requestBody: {
                                content: {
                                    'application/json': {
                                        schema: {
                                            type: 'object',
                                            properties: {
                                                rating: {type: 'integer', minimum: 1, maximum: 5},
                                                comment: {type: 'string'},
                                            },
                                        },
                                    },
                                },
                            },
                            responses: {
                                '200': {
                                    description: 'Review updated',
                                    content: {
                                        'application/json': {
                                            example: {
                                                success: true,
                                                data: {
                                                    review: {
                                                        id: '123e4567-e89b-12d3-a456-426614174007',
                                                        rating: 4,
                                                        comment: 'Updated comment',
                                                    },
                                                },
                                                message: 'Review updated successfully',
                                            },
                                        },
                                    },
                                },
                                '401': {$ref: '#/components/responses/UnauthorizedError'},
                                '403': {$ref: '#/components/responses/ForbiddenError'},
                                '404': {$ref: '#/components/responses/NotFoundError'},
                            },
                        },
                    },

                    // ==================== VIP ENDPOINTS ====================
                    '/vip/products': {
                        get: {
                            tags: ['💎 VIP'],
                            summary: 'Get VIP products',
                            description: 'Get all VIP products with different levels',
                            parameters: [
                                {$ref: '#/components/parameters/PageParam'},
                                {$ref: '#/components/parameters/LimitParam'},
                                {
                                    name: 'level',
                                    in: 'query',
                                    description: 'Filter by VIP level',
                                    schema: {
                                        type: 'string',
                                        enum: ['STANDARD', 'PREMIUM', 'MAXIMUM'],
                                    },
                                },
                            ],
                            responses: {
                                '200': {
                                    description: 'List of VIP products',
                                    content: {
                                        'application/json': {
                                            schema: {
                                                type: 'object',
                                                properties: {
                                                    success: {type: 'boolean', example: true},
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            products: {
                                                                type: 'array',
                                                                items: {$ref: '#/components/schemas/Product'},
                                                            },
                                                            pagination: {$ref: '#/components/schemas/Pagination'},
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },

                    '/vip/product/{productId}': {
                        post: {
                            tags: ['💎 VIP'],
                            summary: 'Upgrade to VIP',
                            description: 'Upgrade product to VIP status',
                            security: [{bearerAuth: []}],
                            parameters: [
                                {$ref: '#/components/parameters/ProductIdParam'},
                            ],
                            requestBody: {
                                required: true,
                                content: {
                                    'application/json': {
                                        schema: {
                                            type: 'object',
                                            required: ['level', 'duration'],
                                            properties: {
                                                level: {
                                                    type: 'string',
                                                    enum: ['STANDARD', 'PREMIUM', 'MAXIMUM']
                                                },
                                                duration: {
                                                    type: 'integer',
                                                    minimum: 1,
                                                    maximum: 365,
                                                    example: 7
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                            responses: {
                                '200': {
                                    description: 'VIP upgrade successful',
                                    content: {
                                        'application/json': {
                                            example: {
                                                success: true,
                                                data: {
                                                    subscription: {
                                                        id: '123e4567-e89b-12d3-a456-426614174008',
                                                        productId: '123e4567-e89b-12d3-a456-426614174001',
                                                        level: 'STANDARD',
                                                        amount: 50.00,
                                                        duration: 7,
                                                        expiresAt: '2024-01-22T10:30:00.000Z',
                                                    },
                                                    transaction: {
                                                        id: '123e4567-e89b-12d3-a456-426614174009',
                                                        type: 'VIP_PURCHASE',
                                                        amount: -50.00,
                                                        status: 'COMPLETED',
                                                    },
                                                },
                                                message: 'Product upgraded to VIP successfully',
                                            },
                                        },
                                    },
                                },
                                '401': {$ref: '#/components/responses/UnauthorizedError'},
                                '403': {$ref: '#/components/responses/ForbiddenError'},
                                '404': {$ref: '#/components/responses/NotFoundError'},
                                '400': {
                                    description: 'Insufficient balance',
                                    content: {
                                        'application/json': {
                                            example: {
                                                success: false,
                                                error: 'Insufficient balance for VIP upgrade',
                                                code: 'INSUFFICIENT_BALANCE',
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },

                    '/vip/user/subscriptions': {
                        get: {
                            tags: ['💎 VIP'],
                            summary: 'Get user VIP subscriptions',
                            description: 'Get all VIP subscriptions for current user',
                            security: [{bearerAuth: []}],
                            parameters: [
                                {$ref: '#/components/parameters/PageParam'},
                                {$ref: '#/components/parameters/LimitParam'},
                                {
                                    name: 'activeOnly',
                                    in: 'query',
                                    description: 'Show only active subscriptions',
                                    schema: {type: 'boolean', default: true},
                                },
                            ],
                            responses: {
                                '200': {
                                    description: 'List of VIP subscriptions',
                                    content: {
                                        'application/json': {
                                            schema: {
                                                type: 'object',
                                                properties: {
                                                    success: {type: 'boolean', example: true},
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            subscriptions: {
                                                                type: 'array',
                                                                items: {$ref: '#/components/schemas/VIPSubscription'},
                                                            },
                                                            pagination: {$ref: '#/components/schemas/Pagination'},
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                                '401': {$ref: '#/components/responses/UnauthorizedError'},
                            },
                        },
                    },

                    '/vip/benefits': {
                        get: {
                            tags: ['💎 VIP'],
                            summary: 'Get VIP benefits',
                            description: 'Get information about VIP benefits at each level',
                            responses: {
                                '200': {
                                    description: 'VIP benefits information',
                                    content: {
                                        'application/json': {
                                            example: {
                                                success: true,
                                                data: {
                                                    benefits: [
                                                        {
                                                            level: 'STANDARD',
                                                            price: 50.00,
                                                            duration: 7,
                                                            features: [
                                                                'Priority in search results',
                                                                '5% commission discount',
                                                                'STANDARD badge',
                                                                'Increased visibility',
                                                            ],
                                                        },
                                                        {
                                                            level: 'PREMIUM',
                                                            price: 150.00,
                                                            duration: 30,
                                                            features: [
                                                                'All STANDARD features',
                                                                'Premium badge',
                                                                '10% commission discount',
                                                                'Featured in VIP section',
                                                                'Detailed analytics',
                                                            ],
                                                        },
                                                        {
                                                            level: 'MAXIMUM',
                                                            price: 400.00,
                                                            duration: 90,
                                                            features: [
                                                                'All PREMIUM features',
                                                                'Maximum badge',
                                                                '15% commission discount',
                                                                'Top placement in search',
                                                                'Priority support',
                                                                'Advanced analytics dashboard',
                                                            ],
                                                        },
                                                    ],
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },

                    // ==================== PAYMENT ENDPOINTS ====================
                    '/payments/setup-intent': {
                        post: {
                            tags: ['💰 Payments'],
                            summary: 'Create setup intent',
                            description: 'Create Stripe setup intent for saving payment methods',
                            security: [{bearerAuth: []}],
                            responses: {
                                '200': {
                                    description: 'Setup intent created',
                                    content: {
                                        'application/json': {
                                            example: {
                                                success: true,
                                                data: {
                                                    clientSecret: 'seti_123456789_secret_abcdef',
                                                    intentId: 'seti_123456789',
                                                },
                                                message: 'Setup intent created successfully',
                                            },
                                        },
                                    },
                                },
                                '401': {$ref: '#/components/responses/UnauthorizedError'},
                            },
                        },
                    },

                    '/payments/payment-methods': {
                        get: {
                            tags: ['💰 Payments'],
                            summary: 'Get payment methods',
                            description: 'Get user saved payment methods',
                            security: [{bearerAuth: []}],
                            responses: {
                                '200': {
                                    description: 'List of payment methods',
                                    content: {
                                        'application/json': {
                                            example: {
                                                success: true,
                                                data: {
                                                    paymentMethods: [
                                                        {
                                                            id: 'pm_123456789',
                                                            type: 'card',
                                                            brand: 'visa',
                                                            last4: '4242',
                                                            expMonth: 12,
                                                            expYear: 2025,
                                                            isDefault: true,
                                                        },
                                                    ],
                                                },
                                            },
                                        },
                                    },
                                },
                                '401': {$ref: '#/components/responses/UnauthorizedError'},
                            },
                        },
                    },

                    '/payments/payment-methods/{id}/default': {
                        post: {
                            tags: ['💰 Payments'],
                            summary: 'Set default payment method',
                            description: 'Set a payment method as default',
                            security: [{bearerAuth: []}],
                            parameters: [
                                {
                                    name: 'id',
                                    in: 'path',
                                    required: true,
                                    description: 'Payment method ID',
                                    schema: {type: 'string'},
                                },
                            ],
                            responses: {
                                '200': {
                                    description: 'Default payment method set',
                                    content: {
                                        'application/json': {
                                            example: {
                                                success: true,
                                                message: 'Default payment method set successfully',
                                            },
                                        },
                                    },
                                },
                                '401': {$ref: '#/components/responses/UnauthorizedError'},
                                '404': {
                                    description: 'Payment method not found',
                                    content: {
                                        'application/json': {
                                            example: {
                                                success: false,
                                                error: 'Payment method not found',
                                                code: 'PAYMENT_METHOD_NOT_FOUND',
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },

                    '/payments/payment-methods/{id}': {
                        delete: {
                            tags: ['💰 Payments'],
                            summary: 'Remove payment method',
                            description: 'Remove a saved payment method',
                            security: [{bearerAuth: []}],
                            parameters: [
                                {
                                    name: 'id',
                                    in: 'path',
                                    required: true,
                                    description: 'Payment method ID',
                                    schema: {type: 'string'},
                                },
                            ],
                            responses: {
                                '200': {
                                    description: 'Payment method removed',
                                    content: {
                                        'application/json': {
                                            example: {
                                                success: true,
                                                message: 'Payment method removed successfully',
                                            },
                                        },
                                    },
                                },
                                '401': {$ref: '#/components/responses/UnauthorizedError'},
                                '404': {
                                    description: 'Payment method not found',
                                    content: {
                                        'application/json': {
                                            example: {
                                                success: false,
                                                error: 'Payment method not found',
                                                code: 'PAYMENT_METHOD_NOT_FOUND',
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },

                    // ==================== TRANSACTION ENDPOINTS ====================
                    '/transactions': {
                        get: {
                            tags: ['💰 Payments'],
                            summary: 'Get user transactions',
                            description: 'Get transaction history for current user',
                            security: [{bearerAuth: []}],
                            parameters: [
                                {$ref: '#/components/parameters/PageParam'},
                                {$ref: '#/components/parameters/LimitParam'},
                                {
                                    name: 'type',
                                    in: 'query',
                                    description: 'Filter by transaction type',
                                    schema: {
                                        type: 'string',
                                        enum: [
                                            'DEPOSIT',
                                            'WITHDRAWAL_REQUEST',
                                            'WITHDRAWAL_COMPLETED',
                                            'RENTAL_INCOME',
                                            'COMMISSION',
                                            'REFUND',
                                            'VIP_PURCHASE',
                                        ],
                                    },
                                },
                                {
                                    name: 'startDate',
                                    in: 'query',
                                    description: 'Start date filter',
                                    schema: {type: 'string', format: 'date'},
                                },
                                {
                                    name: 'endDate',
                                    in: 'query',
                                    description: 'End date filter',
                                    schema: {type: 'string', format: 'date'},
                                },
                            ],
                            responses: {
                                '200': {
                                    description: 'List of transactions',
                                    content: {
                                        'application/json': {
                                            schema: {
                                                type: 'object',
                                                properties: {
                                                    success: {type: 'boolean', example: true},
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            transactions: {
                                                                type: 'array',
                                                                items: {$ref: '#/components/schemas/Transaction'},
                                                            },
                                                            pagination: {$ref: '#/components/schemas/Pagination'},
                                                            summary: {
                                                                type: 'object',
                                                                properties: {
                                                                    totalIncome: {type: 'number'},
                                                                    totalExpenses: {type: 'number'},
                                                                    currentBalance: {type: 'number'},
                                                                },
                                                            },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                                '401': {$ref: '#/components/responses/UnauthorizedError'},
                            },
                        },
                    },

                    '/transactions/{id}': {
                        get: {
                            tags: ['💰 Payments'],
                            summary: 'Get transaction details',
                            description: 'Get detailed information about a transaction',
                            security: [{bearerAuth: []}],
                            parameters: [
                                {$ref: '#/components/parameters/TransactionIdParam'},
                            ],
                            responses: {
                                '200': {
                                    description: 'Transaction details',
                                    content: {
                                        'application/json': {
                                            schema: {
                                                type: 'object',
                                                properties: {
                                                    success: {type: 'boolean', example: true},
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            transaction: {$ref: '#/components/schemas/Transaction'},
                                                            relatedRental: {$ref: '#/components/schemas/Rental'},
                                                            relatedProduct: {$ref: '#/components/schemas/Product'},
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                                '401': {$ref: '#/components/responses/UnauthorizedError'},
                                '404': {$ref: '#/components/responses/NotFoundError'},
                            },
                        },
                    },

                    // ==================== WITHDRAWAL ENDPOINTS ====================
                    '/withdrawals/request': {
                        post: {
                            tags: ['🏦 Withdrawals'],
                            summary: 'Request withdrawal',
                            description: 'Request withdrawal of available balance',
                            security: [{bearerAuth: []}],
                            requestBody: {
                                required: true,
                                content: {
                                    'application/json': {
                                        schema: {
                                            type: 'object',
                                            required: ['amount'],
                                            properties: {
                                                amount: {
                                                    type: 'number',
                                                    minimum: 100,
                                                    example: 500.00
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                            responses: {
                                '201': {
                                    description: 'Withdrawal request created',
                                    content: {
                                        'application/json': {
                                            example: {
                                                success: true,
                                                data: {
                                                    withdrawal: {
                                                        id: '123e4567-e89b-12d3-a456-426614174010',
                                                        amount: 500.00,
                                                        status: 'PENDING',
                                                        createdAt: '2024-01-15T10:30:00.000Z',
                                                    },
                                                    transaction: {
                                                        id: '123e4567-e89b-12d3-a456-426614174011',
                                                        type: 'WITHDRAWAL_REQUEST',
                                                        amount: -500.00,
                                                        status: 'PENDING',
                                                    },
                                                },
                                                message: 'Withdrawal request created successfully',
                                            },
                                        },
                                    },
                                },
                                '401': {$ref: '#/components/responses/UnauthorizedError'},
                                '400': {
                                    description: 'Insufficient balance',
                                    content: {
                                        'application/json': {
                                            example: {
                                                success: false,
                                                error: 'Insufficient available balance',
                                                code: 'INSUFFICIENT_BALANCE',
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },

                    '/withdrawals/user/requests': {
                        get: {
                            tags: ['🏦 Withdrawals'],
                            summary: 'Get user withdrawal requests',
                            description: 'Get withdrawal history for current user',
                            security: [{bearerAuth: []}],
                            parameters: [
                                {$ref: '#/components/parameters/PageParam'},
                                {$ref: '#/components/parameters/LimitParam'},
                                {
                                    name: 'status',
                                    in: 'query',
                                    description: 'Filter by status',
                                    schema: {
                                        type: 'string',
                                        enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'FAILED'],
                                    },
                                },
                            ],
                            responses: {
                                '200': {
                                    description: 'List of withdrawal requests',
                                    content: {
                                        'application/json': {
                                            schema: {
                                                type: 'object',
                                                properties: {
                                                    success: {type: 'boolean', example: true},
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            withdrawals: {
                                                                type: 'array',
                                                                items: {
                                                                    type: 'object',
                                                                    properties: {
                                                                        id: {type: 'string', format: 'uuid'},
                                                                        amount: {type: 'number'},
                                                                        status: {type: 'string'},
                                                                        createdAt: {
                                                                            type: 'string',
                                                                            format: 'date-time'
                                                                        },
                                                                        processedAt: {
                                                                            type: 'string',
                                                                            format: 'date-time'
                                                                        },
                                                                    },
                                                                },
                                                            },
                                                            pagination: {$ref: '#/components/schemas/Pagination'},
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                                '401': {$ref: '#/components/responses/UnauthorizedError'},
                            },
                        },
                    },

                    '/withdrawals/{id}/cancel': {
                        post: {
                            tags: ['🏦 Withdrawals'],
                            summary: 'Cancel withdrawal request',
                            description: 'Cancel a pending withdrawal request',
                            security: [{bearerAuth: []}],
                            parameters: [
                                {$ref: '#/components/parameters/IdParam'},
                            ],
                            responses: {
                                '200': {
                                    description: 'Withdrawal cancelled',
                                    content: {
                                        'application/json': {
                                            example: {
                                                success: true,
                                                data: {
                                                    withdrawal: {
                                                        id: '123e4567-e89b-12d3-a456-426614174010',
                                                        status: 'CANCELLED',
                                                    },
                                                    transaction: {
                                                        id: '123e4567-e89b-12d3-a456-426614174011',
                                                        type: 'WITHDRAWAL_REVERSAL',
                                                        amount: 500.00,
                                                        status: 'COMPLETED',
                                                    },
                                                },
                                                message: 'Withdrawal request cancelled successfully',
                                            },
                                        },
                                    },
                                },
                                '401': {$ref: '#/components/responses/UnauthorizedError'},
                                '403': {$ref: '#/components/responses/ForbiddenError'},
                                '404': {$ref: '#/components/responses/NotFoundError'},
                                '400': {
                                    description: 'Cannot cancel withdrawal',
                                    content: {
                                        'application/json': {
                                            example: {
                                                success: false,
                                                error: 'Cannot cancel withdrawal that is already processing',
                                                code: 'WITHDRAWAL_IN_PROGRESS',
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },

                    // ==================== OWNER STATISTICS ENDPOINTS ====================
                    '/stats/owner/dashboard': {
                        get: {
                            tags: ['📊 Owner Stats'],
                            summary: 'Get owner dashboard statistics',
                            description: 'Get comprehensive statistics for product owner',
                            security: [{bearerAuth: []}],
                            parameters: [
                                {
                                    name: 'timeRange',
                                    in: 'query',
                                    description: 'Time range for statistics',
                                    schema: {
                                        type: 'string',
                                        enum: ['7d', '30d', '90d', '1y', 'all'],
                                        default: '30d',
                                    },
                                },
                            ],
                            responses: {
                                '200': {
                                    description: 'Owner dashboard statistics',
                                    content: {
                                        'application/json': {
                                            example: {
                                                success: true,
                                                data: {
                                                    overview: {
                                                        totalProducts: 5,
                                                        activeProducts: 3,
                                                        totalEarnings: 12500.00,
                                                        pendingEarnings: 1200.00,
                                                        totalRentals: 25,
                                                        rating: 4.8,
                                                    },
                                                    recentActivity: [
                                                        {
                                                            type: 'RENTAL',
                                                            title: 'New rental request',
                                                            date: '2024-01-15T10:30:00.000Z',
                                                            amount: 840.00,
                                                        },
                                                    ],
                                                    earningsChart: {
                                                        labels: ['Jan', 'Feb', 'Mar'],
                                                        data: [1200, 1800, 2400],
                                                    },
                                                    topProducts: [
                                                        {
                                                            productId: '123e4567-e89b-12d3-a456-426614174001',
                                                            title: 'Professional Camera',
                                                            earnings: 5000.00,
                                                            rentals: 12,
                                                            rating: 4.9,
                                                        },
                                                    ],
                                                },
                                            },
                                        },
                                    },
                                },
                                '401': {$ref: '#/components/responses/UnauthorizedError'},
                                '403': {
                                    description: 'User is not an owner',
                                    content: {
                                        'application/json': {
                                            example: {
                                                success: false,
                                                error: 'User must be an owner to access statistics',
                                                code: 'NOT_AN_OWNER',
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },

                    '/stats/owner/product/{productId}': {
                        get: {
                            tags: ['📊 Owner Stats'],
                            summary: 'Get product statistics',
                            description: 'Get detailed statistics for a specific product',
                            security: [{bearerAuth: []}],
                            parameters: [
                                {$ref: '#/components/parameters/ProductIdParam'},
                            ],
                            responses: {
                                '200': {
                                    description: 'Product statistics',
                                    content: {
                                        'application/json': {
                                            example: {
                                                success: true,
                                                data: {
                                                    product: {
                                                        id: '123e4567-e89b-12d3-a456-426614174001',
                                                        title: 'Professional Camera',
                                                        views: 245,
                                                        favorites: 18,
                                                    },
                                                    performance: {
                                                        totalEarnings: 5000.00,
                                                        totalRentals: 12,
                                                        occupancyRate: '68%',
                                                        averageDuration: 7.5,
                                                        conversionRate: '4.9%',
                                                    },
                                                    rentalHistory: [
                                                        {
                                                            date: '2024-01-10',
                                                            duration: 7,
                                                            earnings: 840.00,
                                                            rating: 5,
                                                        },
                                                    ],
                                                    calendar: {
                                                        bookedDates: ['2024-01-20', '2024-01-21'],
                                                        availableDates: ['2024-01-22', '2024-01-23'],
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                                '401': {$ref: '#/components/responses/UnauthorizedError'},
                                '403': {$ref: '#/components/responses/ForbiddenError'},
                                '404': {$ref: '#/components/responses/NotFoundError'},
                            },
                        },
                    },

                    // ==================== ADMIN ENDPOINTS ====================
                    '/admin/users': {
                        get: {
                            tags: ['👑 Admin'],
                            summary: 'Get all users',
                            description: 'Get paginated list of all users (ADMIN only)',
                            security: [{adminAuth: []}],
                            parameters: [
                                {$ref: '#/components/parameters/PageParam'},
                                {$ref: '#/components/parameters/LimitParam'},
                                {$ref: '#/components/parameters/SearchParam'},
                                {
                                    name: 'role',
                                    in: 'query',
                                    description: 'Filter by user role',
                                    schema: {
                                        type: 'string',
                                        enum: ['USER', 'OWNER', 'ADMIN'],
                                    },
                                },
                                {
                                    name: 'status',
                                    in: 'query',
                                    description: 'Filter by user status',
                                    schema: {
                                        type: 'string',
                                        enum: ['PENDING', 'ACTIVE', 'SUSPENDED', 'BANNED'],
                                    },
                                },
                                {
                                    name: 'verified',
                                    in: 'query',
                                    description: 'Filter by verification status',
                                    schema: {type: 'boolean'},
                                },
                            ],
                            responses: {
                                '200': {
                                    description: 'List of users',
                                    content: {
                                        'application/json': {
                                            schema: {
                                                type: 'object',
                                                properties: {
                                                    success: {type: 'boolean', example: true},
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            users: {
                                                                type: 'array',
                                                                items: {$ref: '#/components/schemas/User'},
                                                            },
                                                            pagination: {$ref: '#/components/schemas/Pagination'},
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                                '401': {$ref: '#/components/responses/UnauthorizedError'},
                                '403': {$ref: '#/components/responses/ForbiddenError'},
                            },
                        },
                    },

                    '/admin/users/{userId}/status': {
                        put: {
                            tags: ['👑 Admin'],
                            summary: 'Update user status',
                            description: 'Update user status (ADMIN only)',
                            security: [{adminAuth: []}],
                            parameters: [
                                {$ref: '#/components/parameters/UserIdParam'},
                            ],
                            requestBody: {
                                required: true,
                                content: {
                                    'application/json': {
                                        schema: {
                                            type: 'object',
                                            required: ['status'],
                                            properties: {
                                                status: {
                                                    type: 'string',
                                                    enum: ['ACTIVE', 'SUSPENDED', 'BANNED']
                                                },
                                                reason: {
                                                    type: 'string',
                                                    example: 'Violation of terms of service'
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                            responses: {
                                '200': {
                                    description: 'User status updated',
                                    content: {
                                        'application/json': {
                                            example: {
                                                success: true,
                                                data: {
                                                    user: {
                                                        id: '123e4567-e89b-12d3-a456-426614174000',
                                                        status: 'SUSPENDED',
                                                    },
                                                },
                                                message: 'User status updated successfully',
                                            },
                                        },
                                    },
                                },
                                '401': {$ref: '#/components/responses/UnauthorizedError'},
                                '403': {$ref: '#/components/responses/ForbiddenError'},
                                '404': {$ref: '#/components/responses/NotFoundError'},
                            },
                        },
                    },

                    '/admin/users/{userId}/role': {
                        put: {
                            tags: ['👑 Admin'],
                            summary: 'Update user role',
                            description: 'Update user role (ADMIN only)',
                            security: [{adminAuth: []}],
                            parameters: [
                                {$ref: '#/components/parameters/UserIdParam'},
                            ],
                            requestBody: {
                                required: true,
                                content: {
                                    'application/json': {
                                        schema: {
                                            type: 'object',
                                            required: ['role'],
                                            properties: {
                                                role: {
                                                    type: 'string',
                                                    enum: ['USER', 'OWNER', 'ADMIN']
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                            responses: {
                                '200': {
                                    description: 'User role updated',
                                    content: {
                                        'application/json': {
                                            example: {
                                                success: true,
                                                data: {
                                                    user: {
                                                        id: '123e4567-e89b-12d3-a456-426614174000',
                                                        role: 'ADMIN',
                                                    },
                                                },
                                                message: 'User role updated successfully',
                                            },
                                        },
                                    },
                                },
                                '401': {$ref: '#/components/responses/UnauthorizedError'},
                                '403': {$ref: '#/components/responses/ForbiddenError'},
                                '404': {$ref: '#/components/responses/NotFoundError'},
                            },
                        },
                    },

                    '/admin/products': {
                        get: {
                            tags: ['👑 Admin'],
                            summary: 'Get all products',
                            description: 'Get paginated list of all products (ADMIN only)',
                            security: [{adminAuth: []}],
                            parameters: [
                                {$ref: '#/components/parameters/PageParam'},
                                {$ref: '#/components/parameters/LimitParam'},
                                {
                                    name: 'status',
                                    in: 'query',
                                    description: 'Filter by product status',
                                    schema: {
                                        type: 'string',
                                        enum: ['DRAFT', 'ACTIVE', 'INACTIVE', 'BANNED', 'ARCHIVED'],
                                    },
                                },
                                {
                                    name: 'ownerId',
                                    in: 'query',
                                    description: 'Filter by owner ID',
                                    schema: {type: 'string', format: 'uuid'},
                                },
                            ],
                            responses: {
                                '200': {
                                    description: 'List of products',
                                    content: {
                                        'application/json': {
                                            schema: {
                                                type: 'object',
                                                properties: {
                                                    success: {type: 'boolean', example: true},
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            products: {
                                                                type: 'array',
                                                                items: {$ref: '#/components/schemas/Product'},
                                                            },
                                                            pagination: {$ref: '#/components/schemas/Pagination'},
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                                '401': {$ref: '#/components/responses/UnauthorizedError'},
                                '403': {$ref: '#/components/responses/ForbiddenError'},
                            },
                        },
                    },

                    '/admin/products/{productId}/status': {
                        put: {
                            tags: ['👑 Admin'],
                            summary: 'Update product status',
                            description: 'Update product status (ADMIN only)',
                            security: [{adminAuth: []}],
                            parameters: [
                                {$ref: '#/components/parameters/ProductIdParam'},
                            ],
                            requestBody: {
                                required: true,
                                content: {
                                    'application/json': {
                                        schema: {
                                            type: 'object',
                                            required: ['status'],
                                            properties: {
                                                status: {
                                                    type: 'string',
                                                    enum: ['ACTIVE', 'INACTIVE', 'BANNED']
                                                },
                                                reason: {
                                                    type: 'string',
                                                    example: 'Violation of community guidelines'
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                            responses: {
                                '200': {
                                    description: 'Product status updated',
                                    content: {
                                        'application/json': {
                                            example: {
                                                success: true,
                                                data: {
                                                    product: {
                                                        id: '123e4567-e89b-12d3-a456-426614174001',
                                                        status: 'BANNED',
                                                    },
                                                },
                                                message: 'Product status updated successfully',
                                            },
                                        },
                                    },
                                },
                                '401': {$ref: '#/components/responses/UnauthorizedError'},
                                '403': {$ref: '#/components/responses/ForbiddenError'},
                                '404': {$ref: '#/components/responses/NotFoundError'},
                            },
                        },
                    },

                    '/admin/rentals': {
                        get: {
                            tags: ['👑 Admin'],
                            summary: 'Get all rentals',
                            description: 'Get paginated list of all rentals (ADMIN only)',
                            security: [{adminAuth: []}],
                            parameters: [
                                {$ref: '#/components/parameters/PageParam'},
                                {$ref: '#/components/parameters/LimitParam'},
                                {
                                    name: 'status',
                                    in: 'query',
                                    description: 'Filter by rental status',
                                    schema: {
                                        type: 'string',
                                        enum: ['PENDING', 'CONFIRMED', 'PAID', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED'],
                                    },
                                },
                                {
                                    name: 'startDate',
                                    in: 'query',
                                    description: 'Filter by start date',
                                    schema: {type: 'string', format: 'date'},
                                },
                                {
                                    name: 'endDate',
                                    in: 'query',
                                    description: 'Filter by end date',
                                    schema: {type: 'string', format: 'date'},
                                },
                            ],
                            responses: {
                                '200': {
                                    description: 'List of rentals',
                                    content: {
                                        'application/json': {
                                            schema: {
                                                type: 'object',
                                                properties: {
                                                    success: {type: 'boolean', example: true},
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            rentals: {
                                                                type: 'array',
                                                                items: {$ref: '#/components/schemas/Rental'},
                                                            },
                                                            pagination: {$ref: '#/components/schemas/Pagination'},
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                                '401': {$ref: '#/components/responses/UnauthorizedError'},
                                '403': {$ref: '#/components/responses/ForbiddenError'},
                            },
                        },
                    },

                    '/admin/transactions': {
                        get: {
                            tags: ['👑 Admin'],
                            summary: 'Get all transactions',
                            description: 'Get paginated list of all transactions (ADMIN only)',
                            security: [{adminAuth: []}],
                            parameters: [
                                {$ref: '#/components/parameters/PageParam'},
                                {$ref: '#/components/parameters/LimitParam'},
                                {
                                    name: 'type',
                                    in: 'query',
                                    description: 'Filter by transaction type',
                                    schema: {
                                        type: 'string',
                                        enum: [
                                            'DEPOSIT',
                                            'WITHDRAWAL_REQUEST',
                                            'WITHDRAWAL_COMPLETED',
                                            'RENTAL_INCOME',
                                            'COMMISSION',
                                            'REFUND',
                                            'VIP_PURCHASE',
                                        ],
                                    },
                                },
                                {
                                    name: 'userId',
                                    in: 'query',
                                    description: 'Filter by user ID',
                                    schema: {type: 'string', format: 'uuid'},
                                },
                            ],
                            responses: {
                                '200': {
                                    description: 'List of transactions',
                                    content: {
                                        'application/json': {
                                            schema: {
                                                type: 'object',
                                                properties: {
                                                    success: {type: 'boolean', example: true},
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            transactions: {
                                                                type: 'array',
                                                                items: {$ref: '#/components/schemas/Transaction'},
                                                            },
                                                            pagination: {$ref: '#/components/schemas/Pagination'},
                                                            totals: {
                                                                type: 'object',
                                                                properties: {
                                                                    platformRevenue: {type: 'number'},
                                                                    totalVolume: {type: 'number'},
                                                                    activeUsers: {type: 'integer'},
                                                                },
                                                            },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                                '401': {$ref: '#/components/responses/UnauthorizedError'},
                                '403': {$ref: '#/components/responses/ForbiddenError'},
                            },
                        },
                    },

                    '/admin/withdrawals': {
                        get: {
                            tags: ['👑 Admin'],
                            summary: 'Get all withdrawals',
                            description: 'Get paginated list of all withdrawal requests (ADMIN only)',
                            security: [{adminAuth: []}],
                            parameters: [
                                {$ref: '#/components/parameters/PageParam'},
                                {$ref: '#/components/parameters/LimitParam'},
                                {
                                    name: 'status',
                                    in: 'query',
                                    description: 'Filter by status',
                                    schema: {
                                        type: 'string',
                                        enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'FAILED'],
                                    },
                                },
                            ],
                            responses: {
                                '200': {
                                    description: 'List of withdrawals',
                                    content: {
                                        'application/json': {
                                            schema: {
                                                type: 'object',
                                                properties: {
                                                    success: {type: 'boolean', example: true},
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            withdrawals: {
                                                                type: 'array',
                                                                items: {
                                                                    type: 'object',
                                                                    properties: {
                                                                        id: {type: 'string', format: 'uuid'},
                                                                        userId: {type: 'string', format: 'uuid'},
                                                                        amount: {type: 'number'},
                                                                        status: {type: 'string'},
                                                                        createdAt: {
                                                                            type: 'string',
                                                                            format: 'date-time'
                                                                        },
                                                                        user: {$ref: '#/components/schemas/User'},
                                                                    },
                                                                },
                                                            },
                                                            pagination: {$ref: '#/components/schemas/Pagination'},
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                                '401': {$ref: '#/components/responses/UnauthorizedError'},
                                '403': {$ref: '#/components/responses/ForbiddenError'},
                            },
                        },
                    },

                    '/admin/withdrawals/{id}/process': {
                        post: {
                            tags: ['👑 Admin'],
                            summary: 'Process withdrawal',
                            description: 'Process a pending withdrawal request (ADMIN only)',
                            security: [{adminAuth: []}],
                            parameters: [
                                {$ref: '#/components/parameters/IdParam'},
                            ],
                            responses: {
                                '200': {
                                    description: 'Withdrawal processed',
                                    content: {
                                        'application/json': {
                                            example: {
                                                success: true,
                                                data: {
                                                    withdrawal: {
                                                        id: '123e4567-e89b-12d3-a456-426614174010',
                                                        status: 'COMPLETED',
                                                        processedAt: '2024-01-15T11:30:00.000Z',
                                                    },
                                                    transaction: {
                                                        id: '123e4567-e89b-12d3-a456-426614174011',
                                                        type: 'WITHDRAWAL_COMPLETED',
                                                        status: 'COMPLETED',
                                                    },
                                                },
                                                message: 'Withdrawal processed successfully',
                                            },
                                        },
                                    },
                                },
                                '401': {$ref: '#/components/responses/UnauthorizedError'},
                                '403': {$ref: '#/components/responses/ForbiddenError'},
                                '404': {$ref: '#/components/responses/NotFoundError'},
                            },
                        },
                    },

                    '/admin/disputes': {
                        get: {
                            tags: ['👑 Admin'],
                            summary: 'Get all disputes',
                            description: 'Get paginated list of all disputes (ADMIN only)',
                            security: [{adminAuth: []}],
                            parameters: [
                                {$ref: '#/components/parameters/PageParam'},
                                {$ref: '#/components/parameters/LimitParam'},
                                {
                                    name: 'status',
                                    in: 'query',
                                    description: 'Filter by dispute status',
                                    schema: {
                                        type: 'string',
                                        enum: ['OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED'],
                                    },
                                },
                            ],
                            responses: {
                                '200': {
                                    description: 'List of disputes',
                                    content: {
                                        'application/json': {
                                            schema: {
                                                type: 'object',
                                                properties: {
                                                    success: {type: 'boolean', example: true},
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            disputes: {
                                                                type: 'array',
                                                                items: {
                                                                    type: 'object',
                                                                    properties: {
                                                                        id: {type: 'string', format: 'uuid'},
                                                                        rentalId: {type: 'string', format: 'uuid'},
                                                                        status: {type: 'string'},
                                                                        reason: {type: 'string'},
                                                                        createdAt: {
                                                                            type: 'string',
                                                                            format: 'date-time'
                                                                        },
                                                                        rental: {$ref: '#/components/schemas/Rental'},
                                                                    },
                                                                },
                                                            },
                                                            pagination: {$ref: '#/components/schemas/Pagination'},
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                                '401': {$ref: '#/components/responses/UnauthorizedError'},
                                '403': {$ref: '#/components/responses/ForbiddenError'},
                            },
                        },
                    },

                    '/admin/disputes/{id}/resolve': {
                        post: {
                            tags: ['👑 Admin'],
                            summary: 'Resolve dispute',
                            description: 'Resolve a dispute (ADMIN only)',
                            security: [{adminAuth: []}],
                            parameters: [
                                {$ref: '#/components/parameters/IdParam'},
                            ],
                            requestBody: {
                                required: true,
                                content: {
                                    'application/json': {
                                        schema: {
                                            type: 'object',
                                            required: ['decision'],
                                            properties: {
                                                decision: {
                                                    type: 'string',
                                                    enum: ['REFUND_RENTER', 'PAY_OWNER', 'PARTIAL_REFUND', 'NO_ACTION']
                                                },
                                                refundAmount: {type: 'number'},
                                                explanation: {type: 'string'},
                                            },
                                        },
                                    },
                                },
                            },
                            responses: {
                                '200': {
                                    description: 'Dispute resolved',
                                    content: {
                                        'application/json': {
                                            example: {
                                                success: true,
                                                data: {
                                                    dispute: {
                                                        id: '123e4567-e89b-12d3-a456-426614174006',
                                                        status: 'RESOLVED',
                                                    },
                                                    actions: [
                                                        {
                                                            type: 'REFUND',
                                                            amount: 420.00,
                                                            userId: '123e4567-e89b-12d3-a456-426614174004',
                                                        },
                                                    ],
                                                },
                                                message: 'Dispute resolved successfully',
                                            },
                                        },
                                    },
                                },
                                '401': {$ref: '#/components/responses/UnauthorizedError'},
                                '403': {$ref: '#/components/responses/ForbiddenError'},
                                '404': {$ref: '#/components/responses/NotFoundError'},
                            },
                        },
                    },

                    '/admin/stats/dashboard': {
                        get: {
                            tags: ['👑 Admin'],
                            summary: 'Get admin dashboard statistics',
                            description: 'Get comprehensive platform statistics (ADMIN only)',
                            security: [{adminAuth: []}],
                            parameters: [
                                {$ref: '#/components/parameters/TimeRangeParam'},
                            ],
                            responses: {
                                '200': {
                                    description: 'Admin dashboard statistics',
                                    content: {
                                        'application/json': {
                                            example: {
                                                success: true,
                                                data: {
                                                    overview: {
                                                        totalUsers: 1250,
                                                        newUsers: 45,
                                                        totalProducts: 320,
                                                        activeRentals: 28,
                                                        totalRevenue: 125000.00,
                                                        platformEarnings: 12500.00,
                                                    },
                                                    growth: {
                                                        usersGrowth: '12.5%',
                                                        revenueGrowth: '8.3%',
                                                        rentalsGrowth: '15.2%',
                                                    },
                                                    charts: {
                                                        revenueTrend: {
                                                            labels: ['Jan', 'Feb', 'Mar'],
                                                            data: [25000, 30000, 35000],
                                                        },
                                                        userSignups: {
                                                            labels: ['Jan', 'Feb', 'Mar'],
                                                            data: [120, 150, 180],
                                                        },
                                                    },
                                                    topCategories: [
                                                        {name: 'Electronics', count: 85, revenue: 45000},
                                                        {name: 'Tools', count: 45, revenue: 25000},
                                                    ],
                                                    recentActivities: [
                                                        {
                                                            type: 'USER_SIGNUP',
                                                            description: 'New user registered',
                                                            timestamp: '2024-01-15T10:30:00.000Z',
                                                        },
                                                    ],
                                                },
                                            },
                                        },
                                    },
                                },
                                '401': {$ref: '#/components/responses/UnauthorizedError'},
                                '403': {$ref: '#/components/responses/ForbiddenError'},
                            },
                        },
                    },

                    // ==================== NOTIFICATION ENDPOINTS ====================
                    '/notifications': {
                        get: {
                            tags: ['🔔 Notifications'],
                            summary: 'Get user notifications',
                            description: 'Get notifications for current user',
                            security: [{bearerAuth: []}],
                            parameters: [
                                {$ref: '#/components/parameters/PageParam'},
                                {$ref: '#/components/parameters/LimitParam'},
                                {
                                    name: 'unreadOnly',
                                    in: 'query',
                                    description: 'Show only unread notifications',
                                    schema: {type: 'boolean', default: false},
                                },
                                {
                                    name: 'type',
                                    in: 'query',
                                    description: 'Filter by notification type',
                                    schema: {
                                        type: 'string',
                                        enum: [
                                            'RENTAL_REQUEST',
                                            'RENTAL_CONFIRMED',
                                            'PAYMENT_RECEIVED',
                                            'REVIEW_RECEIVED',
                                            'SYSTEM_ALERT',
                                        ],
                                    },
                                },
                            ],
                            responses: {
                                '200': {
                                    description: 'List of notifications',
                                    content: {
                                        'application/json': {
                                            schema: {
                                                type: 'object',
                                                properties: {
                                                    success: {type: 'boolean', example: true},
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            notifications: {
                                                                type: 'array',
                                                                items: {$ref: '#/components/schemas/Notification'},
                                                            },
                                                            pagination: {$ref: '#/components/schemas/Pagination'},
                                                            unreadCount: {type: 'integer'},
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                                '401': {$ref: '#/components/responses/UnauthorizedError'},
                            },
                        },
                    },

                    '/notifications/read-all': {
                        post: {
                            tags: ['🔔 Notifications'],
                            summary: 'Mark all as read',
                            description: 'Mark all notifications as read',
                            security: [{bearerAuth: []}],
                            responses: {
                                '200': {
                                    description: 'All notifications marked as read',
                                    content: {
                                        'application/json': {
                                            example: {
                                                success: true,
                                                message: 'All notifications marked as read',
                                            },
                                        },
                                    },
                                },
                                '401': {$ref: '#/components/responses/UnauthorizedError'},
                            },
                        },
                    },

                    '/notifications/{id}/read': {
                        post: {
                            tags: ['🔔 Notifications'],
                            summary: 'Mark as read',
                            description: 'Mark a specific notification as read',
                            security: [{bearerAuth: []}],
                            parameters: [
                                {$ref: '#/components/parameters/IdParam'},
                            ],
                            responses: {
                                '200': {
                                    description: 'Notification marked as read',
                                    content: {
                                        'application/json': {
                                            example: {
                                                success: true,
                                                data: {
                                                    notification: {
                                                        id: '123e4567-e89b-12d3-a456-426614174012',
                                                        isRead: true,
                                                        readAt: '2024-01-15T10:30:00.000Z',
                                                    },
                                                },
                                                message: 'Notification marked as read',
                                            },
                                        },
                                    },
                                },
                                '401': {$ref: '#/components/responses/UnauthorizedError'},
                                '404': {$ref: '#/components/responses/NotFoundError'},
                            },
                        },
                    },

                    '/notifications/{id}': {
                        delete: {
                            tags: ['🔔 Notifications'],
                            summary: 'Delete notification',
                            description: 'Delete a specific notification',
                            security: [{bearerAuth: []}],
                            parameters: [
                                {$ref: '#/components/parameters/IdParam'},
                            ],
                            responses: {
                                '200': {
                                    description: 'Notification deleted',
                                    content: {
                                        'application/json': {
                                            example: {
                                                success: true,
                                                message: 'Notification deleted successfully',
                                            },
                                        },
                                    },
                                },
                                '401': {$ref: '#/components/responses/UnauthorizedError'},
                                '404': {$ref: '#/components/responses/NotFoundError'},
                            },
                        },
                    },

                    // ==================== WEBHOOK ENDPOINTS ====================
                    '/webhooks/stripe': {
                        post: {
                            tags: ['🛡️ Webhooks'],
                            summary: 'Stripe webhook',
                            description: 'Handle Stripe webhook events',
                            requestBody: {
                                required: true,
                                content: {
                                    'application/json': {
                                        schema: {
                                            type: 'object',
                                            properties: {
                                                id: {type: 'string'},
                                                type: {type: 'string'},
                                                data: {type: 'object'},
                                            },
                                        },
                                    },
                                },
                            },
                            responses: {
                                '200': {
                                    description: 'Webhook processed successfully',
                                    content: {
                                        'application/json': {
                                            example: {
                                                received: true,
                                            },
                                        },
                                    },
                                },
                                '400': {
                                    description: 'Invalid webhook signature',
                                    content: {
                                        'application/json': {
                                            example: {
                                                success: false,
                                                error: 'Invalid webhook signature',
                                                code: 'INVALID_SIGNATURE',
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },

                    // ==================== CHAT ENDPOINTS ====================
                    '/chat/conversations': {
                        get: {
                            tags: ['💬 Chat'],
                            summary: 'Get conversations',
                            description: 'Get all conversations for current user',
                            security: [{bearerAuth: []}],
                            parameters: [
                                {$ref: '#/components/parameters/PageParam'},
                                {$ref: '#/components/parameters/LimitParam'},
                            ],
                            responses: {
                                '200': {
                                    description: 'List of conversations',
                                    content: {
                                        'application/json': {
                                            example: {
                                                success: true,
                                                data: {
                                                    conversations: [
                                                        {
                                                            id: '123e4567-e89b-12d3-a456-426614174013',
                                                            otherUser: {
                                                                id: '123e4567-e89b-12d3-a456-426614174000',
                                                                firstName: 'John',
                                                                lastName: 'Doe',
                                                                avatar: 'https://example.com/avatar.jpg',
                                                            },
                                                            lastMessage: {
                                                                content: 'Hello!',
                                                                timestamp: '2024-01-15T10:30:00.000Z',
                                                            },
                                                            unreadCount: 2,
                                                        },
                                                    ],
                                                    pagination: {$ref: '#/components/schemas/Pagination'},
                                                },
                                            },
                                        },
                                    },
                                },
                                '401': {$ref: '#/components/responses/UnauthorizedError'},
                            },
                        },
                    },

                    '/chat/conversations/{userId}': {
                        get: {
                            tags: ['💬 Chat'],
                            summary: 'Get conversation',
                            description: 'Get conversation with specific user',
                            security: [{bearerAuth: []}],
                            parameters: [
                                {$ref: '#/components/parameters/UserIdParam'},
                                {$ref: '#/components/parameters/PageParam'},
                                {$ref: '#/components/parameters/LimitParam'},
                            ],
                            responses: {
                                '200': {
                                    description: 'Conversation messages',
                                    content: {
                                        'application/json': {
                                            example: {
                                                success: true,
                                                data: {
                                                    conversation: {
                                                        userId: '123e4567-e89b-12d3-a456-426614174000',
                                                        user: {
                                                            id: '123e4567-e89b-12d3-a456-426614174000',
                                                            firstName: 'John',
                                                            lastName: 'Doe',
                                                        },
                                                        messages: [
                                                            {
                                                                id: '123e4567-e89b-12d3-a456-426614174014',
                                                                content: 'Hello!',
                                                                senderId: '123e4567-e89b-12d3-a456-426614174000',
                                                                timestamp: '2024-01-15T10:30:00.000Z',
                                                                read: true,
                                                            },
                                                        ],
                                                    },
                                                    pagination: {$ref: '#/components/schemas/Pagination'},
                                                },
                                            },
                                        },
                                    },
                                },
                                '401': {$ref: '#/components/responses/UnauthorizedError'},
                                '404': {
                                    description: 'Conversation not found',
                                    content: {
                                        'application/json': {
                                            example: {
                                                success: false,
                                                error: 'Conversation not found',
                                                code: 'CONVERSATION_NOT_FOUND',
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        post: {
                            tags: ['💬 Chat'],
                            summary: 'Send message',
                            description: 'Send a message to a user',
                            security: [{bearerAuth: []}],
                            parameters: [
                                {$ref: '#/components/parameters/UserIdParam'},
                            ],
                            requestBody: {
                                required: true,
                                content: {
                                    'application/json': {
                                        schema: {
                                            type: 'object',
                                            required: ['content'],
                                            properties: {
                                                content: {
                                                    type: 'string',
                                                    example: 'Hello! Is the camera available?'
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                            responses: {
                                '201': {
                                    description: 'Message sent',
                                    content: {
                                        'application/json': {
                                            example: {
                                                success: true,
                                                data: {
                                                    message: {
                                                        id: '123e4567-e89b-12d3-a456-426614174014',
                                                        content: 'Hello!',
                                                        senderId: '123e4567-e89b-12d3-a456-426614174004',
                                                        timestamp: '2024-01-15T10:30:00.000Z',
                                                    },
                                                },
                                                message: 'Message sent successfully',
                                            },
                                        },
                                    },
                                },
                                '401': {$ref: '#/components/responses/UnauthorizedError'},
                                '400': {
                                    description: 'Cannot send message to yourself',
                                    content: {
                                        'application/json': {
                                            example: {
                                                success: false,
                                                error: 'Cannot send message to yourself',
                                                code: 'SELF_MESSAGE',
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },

                    '/chat/conversations/{userId}/read': {
                        post: {
                            tags: ['💬 Chat'],
                            summary: 'Mark as read',
                            description: 'Mark all messages in conversation as read',
                            security: [{bearerAuth: []}],
                            parameters: [
                                {$ref: '#/components/parameters/UserIdParam'},
                            ],
                            responses: {
                                '200': {
                                    description: 'Messages marked as read',
                                    content: {
                                        'application/json': {
                                            example: {
                                                success: true,
                                                message: 'Messages marked as read',
                                            },
                                        },
                                    },
                                },
                                '401': {$ref: '#/components/responses/UnauthorizedError'},
                            },
                        },
                    },
                },
            },
        },
    },
    apis: ['./routes/*.js',           // Основные маршруты
        './routes/**/*.js',        // Вложенные маршруты// TypeScript файлы (если есть)// TypeScript вложенные файлы
        './controllers/*.js',      // Контроллеры (если используете JSDoc там)
        './controllers/**/*.js'
    ]// Вложенные контроллеры], // путь к файлам с маршрутами
};

const specs = swaggerJsdoc(options);

const swaggerDocs = (app) => {
    // Swagger UI
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
        explorer: true,
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'RentShare API Documentation',
    }));

    // Docs in JSON format
    app.get('/api-docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(specs);
    });

    console.log('📚 Swagger docs available at http://localhost:3000/api-docs');
    console.log('📄 Swagger JSON available at http://localhost:3000/api-docs.json');
};

export default swaggerDocs;