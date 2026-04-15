const fs = require('fs');
const path = require('path');
const config = require('./config');

const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

class Logger {
  log(level, message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level}] ${message}`);
  }
  error(message) { this.log('ERROR', message); }
  info(message) { this.log('INFO', message); }
  debug(message) { this.log('DEBUG', message); }
}

module.exports = new Logger();
