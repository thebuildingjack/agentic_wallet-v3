import pino from 'pino';
import { config } from './config.js';

export const logger = pino({
  level: config.LOG_LEVEL,
  redact: {
    paths: [
      'secretKey',
      'privateKey',
      'encryptedPrivateKey',
      'masterKey',
      'funderSecretKey',
      'FUNDER_SECRET_KEY',
      '*.secretKey',
      '*.privateKey',
      '*.encryptedPrivateKey',
      '*.funderSecretKey',
      'req.headers["x-api-key"]',
    ],
    censor: '[REDACTED]',
  },
  transport:
    process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
      : undefined,
});
