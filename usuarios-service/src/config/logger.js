/**
 * Logger Configuration
 * Sistema de logging
 */

const fs = require('fs');
const path = require('path');
const config = require('./config');

// Crear directorio de logs si no existe
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

class Logger {
  constructor() {
    this.level = levels[config.logging.level] || levels.info;
  }

  format(level, message) {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  }

  log(level, message) {
    if (levels[level] <= this.level) {
      const formatted = this.format(level, message);
      console.log(formatted);
      
      if (level === 'error') {
        const errorLog = path.join(logsDir, 'error.log');
        fs.appendFileSync(errorLog, formatted + '\n');
      }
    }
  }

  error(message) { this.log('error', message); }
  warn(message) { this.log('warn', message); }
  info(message) { this.log('info', message); }
  debug(message) { this.log('debug', message); }
}

module.exports = new Logger();
