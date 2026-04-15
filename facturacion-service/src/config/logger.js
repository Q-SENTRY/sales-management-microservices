class Logger {
  log(level, message) {
    console.log(`[${new Date().toISOString()}] [${level}] ${message}`);
  }
  error(m) { this.log('ERROR', m); }
  info(m) { this.log('INFO', m); }
}
module.exports = new Logger();
