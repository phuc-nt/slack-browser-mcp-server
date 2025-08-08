import winston from 'winston';
// Create logger instance before config to avoid circular dependency
const createLogger = () => {
    const logLevel = process.env.LOG_LEVEL || 'info';
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const formats = [
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
    ];
    if (isDevelopment) {
        formats.push(winston.format.colorize(), winston.format.printf(({ timestamp, level, message, ...meta }) => {
            let log = `${timestamp} [${level}] ${message}`;
            if (Object.keys(meta).length > 0) {
                log += ` ${JSON.stringify(meta, null, 2)}`;
            }
            return log;
        }));
    }
    else {
        formats.push(winston.format.json());
    }
    return winston.createLogger({
        level: logLevel,
        format: winston.format.combine(...formats),
        transports: [
            new winston.transports.Console({
                handleExceptions: true,
                handleRejections: true,
            }),
        ],
        exitOnError: false,
    });
};
export const logger = createLogger();
// Log startup info
logger.info('Logger initialized', {
    level: logger.level,
    environment: process.env.NODE_ENV || 'development',
});
//# sourceMappingURL=logger.js.map