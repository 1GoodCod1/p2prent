import rateLimit from 'express-rate-limit';

// Создаем middleware функции
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 100, // лимит на IP
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.'
    }
});

export const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 час
    max: 10,
    message: {
        success: false,
        error: 'Too many authentication attempts, please try again later.'
    }
});

export const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    message: {
        success: false,
        error: 'Too many uploads, please try again later.'
    }
});

// Вариант 1: Экспортируйте по умолчанию ОДНУ функцию (apiLimiter)