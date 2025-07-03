import winston from 'winston';

const { combine, timestamp, json } = winston.format;

// Create logs directory if it doesn't exist
const fs = require('fs');
const path = require('path');

const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp(),
    json()
  ),
  transports: [
    // Console output
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    // Error logs
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
    }),
    // Combined logs
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
    }),
  ],
  exitOnError: false, // Don't exit on handled exceptions
});

// Create a stream for morgan (HTTP request logging)
export const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

export default logger;
