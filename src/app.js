import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import swaggerDocs from './docs/swagger.js';

import logger from './config/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
// import passport from './config/passport.js';
import { ChatWebSocket } from './websocket/chat.js';
import rentalJobs from './jobs/rentalJobs.js';
import vipJobs from './jobs/vipJobs.js';

// Import routes
import routes from './routes/index.js';

// ES модули не имеют __dirname, создаем его
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize WebSocket
const chatWebSocket = new ChatWebSocket(server);

// Initialize scheduled jobs
rentalJobs.init();
vipJobs.init();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://api.stripe.com", "ws://localhost:5000"],
        },
    },
}));

// CORS configuration
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3001',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Логируем все входящие запросы
app.use((req, res, next) => {
    logger.info(`Incoming request: ${req.method} ${req.url}`);
    next();
});

logger.info('Server started successfully');

swaggerDocs(app);

// Initialize passport
// app.use(passport.initialize());

// Static files
// app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use((req, res, next) => {
    console.log('=== REQUEST DETAILS ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('IP:', req.ip);
    console.log('=== END REQUEST ===');
    next();
});
// API routes
app.use('/api', routes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'RentShare API',
        version: '1.0.0',
        websocket: chatWebSocket ? 'connected' : 'disconnected',
    });
});

// 404 handler
app.use((req, res, next) => {
    logger.warn(`Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method
    });
});

// Global error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    logger.info(`API URL: http://localhost:${PORT}/api/v1`);
    logger.info(`Health check: http://localhost:${PORT}/health`);

    // Тестируем подключение к БД
    import('./config/database.js').then(async ({ prisma }) => {
        try {
            await prisma.$connect();
            logger.info('Database connection successful');
        } catch (error) {
            logger.error('Database connection failed:', error);
        }
    });
});

// Export for testing
export { app, server };